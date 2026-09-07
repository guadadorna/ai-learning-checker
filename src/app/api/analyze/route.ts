import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase";

const analysisSchema = z.object({
  categoria: z.enum([
    "DO_ALL_THE_WORK",
    "DO_MY_BUSYWORK",
    "GET_ME_STARTED",
    "GIVE_ME_FEEDBACK",
    "HELP_ME_LEARN",
    "MAGNIFY_MY_WORK",
  ]).describe("La categoria predominante del uso de AI en esta conversacion"),
  estado: z.enum(["Prohibido", "Desalentado", "Permitido", "Fomentado"]).describe("El estado segun el semaforo"),
  resumen: z.string().describe("2-3 oraciones explicando el diagnostico principal"),
  alertas: z.array(z.string()).describe("Alertas importantes sobre usos problematicos"),
  positivos: z.array(z.string()).describe("Aspectos positivos del uso de AI"),
  sugerencias: z.array(z.string()).describe("Sugerencias concretas para mejorar el uso"),
  intercambios: z.array(z.object({
    mensaje_alumno: z.string().describe("Resumen anonimizado del mensaje del alumno"),
    categoria: z.string().describe("Categoria asignada a este intercambio"),
    observacion: z.string().describe("Observacion pedagogica sobre este intercambio"),
  })).describe("Analisis de cada intercambio significativo"),
  conversacion_anonimizada: z.string().describe("La conversacion completa con datos personales reemplazados por [DATO_ANONIMIZADO]"),
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

## INSTRUCCIONES DE ANONIMIZACION:
Antes de procesar la conversacion, detecta y elimina cualquier dato personal identificable: nombres propios, apellidos, emails, numeros de telefono, DNI, direcciones, o cualquier informacion que pueda identificar a una persona. Reemplazalos por [DATO_ANONIMIZADO].
En el campo conversacion_anonimizada, devuelve la conversacion completa con esos reemplazos aplicados.

## EJEMPLOS DE CLASIFICACION:

EJEMPLO ROJO (prohibited):
Estudiante: "Tengo que entregar un ensayo sobre la Revolucion Francesa. Escribimelo de 1500 palabras."
→ Clasificacion: DO_ALL_THE_WORK. El estudiante delega completamente la tarea sin esfuerzo propio.

EJEMPLO VERDE (encouraged):
Estudiante: "Ya escribi mi ensayo sobre la Revolucion Francesa. No entiendo bien por que fue tan importante la Declaracion de los Derechos del Hombre. Explicame el contexto historico para que pueda profundizar mi argumento."
→ Clasificacion: HELP_ME_LEARN. El estudiante hizo su trabajo y usa la AI para comprender mejor.

## FORMATO DE RESPUESTA:
- Usa espanol rioplatense pero con tono PROFESIONAL y SERIO. Nada de "copado", "re bien", "genial", "che" ni expresiones juveniles o coloquiales.
- Se CRITICO y EXIGENTE. Tu rol es ayudar a mejorar, no felicitar.
- Si hay aspectos positivos, mencionarlos brevemente sin exagerar. Enfocate mas en que puede mejorar.
- La categoria general debe reflejar un promedio ponderado que tire para abajo. Los usos problematicos pesan mas que los buenos, pero un solo desliz no deberia arruinar toda la evaluacion si el resto fue correcto.
- Evita frases como "muy bien", "excelente", "fantastico". Preferi un tono neutro y analitico.
- Se consistente: si en los intercambios individuales senialas problemas, la evaluacion general debe reflejarlo.

## CONVERSACION A ANALIZAR:
`;

async function analyzeWithGemini(conversationText: string, pdfBase64?: string) {
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      if (pdfBase64) {
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
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      console.log(`Model ${modelName} failed:`, errorMessage);
      const isLastModel = modelName === models[models.length - 1];
      if (isLastModel) {
        throw error;
      }
      console.log(`Trying next model...`);
    }
  }

  throw new Error("Todos los modelos fallaron");
}

async function saveToSupabase(analysis: z.infer<typeof analysisSchema>) {
  console.log("Saving to Supabase:", { categoria: analysis.categoria });
  const { error } = await getSupabaseClient().from("analisis").insert({
    conversacion_anonimizada: analysis.conversacion_anonimizada,
    categoria: analysis.categoria,
    estado: analysis.estado,
    resumen: analysis.resumen,
    alertas: analysis.alertas,
    positivos: analysis.positivos,
    sugerencias: analysis.sugerencias,
    intercambios: analysis.intercambios,
  });

  if (error) {
    console.error("Error saving to Supabase:", error);
  } else {
    console.log("Saved to Supabase OK");
  }
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

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let conversationText = "";
    let pdfBase64: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No se envio ningun archivo" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    } else {
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

    await saveToSupabase(analysis);

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
