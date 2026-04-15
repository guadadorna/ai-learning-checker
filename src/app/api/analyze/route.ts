import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const analysisSchema = z.object({
  overallCategory: z.string().describe("La categoria predominante del uso de AI en esta conversacion"),
  status: z.enum(["prohibited", "discouraged", "allowed", "encouraged"]).describe("El estado segun el semaforo"),
  exchanges: z.array(z.object({
    userMessage: z.string().describe("Resumen del mensaje del usuario"),
    aiResponse: z.string().describe("Resumen breve de la respuesta de la AI"),
    category: z.string().describe("Categoria de este intercambio especifico"),
    status: z.enum(["prohibited", "discouraged", "allowed", "encouraged"]),
    concern: z.string().optional().describe("Preocupacion especifica si la hay"),
  })).describe("Analisis de cada intercambio significativo"),
  summary: z.string().describe("Resumen general de como el estudiante uso la AI"),
  alerts: z.array(z.string()).describe("Alertas importantes sobre usos problematicos"),
  suggestions: z.array(z.string()).describe("Sugerencias concretas para mejorar el uso"),
  positives: z.array(z.string()).describe("Aspectos positivos del uso de AI"),
});

const ANALYSIS_PROMPT = `Sos un experto en educacion y uso productivo de AI para el aprendizaje. Tu tarea es analizar una conversacion entre un estudiante y una AI (ChatGPT, Claude, etc) y clasificarla segun el siguiente framework de categorias:

## CATEGORIAS DEL SEMAFORO (de peor a mejor para el aprendizaje):

### ROJO - PROHIBIDO
**"Do All the Work for Me" (Que haga todo el trabajo)**
- El estudiante pide que la AI complete una tarea entera por el
- Ejemplos: "Haceme este ensayo", "Resolveme este parcial", "Escribi el codigo completo"
- Indicadores: Pega consignas enteras, pide que imite su estilo, no hay esfuerzo previo
- Status: "prohibited"

### NARANJA - DESALENTADO
**"Do My Busywork" (Que haga mi trabajo tedioso)**
- El estudiante delega partes que considera aburridas o repetitivas
- Ejemplos: "Resumime este articulo para el foro", "Formateame las citas en APA"
- El estudiante no ve valor de aprendizaje en la tarea
- Status: "discouraged"

### AMARILLO - PERMITIDO
**"Get Me Going / Get Me Started" (Ayudame a arrancar)**
- El estudiante pide ayuda para empezar o desbloquearse
- Ejemplos: "Dame ideas para empezar", "Explicame las instrucciones", "Dame una pista"
- Importante: El estudiante aclara que NO quiere que le hagan el trabajo
- Status: "allowed"

**"Give Me Feedback" (Dame feedback)**
- El estudiante muestra su trabajo y pide retroalimentacion
- Ejemplos: "Revisa mi borrador", "Que le falta?", "Como puedo mejorar esto?"
- La AI actua como tutor critico, no como hacedor
- Status: "allowed"

### VERDE - ALENTADO
**"Help Me Learn" (Ayudame a aprender)**
- El estudiante usa la AI para entender conceptos
- Ejemplos: "Explicame X como si fuera principiante", "Poneme a prueba sobre Y"
- Uso pedagogico activo, el estudiante busca comprender
- Status: "encouraged"

**"Magnify My Work" (Amplifica mi trabajo)**
- El estudiante va MAS ALLA de lo requerido
- Ejemplos: "Quiero explorar esto en mas profundidad", "Ayudame a conectar con otros temas"
- El estudiante usa AI para expandir, no para cumplir minimos
- Status: "encouraged"

## INSTRUCCIONES DE ANALISIS:

1. Lee toda la conversacion cuidadosamente
2. Identifica cada intercambio significativo (pregunta del estudiante -> respuesta de AI)
3. Clasifica cada intercambio en una de las 6 categorias
4. Determina la categoria PREDOMINANTE para el status general
5. Genera alertas especificas si hay usos problematicos
6. Da sugerencias CONCRETAS y ACCIONABLES para mejorar
7. Reconoce lo que el estudiante hizo bien

## FORMATO DE RESPUESTA:
Responde en espanol rioplatense (vos, che, etc). Se directo pero empatico. El objetivo es ayudar al estudiante a mejorar, no castigarlo.

## CONVERSACION A ANALIZAR:
`;

async function analyzeWithGemini(conversationText: string, pdfBase64?: string) {
  // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if unavailable
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of models) {
    try {
      if (pdfBase64) {
        // Use multimodal for PDF
        const { object: analysis } = await generateObject({
          model: google(modelName),
          schema: analysisSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: ANALYSIS_PROMPT + "\n\n[El contenido de la conversacion esta en el PDF adjunto]",
                },
                {
                  type: "file",
                  data: pdfBase64,
                  mediaType: "application/pdf",
                },
              ],
            },
          ],
        });
        return analysis;
      } else {
        // Text only
        const maxChars = 30000;
        let text = conversationText;
        if (text.length > maxChars) {
          text = text.slice(0, maxChars) + "\n\n[... conversacion truncada por longitud ...]";
        }

        const { object: analysis } = await generateObject({
          model: google(modelName),
          schema: analysisSchema,
          prompt: ANALYSIS_PROMPT + text,
        });
        return analysis;
      }
    } catch (error) {
      const isLastModel = modelName === models[models.length - 1];
      if (isLastModel) {
        throw error;
      }
      console.log(`Model ${modelName} failed, trying next...`);
    }
  }

  throw new Error("Todos los modelos fallaron");
}

async function fetchChatGPTShare(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo acceder al link compartido");
  }
  const html = await response.text();

  const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]*)<\/script>/);
  if (scriptMatch) {
    try {
      const data = JSON.parse(scriptMatch[1]);
      const messages = data?.props?.pageProps?.serverResponse?.data?.linear_conversation;
      if (messages && Array.isArray(messages)) {
        return messages
          .filter((m: { message?: { author?: { role?: string }; content?: { parts?: string[] } } }) => m.message?.author?.role && m.message?.content?.parts)
          .map((m: { message: { author: { role: string }; content: { parts: string[] } } }) => {
            const role = m.message.author.role === "user" ? "Usuario" : "ChatGPT";
            const content = m.message.content.parts.join("\n");
            return `${role}: ${content}`;
          })
          .join("\n\n");
      }
    } catch {
      // Fall through
    }
  }

  const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return textContent;
}

async function fetchClaudeShare(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo acceder al link de Claude");
  }
  const html = await response.text();
  const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return textContent;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let conversationText = "";
    let pdfBase64: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // PDF upload - send directly to Gemini
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No se envio ningun archivo" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    } else {
      // JSON: text or link
      const body = await request.json();

      if (body.link) {
        const url = body.link.trim();

        if (url.includes("chatgpt.com/share") || url.includes("chat.openai.com/share")) {
          conversationText = await fetchChatGPTShare(url);
        } else if (url.includes("claude.ai/share")) {
          return NextResponse.json(
            { error: "Los links de Claude requieren login y no se pueden leer automaticamente. Por favor usa 'Pegar texto' y copia la conversacion manualmente." },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "Link no soportado. Por ahora solo funcionan links de ChatGPT (chatgpt.com/share/...). Para Claude, usa 'Pegar texto'." },
            { status: 400 }
          );
        }
      } else if (body.conversation) {
        conversationText = body.conversation;
      } else {
        return NextResponse.json({ error: "No se envio conversacion, PDF ni link" }, { status: 400 });
      }
    }

    if (!pdfBase64 && (!conversationText || conversationText.trim().length < 50)) {
      return NextResponse.json(
        { error: "El contenido es muy corto. Necesito mas texto para analizar." },
        { status: 400 }
      );
    }

    const analysis = await analyzeWithGemini(conversationText, pdfBase64);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Error analyzing conversation:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al analizar: ${message}` },
      { status: 500 }
    );
  }
}
