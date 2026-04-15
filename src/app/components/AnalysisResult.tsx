"use client";

import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { ConversationAnalysis, CategoryStatus } from "../page";

const statusConfig: Record<
  CategoryStatus,
  { color: string; bgColor: string; borderColor: string; label: string }
> = {
  prohibited: {
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Prohibido",
  },
  discouraged: {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "Desalentado",
  },
  allowed: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "Permitido",
  },
  encouraged: {
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Alentado",
  },
};

const statusIcon: Record<CategoryStatus, string> = {
  prohibited: "bg-red-500",
  discouraged: "bg-orange-500",
  allowed: "bg-yellow-500",
  encouraged: "bg-green-500",
};

interface Props {
  analysis: ConversationAnalysis;
  onReset: () => void;
}

export function AnalysisResult({ analysis, onReset }: Props) {
  const [showExchanges, setShowExchanges] = useState(false);
  const config = statusConfig[analysis.status];

  return (
    <div className="space-y-6">
      {/* Overall Result */}
      <div
        className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-8`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-6 h-6 rounded-full ${statusIcon[analysis.status]}`}></div>
          <div>
            <h2 className={`text-2xl font-bold ${config.color}`}>
              {analysis.overallCategory}
            </h2>
            <p className={`text-sm ${config.color} opacity-75`}>
              Estado: {config.label}
            </p>
          </div>
        </div>
        <p className="text-slate-700 text-lg">{analysis.summary}</p>
      </div>

      {/* Alerts */}
      {analysis.alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-700 mb-4">
            <AlertTriangle className="w-5 h-5" />
            Alertas
          </h3>
          <ul className="space-y-3">
            {analysis.alerts.map((alert, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                <span className="text-slate-700">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-700 mb-4">
            <Lightbulb className="w-5 h-5" />
            Sugerencias de Mejora
          </h3>
          <ul className="space-y-3">
            {analysis.suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span className="text-slate-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {analysis.positives.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700 mb-4">
            <CheckCircle className="w-5 h-5" />
            Lo que Hiciste Bien
          </h3>
          <ul className="space-y-3">
            {analysis.positives.map((positive, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                <span className="text-slate-700">{positive}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Exchanges */}
      {analysis.exchanges.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={() => setShowExchanges(!showExchanges)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-slate-700">
              Analisis Detallado ({analysis.exchanges.length} intercambios)
            </h3>
            {showExchanges ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {showExchanges && (
            <div className="mt-4 space-y-4">
              {analysis.exchanges.map((exchange, i) => {
                const exchangeConfig = statusConfig[exchange.status];
                return (
                  <div
                    key={i}
                    className={`border ${exchangeConfig.borderColor} rounded-lg overflow-hidden`}
                  >
                    <div
                      className={`${exchangeConfig.bgColor} px-4 py-2 flex items-center gap-2`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${statusIcon[exchange.status]}`}
                      ></span>
                      <span className={`font-medium ${exchangeConfig.color}`}>
                        {exchange.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Tu mensaje:</p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                          {exchange.userMessage.length > 200
                            ? exchange.userMessage.slice(0, 200) + "..."
                            : exchange.userMessage}
                        </p>
                      </div>
                      {exchange.concern && (
                        <div className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                          <strong>Observacion:</strong> {exchange.concern}
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

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
      >
        <RotateCcw className="w-5 h-5" />
        Analizar Otra Conversacion
      </button>
    </div>
  );
}
