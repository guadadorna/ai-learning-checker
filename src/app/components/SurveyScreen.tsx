"use client";

import { useState } from "react";
import { Semaforo } from "./Semaforo";

export interface SurveyData {
  universidad: string;
  carrera: string;
  tipo_uso: string;
  edad: string;
  genero: string;
}

interface Props {
  onComplete: (data: SurveyData) => void;
}

const UNIVERSIDADES = ["UBA", "UTDT", "UDESA", "Otra"];
const TIPOS_USO = ["Trabajo práctico", "Corrección", "Personal", "Otro"];
const GENEROS = ["Masculino", "Femenino", "Otro"];

export function SurveyScreen({ onComplete }: Props) {
  const [universidad, setUniversidad] = useState("");
  const [otraUniversidad, setOtraUniversidad] = useState("");
  const [carrera, setCarrera] = useState("");
  const [tipoUso, setTipoUso] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!universidad) newErrors.universidad = "Seleccioná una universidad";
    if (universidad === "Otra" && !otraUniversidad.trim()) {
      newErrors.otraUniversidad = "Indicá tu universidad";
    }
    if (!carrera.trim()) newErrors.carrera = "Indicá tu carrera";
    if (!tipoUso) newErrors.tipoUso = "Seleccioná el tipo de uso";
    if (!edad) {
      newErrors.edad = "Indicá tu edad";
    } else if (isNaN(Number(edad)) || Number(edad) < 1 || Number(edad) > 120) {
      newErrors.edad = "Ingresá una edad válida";
    }
    if (!genero) newErrors.genero = "Seleccioná una opción";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onComplete({
      universidad: universidad === "Otra" ? otraUniversidad.trim() : universidad,
      carrera: carrera.trim(),
      tipo_uso: tipoUso,
      edad,
      genero,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
          {/* Identidad visual */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Semaforo mode="decorative" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                AI Learning Checker
              </h1>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Antes de continuar</p>
              <p className="text-slate-500 text-sm mt-1">
                Completá este breve formulario. Los datos son anónimos y se usan para investigación educativa.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Universidad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Universidad <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {UNIVERSIDADES.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setUniversidad(u);
                      setErrors((prev) => ({ ...prev, universidad: "", otraUniversidad: "" }));
                    }}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      universidad === u
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              {errors.universidad && (
                <p className="text-red-500 text-xs mt-1">{errors.universidad}</p>
              )}
              {universidad === "Otra" && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={otraUniversidad}
                    onChange={(e) => {
                      setOtraUniversidad(e.target.value);
                      setErrors((prev) => ({ ...prev, otraUniversidad: "" }));
                    }}
                    placeholder="Nombre de tu universidad"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.otraUniversidad && (
                    <p className="text-red-500 text-xs mt-1">{errors.otraUniversidad}</p>
                  )}
                </div>
              )}
            </div>

            {/* Carrera */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Carrera <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={carrera}
                onChange={(e) => {
                  setCarrera(e.target.value);
                  setErrors((prev) => ({ ...prev, carrera: "" }));
                }}
                placeholder="Ej: Administración de Empresas"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.carrera && (
                <p className="text-red-500 text-xs mt-1">{errors.carrera}</p>
              )}
            </div>

            {/* Tipo de uso */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de uso <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_USO.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTipoUso(t);
                      setErrors((prev) => ({ ...prev, tipoUso: "" }));
                    }}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      tipoUso === t
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.tipoUso && (
                <p className="text-red-500 text-xs mt-1">{errors.tipoUso}</p>
              )}
            </div>

            {/* Edad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Edad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => {
                  setEdad(e.target.value);
                  setErrors((prev) => ({ ...prev, edad: "" }));
                }}
                placeholder="Ej: 22"
                min={1}
                max={120}
                className="w-32 p-3 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.edad && (
                <p className="text-red-500 text-xs mt-1">{errors.edad}</p>
              )}
            </div>

            {/* Género */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Género <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {GENEROS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGenero(g);
                      setErrors((prev) => ({ ...prev, genero: "" }));
                    }}
                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      genero === g
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.genero && (
                <p className="text-red-500 text-xs mt-1">{errors.genero}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
            >
              Continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
