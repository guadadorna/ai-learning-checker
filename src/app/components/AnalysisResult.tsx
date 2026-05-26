"use client";

import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import type { ConversationAnalysis, CategoryStatus } from "../page";
import { Semaforo } from "./Semaforo";

const statusConfig: Record<
  CategoryStatus,
  { color: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  Prohibido: {
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    dotColor: "bg-red-500",
  },
  Desalentado: {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    dotColor: "bg-orange-500",
  },
  Permitido: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    dotColor: "bg-yellow-500",
  },
  Fomentado: {
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    dotColor: "bg-green-500",
  },
};

const categoriaConfig: Record<string, { dotColor: string; label: string }> = {
  DO_ALL_THE_WORK: { dotColor: "bg-red-500", label: "Prohibido" },
  DO_MY_BUSYWORK: { dotColor: "bg-orange-500", label: "Desalentado" },
  GET_ME_STARTED: { dotColor: "bg-yellow-500", label: "Permitido" },
  GIVE_ME_FEEDBACK: { dotColor: "bg-yellow-500", label: "Permitido" },
  HELP_ME_LEARN: { dotColor: "bg-green-500", label: "Fomentado" },
  MAGNIFY_MY_WORK: { dotColor: "bg-green-500", label: "Fomentado" },
};

// Accent color per categoria (used for header line, card bg, section titles, table header)
const pdfColors: Record<string, [number, number, number]> = {
  DO_ALL_THE_WORK:  [204,   0,   0],   // #CC0000
  DO_MY_BUSYWORK:   [230, 130,  10],   // #E6820A
  GET_ME_STARTED:   [230, 168,  23],   // #E6A817
  GIVE_ME_FEEDBACK: [230, 168,  23],   // #E6A817
  HELP_ME_LEARN:    [  0, 170,  68],   // #00AA44
  MAGNIFY_MY_WORK:  [  0, 170,  68],   // #00AA44
};

interface Props {
  analysis: ConversationAnalysis;
  onReset: () => void;
}

export function AnalysisResult({ analysis, onReset }: Props) {
  const [showExchanges, setShowExchanges] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const config = statusConfig[analysis.estado] ?? statusConfig["Permitido"];

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW  = doc.internal.pageSize.getWidth();   // 210
      const pageH  = doc.internal.pageSize.getHeight();  // 297
      const margin = 15;
      const cW     = pageW - margin * 2;                 // 180
      const footerY = pageH - 12;

      const accent: [number,number,number] = pdfColors[analysis.categoria] ?? [100, 100, 100];
      const BLACK:  [number,number,number] = [20,  20,  20];
      const GRAY:   [number,number,number] = [130, 130, 130];
      const WHITE:  [number,number,number] = [255, 255, 255];

      // ── HEADER ──────────────────────────────────────────────────────────
      const now = new Date();
      const dateStr = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      doc.setTextColor(...BLACK);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("AI Learning Checker", margin, 17);

      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Resultado del análisis pedagógico", margin, 24);
      doc.text(`${dateStr}  ${timeStr}`, pageW - margin, 17, { align: "right" });

      // Colored separator line
      doc.setDrawColor(...accent);
      doc.setLineWidth(1);
      doc.line(margin, 29, pageW - margin, 29);

      let y = 38;

      // ── CARD DE RESULTADO PRINCIPAL ───────────────────────────────────────
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, cW, 16, 3, 3, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(analysis.categoria.replace(/_/g, " "), margin + 6, y + 10.5);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(analysis.estado, pageW - margin - 6, y + 10.5, { align: "right" });
      y += 24;

      // ── RESUMEN ───────────────────────────────────────────────────────────
      doc.setTextColor(...BLACK);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      const resumenLines = doc.splitTextToSize(analysis.resumen, cW);
      doc.text(resumenLines, margin, y);
      y += resumenLines.length * 5 + 10;

      // helpers ─────────────────────────────────────────────────────────────
      const checkBreak = (needed: number) => {
        if (y + needed > footerY - 10) { doc.addPage(); y = margin + 5; }
      };

      const sectionTitle = (label: string, color: [number,number,number]) => {
        checkBreak(12);
        doc.setTextColor(...color);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        y += 7;
      };

      const bulletItem = (text: string) => {
        const lines = doc.splitTextToSize(text, cW - 8);
        const needed = lines.length * 5 + 3;
        checkBreak(needed);
        doc.setTextColor(...BLACK);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.text("•", margin + 2, y);
        doc.text(lines, margin + 7, y);
        y += needed;
      };

      // ── ALERTAS ──────────────────────────────────────────────────────────
      if (analysis.alertas.length > 0) {
        sectionTitle("Alertas", accent);
        for (const a of analysis.alertas) bulletItem(a);
        y += 4;
      }

      // ── LO QUE HICISTE BIEN ──────────────────────────────────────────────
      if (analysis.positivos.length > 0) {
        sectionTitle("Lo que hiciste bien", accent);
        for (const p of analysis.positivos) bulletItem(p);
        y += 4;
      }

      // ── SUGERENCIAS ───────────────────────────────────────────────────────
      if (analysis.sugerencias.length > 0) {
        sectionTitle("Sugerencias de mejora", BLACK);
        for (const s of analysis.sugerencias) bulletItem(s);
        y += 4;
      }

      // ── ANÁLISIS DETALLADO ────────────────────────────────────────────────
      if (analysis.intercambios.length > 0) {
        checkBreak(20);
        sectionTitle("Análisis detallado", BLACK);

        autoTable(doc, {
          startY: y,
          head: [["Mensaje del alumno", "Categoría", "Observación pedagógica"]],
          body: analysis.intercambios.map((ix) => [
            ix.mensaje_alumno.length > 200
              ? ix.mensaje_alumno.slice(0, 200) + "…"
              : ix.mensaje_alumno,
            ix.categoria.replace(/_/g, " "),
            ix.observacion,
          ]),
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 8.5,
            cellPadding: 3,
            lineColor: [210, 210, 210],
            lineWidth: 0.25,
            textColor: BLACK,
          },
          headStyles: {
            fillColor: accent,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 9,
          },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 37 },
            2: { cellWidth: 78 },
          },
        });
      }

      // ── FOOTER en todas las páginas ───────────────────────────────────────
      const totalPages = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1;
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY, pageW - margin, footerY);
        doc.setTextColor(...GRAY);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("Generado por AI Learning Checker", margin, footerY + 6);
        doc.text(`Página ${pg} de ${totalPages}`, pageW - margin, footerY + 6, { align: "right" });
      }

      doc.save("analisis-ai-learning-checker.pdf");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-2">
        {/* Overall Result */}
        <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-8`}>
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${config.color}`}>
                  {analysis.categoria.replace(/_/g, " ")}
                </h2>
                <p className={`text-sm ${config.color} opacity-75`}>
                  Estado: {analysis.estado}
                </p>
              </div>
              <p className="text-slate-700 text-lg">{analysis.resumen}</p>
            </div>
            <div className="flex-shrink-0">
              <Semaforo mode="result" categoria={analysis.categoria} />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {analysis.alertas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-700 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Alertas
            </h3>
            <ul className="space-y-3">
              {analysis.alertas.map((alerta, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                  <span className="text-slate-700">{alerta}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {analysis.sugerencias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700 mb-4">
              <Lightbulb className="w-5 h-5" />
              Sugerencias de Mejora
            </h3>
            <ul className="space-y-3">
              {analysis.sugerencias.map((sugerencia, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                  <span className="text-slate-700">{sugerencia}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positives */}
        {analysis.positivos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700 mb-4">
              <CheckCircle className="w-5 h-5" />
              Aspectos Positivos
            </h3>
            <ul className="space-y-3">
              {analysis.positivos.map((positivo, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                  <span className="text-slate-700">{positivo}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Exchanges */}
        {analysis.intercambios.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setShowExchanges(!showExchanges)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-slate-700">
                Analisis Detallado ({analysis.intercambios.length} intercambios)
              </h3>
              {showExchanges ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {showExchanges && (
              <div className="mt-4 space-y-4">
                {analysis.intercambios.map((intercambio, i) => {
                  const cat = categoriaConfig[intercambio.categoria] ?? {
                    dotColor: "bg-slate-400",
                    label: intercambio.categoria,
                  };
                  return (
                    <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cat.dotColor}`}></span>
                        <span className="font-medium text-slate-700 text-sm">
                          {intercambio.categoria.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Mensaje del alumno:</p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                            {intercambio.mensaje_alumno.length > 200
                              ? intercambio.mensaje_alumno.slice(0, 200) + "..."
                              : intercambio.mensaje_alumno}
                          </p>
                        </div>
                        {intercambio.observacion && (
                          <div className="text-sm text-slate-700 bg-blue-50 p-2 rounded">
                            <strong>Observacion:</strong> {intercambio.observacion}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-3 shadow-md"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar PDF
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-5 h-5" />
          Analizar Otra Conversacion
        </button>
      </div>
    </div>
  );
}
