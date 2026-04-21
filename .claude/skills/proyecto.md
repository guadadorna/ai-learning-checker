# AI Learning Checker - Contexto del Proyecto

## Que es
App web para que alumnos universitarios suban sus conversaciones con AI (ChatGPT, Claude, etc) y reciban feedback sobre como las estan usando para aprender, basado en el framework de Olmanson et al.

## El Semaforo (Framework de Categorias)
| Color | Categoria | Status |
|-------|-----------|--------|
| ROJO | Do All the Work for Me | prohibited |
| NARANJA | Do My Busywork | discouraged |
| AMARILLO | Get Me Going / Give Me Feedback | allowed |
| VERDE | Help Me Learn / Magnify My Work | encouraged |

## Stack Tecnico
- **Framework**: Next.js 16 con App Router
- **Styling**: Tailwind CSS
- **AI**: Gemini 2.5 Flash via Vercel AI SDK (@ai-sdk/google)
- **Deploy**: Vercel
- **Repo**: https://github.com/guadadorna/ai-learning-checker

## Estructura de Archivos Clave
- `src/app/page.tsx` - UI principal con tabs (texto, PDF, link)
- `src/app/api/analyze/route.ts` - API que procesa y envia a Gemini
- `src/app/components/AnalysisResult.tsx` - Componente de resultados
- `.env.local` - API key de Gemini (GOOGLE_GENERATIVE_AI_API_KEY)

## Funcionalidades
1. **Pegar texto** - Copiar/pegar conversacion
2. **Subir PDF** - Gemini lo lee multimodal directamente
3. **Link compartido** - Solo ChatGPT (Claude requiere auth)

## Limitaciones Conocidas
- Links de Claude no funcionan (requieren login)
- Gemini 2.5 Flash a veces tiene alta demanda (hay fallback a otros modelos)
- API key de Gemini gratis tiene limites de quota

## Variables de Entorno en Vercel
- `GOOGLE_GENERATIVE_AI_API_KEY` - API key de Google AI Studio

## URLs
- **Produccion**: https://ai-learning-checker.vercel.app
- **Repo**: https://github.com/guadadorna/ai-learning-checker

## Paper de Referencia
El framework viene de: "AI Policy as Pedagogy: Guiding Student Learning with Generative AI" - Olmanson, Jeon, Hassani (University of Nebraska-Lincoln)

---

## Pendientes / Ideas Futuras
- [ ] Agregar historial de analisis (que el usuario pueda ver sus analisis anteriores)
- [ ] Mejorar parsing de links de ChatGPT (a veces falla)
- [ ] Investigar si hay forma de leer links de Claude
- [ ] Agregar opcion de exportar el analisis como PDF
- [ ] Agregar ejemplos de conversaciones buenas vs malas para que los alumnos entiendan
- [ ] Modo "profesor" para ver analisis de varios alumnos

---

## Modelos de Gemini
- **Principal**: `gemini-2.5-flash` (el mas nuevo y rapido)
- **Fallback**: `gemini-2.5-flash-lite` (version lite si el principal falla)
- Los modelos 2.0 ya no estan disponibles para nuevos usuarios de la API

## Registro de Sesiones

### 2026-04-21 - Fix de modelos Gemini
**Lo que se hizo:**
- Fix de error "model is no longer available to new users"
- Cambio de `gemini-2.0-flash` a `gemini-2.5-flash-lite` como fallback
- Generacion de iconos PNG estaticos (icon-192.png, icon-512.png) en public/

**Problemas encontrados:**
- `gemini-2.0-flash` y `gemini-2.0-flash-001` deprecados para nuevos usuarios
- `gemini-1.5-flash` tampoco disponible en v1beta para esta API key
- Solucion: usar solo modelos 2.5 (flash y flash-lite)

---

### 2026-04-15 - Sesion inicial
**Lo que se hizo:**
- Creacion del proyecto desde cero con Next.js 16
- Implementacion de las 3 formas de input (texto, PDF, link)
- Integracion con Gemini 2.5 Flash
- Deploy a Vercel (https://ai-learning-checker.vercel.app)
- Iconos dinamicos para iOS/Android
- Creacion de este skill de contexto
- Fix de tono: profesional y serio (sin expresiones juveniles)
- Fix de evaluacion: promedio ponderado que tira para abajo

**Problemas encontrados:**
- pdf-parse no compatible con Turbopack → solucion: Gemini lee PDFs directamente
- Links de Claude requieren auth → solucion: mensaje claro al usuario
- Modelos de Gemini cambian de nombre → solucion: fallback a multiples modelos
- Tono demasiado informal ("che", "copado") → solucion: prompt con instrucciones de tono profesional
- Evaluacion inconsistente (individual vs general) → solucion: promedio ponderado que tira para abajo

**Decisiones de diseno:**
- Espanol rioplatense pero PROFESIONAL (sin "che", "copado", "re bien")
- Tono neutro y analitico, critico pero justo
- Promedio ponderado que tira para abajo (problemas pesan mas, pero un desliz no arruina todo)
- Semaforo visual con colores

---

## Instrucciones para Claude
Cuando trabajes en este proyecto:
1. Actualiza este archivo al final de cada sesion con lo que se hizo
2. Mueve items de "Pendientes" a "completado" cuando se terminen
3. Agrega nuevos pendientes que surjan de la conversacion
4. Registra problemas y soluciones para no repetir errores
