"use client";

import { useId } from "react";

type LightPos = "red" | "yellow" | "green";

interface SemaforoProps {
  mode: "decorative" | "result";
  categoria?: string;
}

const CATEGORY_MAP: Record<string, { light: LightPos; glowClass: string }> = {
  DO_ALL_THE_WORK:  { light: "red",    glowClass: "pulse-glow-red" },
  DO_MY_BUSYWORK:   { light: "yellow", glowClass: "pulse-glow-yellow" },
  GET_ME_STARTED:   { light: "yellow", glowClass: "pulse-glow-yellow" },
  GIVE_ME_FEEDBACK: { light: "yellow", glowClass: "pulse-glow-yellow" },
  HELP_ME_LEARN:    { light: "green",  glowClass: "pulse-glow-green" },
  MAGNIFY_MY_WORK:  { light: "green",  glowClass: "pulse-glow-green" },
};

// ViewBox 80×220
//   casing: 68×162 at (6,6), rx=30  ← pill-shaped
//   post:   14×46  at (33,168)
//   lights: cx=40, cy = 39 | 87 | 135, socket r=20, lens r=17
const CX = 40;
const LIGHTS: { pos: LightPos; cy: number }[] = [
  { pos: "red",    cy: 39  },
  { pos: "yellow", cy: 87  },
  { pos: "green",  cy: 135 },
];

export function Semaforo({ mode, categoria }: SemaforoProps) {
  const uid = useId().replace(/:/g, "");
  const active = mode === "result" && categoria ? (CATEGORY_MAP[categoria] ?? null) : null;

  // decorative: all lights on; result: only active light on, others off
  const isOn = (pos: LightPos) => mode === "decorative" || active?.light === pos;
  const glow  = (pos: LightPos) => (active?.light === pos ? active!.glowClass : "");

  const [w, h] = mode === "decorative" ? [22, 60] : [80, 220];

  return (
    <svg
      viewBox="0 0 80 220"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {/* Casing: warm gold with very subtle L→R shading */}
        <linearGradient id={`${uid}cg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#DBA63C" />
          <stop offset="45%"  stopColor="#C8962A" />
          <stop offset="100%" stopColor="#A87820" />
        </linearGradient>

        {/* Soft centered drop-shadow for the casing */}
        <filter id={`${uid}sh`} x="-20%" y="-8%" width="140%" height="120%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="rgba(0,0,0,0.28)" />
        </filter>

        {/* Red light */}
        <radialGradient id={`${uid}red`} cx="0.38" cy="0.32" r="0.72" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#FFB0B0" />
          <stop offset="55%"  stopColor="#FF3030" />
          <stop offset="100%" stopColor="#CC0000" />
        </radialGradient>

        {/* Yellow light */}
        <radialGradient id={`${uid}yellow`} cx="0.38" cy="0.32" r="0.72" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#FFF4B0" />
          <stop offset="55%"  stopColor="#FFD020" />
          <stop offset="100%" stopColor="#E6A817" />
        </radialGradient>

        {/* Green light */}
        <radialGradient id={`${uid}green`} cx="0.38" cy="0.32" r="0.72" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#B0FFD0" />
          <stop offset="55%"  stopColor="#20DD60" />
          <stop offset="100%" stopColor="#00AA44" />
        </radialGradient>
      </defs>

      {/* Post */}
      <rect x="33" y="168" width="14" height="46" rx="5" fill="#404040" />

      {/* Casing — pill shape */}
      <rect
        x="6" y="6" width="68" height="162" rx="30"
        fill={`url(#${uid}cg)`}
        filter={`url(#${uid}sh)`}
      />

      {/* Lights */}
      {LIGHTS.map(({ pos, cy }) => (
        <g key={pos}>
          {/* Dark recess ring for depth */}
          <circle cx={CX} cy={cy} r={20} fill="rgba(0,0,0,0.45)" />

          {/* Lens — pulse animation only on active light in result mode */}
          <g className={glow(pos)}>
            <circle cx={CX} cy={cy} r={17} fill={isOn(pos) ? `url(#${uid}${pos})` : "#1a1a1a"} />
            {/* Glass shine */}
            <ellipse
              cx={CX - 7} cy={cy - 7}
              rx={6} ry={3.5}
              fill="white" opacity={isOn(pos) ? 0.30 : 0.08}
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
