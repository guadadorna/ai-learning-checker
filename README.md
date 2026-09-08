# AI Learning Checker

App web que analiza conversaciones de alumnos con AI (ChatGPT, Claude, etc.) y devuelve feedback sobre cómo las están usando para aprender, según el framework de Olmanson et al.

Producción: https://ai-learning-checker.vercel.app

## Stack

- Next.js 16 (App Router) + Tailwind
- Gemini 3.5 Flash vía Vercel AI SDK (`@ai-sdk/google`)
- Supabase para persistir los análisis
- Deploy en Vercel

## Setup

### 1. Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

- `GOOGLE_GENERATIVE_AI_API_KEY` — sacar de https://aistudio.google.com/app/apikey
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — sacar del proyecto de Supabase en Settings → API

### 2. Base de datos (Supabase)

Crear un proyecto en https://supabase.com, después en el SQL Editor pegar y correr el contenido de `supabase/schema.sql`. Eso crea la tabla `analisis` que la app usa para guardar cada análisis.

Recomendado: crear **dos** proyectos separados, uno para desarrollo y otro para producción. El `.env.local` apunta al de dev; las env vars de Vercel apuntan al de prod. Así las pruebas no contaminan los datos reales.

### 3. Correr local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000.

## Estructura

- `src/app/page.tsx` — UI principal con tabs (texto / PDF / link)
- `src/app/api/analyze/route.ts` — endpoint que llama a Gemini y guarda en Supabase
- `src/app/admin/page.tsx` — panel para ver análisis guardados
- `src/app/components/` — componentes (Semaforo, AnalysisResult)
- `src/lib/supabase.ts` — cliente Supabase
- `supabase/schema.sql` — schema de la tabla `analisis`

## Deploy

Push a `main` deploya automáticamente a Vercel. Las env vars de prod se configuran en el dashboard de Vercel (mismas variables que `.env.local` pero con las credenciales del proyecto de Supabase de prod).
