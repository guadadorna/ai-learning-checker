"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Download, LogIn } from "lucide-react";

interface AnalysisRecord {
  id: string;
  created_at: string;
  categoria: string;
  estado: string;
  resumen: string;
  alertas: string[];
  positivos: string[];
  sugerencias: string[];
  intercambios: { mensaje_alumno: string; categoria: string; observacion: string }[];
  conversacion_anonimizada: string;
}

const estadoColors: Record<string, string> = {
  Prohibido: "bg-red-100 text-red-700",
  Desalentado: "bg-orange-100 text-orange-700",
  Permitido: "bg-yellow-100 text-yellow-700",
  Fomentado: "bg-green-100 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(records: AnalysisRecord[]) {
  const headers = ["Fecha", "Categoría", "Estado", "Resumen"];
  const rows = records.map((r) => [
    formatDate(r.created_at),
    r.categoria,
    r.estado,
    `"${(r.resumen ?? "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analisis_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExpandedRow({ record }: { record: AnalysisRecord }) {
  return (
    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-1">Resumen</h4>
        <p className="text-sm text-slate-600">{record.resumen}</p>
      </div>

      {record.alertas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-1">Alertas</h4>
          <ul className="space-y-1">
            {record.alertas.map((a, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.sugerencias?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-700 mb-1">Sugerencias</h4>
          <ul className="space-y-1">
            {record.sugerencias.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-blue-500 flex-shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.conversacion_anonimizada && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Conversación anonimizada</h4>
          <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {record.conversacion_anonimizada}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/records", {
        headers: { Authorization: `Bearer ${password}` },
      });

      if (res.status === 401) {
        setError("Contraseña incorrecta");
        return;
      }

      if (!res.ok) {
        setError("Error al cargar los datos");
        return;
      }

      const data = await res.json();
      setRecords(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (records === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-slate-800 mb-6">Panel de Administrador</h1>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contraseña de acceso"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Panel de Administrador</h1>
            <p className="text-sm text-slate-500 mt-1">{records.length} registros</p>
          </div>
          <button
            onClick={() => exportCSV(records)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            No hay registros todavía.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Categoría</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <Fragment key={record.id}>
                      <tr
                        onClick={() => toggleRow(record.id)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(record.created_at)}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs font-mono">{record.categoria?.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[record.estado] ?? "bg-slate-100 text-slate-600"}`}>
                            {record.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {expandedId === record.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                      </tr>
                      {expandedId === record.id && (
                        <tr>
                          <td colSpan={4} className="p-0">
                            <ExpandedRow record={record} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
