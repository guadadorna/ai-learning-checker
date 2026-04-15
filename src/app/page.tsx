"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  Link,
} from "lucide-react";
import { AnalysisResult } from "./components/AnalysisResult";

export type CategoryStatus = "prohibited" | "discouraged" | "allowed" | "encouraged";

export interface ConversationAnalysis {
  overallCategory: string;
  status: CategoryStatus;
  exchanges: {
    userMessage: string;
    aiResponse: string;
    category: string;
    status: CategoryStatus;
    concern?: string;
  }[];
  summary: string;
  alerts: string[];
  suggestions: string[];
  positives: string[];
}

type InputMode = "text" | "pdf" | "link";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("text");
  const [conversation, setConversation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const analyzeConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      let response: Response;

      if (mode === "pdf" && file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else if (mode === "link" && link.trim()) {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link: link.trim() }),
        });
      } else if (mode === "text" && conversation.trim()) {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation }),
        });
      } else {
        setError("Por favor ingresa una conversacion, subi un PDF o pega un link");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al analizar");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setConversation("");
    setFile(null);
    setLink("");
    setAnalysis(null);
    setError(null);
  };

  const canAnalyze = () => {
    if (mode === "text") return conversation.trim().length > 0;
    if (mode === "pdf") return file !== null;
    if (mode === "link") return link.trim().length > 0;
    return false;
  };

  const tabs = [
    { id: "text" as const, label: "Pegar texto", icon: MessageSquare },
    { id: "pdf" as const, label: "Subir PDF", icon: FileText },
    { id: "link" as const, label: "Link compartido", icon: Link },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            AI Learning Checker
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analiza tu conversacion con ChatGPT, Claude o cualquier AI y descubri
            como la estas usando para aprender.
          </p>
        </header>

        {!analysis ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMode(tab.id);
                    setError(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
                    mode === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Text input */}
            {mode === "text" && (
              <div className="mb-4">
                <textarea
                  value={conversation}
                  onChange={(e) => setConversation(e.target.value)}
                  placeholder="Copia y pega toda la conversacion que tuviste con la AI...

Ejemplo:
Yo: Explicame que es la fotosintesis
ChatGPT: La fotosintesis es el proceso por el cual..."
                  className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-700 placeholder:text-slate-400"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Tip: En ChatGPT o Claude, selecciona todo (Ctrl+A / Cmd+A) y copia.
                </p>
              </div>
            )}

            {/* PDF upload */}
            {mode === "pdf" && (
              <div className="mb-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : file
                      ? "border-green-500 bg-green-50"
                      : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-green-600" />
                      <p className="text-lg font-medium text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500">Click para cambiar archivo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-slate-400" />
                      <p className="text-lg font-medium text-slate-700">
                        {isDragActive ? "Solta el archivo aca..." : "Arrastra tu PDF o hace click"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Podes imprimir la conversacion a PDF (Ctrl+P → Guardar como PDF)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Link input */}
            {mode === "link" && (
              <div className="mb-4">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://chatgpt.com/share/..."
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
                />
                <p className="text-sm text-slate-500 mt-2">
                  En ChatGPT: Menu → Compartir → Crear link. Pega el link aca.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={analyzeConversation}
              disabled={!canAnalyze() || loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                !canAnalyze() || loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando conversacion...
                </>
              ) : (
                "Analizar Conversacion"
              )}
            </button>

            <div className="mt-8 p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-700 mb-3">
                El Semaforo del Uso de AI
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">
                    <strong>Prohibido:</strong> Que la AI haga todo el trabajo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-slate-600">
                    <strong>Desalentado:</strong> Que la AI haga tu trabajo tedioso
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-slate-600">
                    <strong>Permitido:</strong> Ayuda para arrancar o feedback
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-600">
                    <strong>Alentado:</strong> Aprender o amplificar tu trabajo
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisResult analysis={analysis} onReset={reset} />
        )}
      </div>
    </div>
  );
}
