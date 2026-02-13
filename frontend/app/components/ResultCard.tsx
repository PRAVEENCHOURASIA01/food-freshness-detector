"use client";

import { PredictionResult } from "@/lib/api";

interface ResultCardProps {
  result: PredictionResult;
  capturedImage: string | null;
  onReset: () => void;
}

/* ─── Freshness configuration ───────────────────────────────────────────── */
const CONFIG = {
  fresh: {
    label: "Fresh",
    sublabel: "Safe for consumption",
    color:  "#15A348",
    bgSoft: "#F0FDF4",
    border: "#BBF7D0",
    shadow: "0 0 0 3px rgba(21,163,72,0.12)",
    bar:    "bg-leaf-600",
    icon:   (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15A348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    badge: "bg-leaf-50 text-leaf-700 border border-leaf-200",
  },
  "semi-fresh": {
    label: "Semi-Fresh",
    sublabel: "Consume soon",
    color:  "#D97706",
    bgSoft: "#FFFBEB",
    border: "#FDE68A",
    shadow: "0 0 0 3px rgba(217,119,6,0.12)",
    bar:    "bg-honey-500",
    icon:   (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    badge: "bg-honey-50 text-honey-700 border border-honey-200",
  },
  spoiled: {
    label: "Spoiled",
    sublabel: "Do not consume",
    color:  "#E11D48",
    bgSoft: "#FFF1F2",
    border: "#FECDD3",
    shadow: "0 0 0 3px rgba(225,29,72,0.12)",
    bar:    "bg-ruby-500",
    icon:   (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    badge: "bg-ruby-50 text-ruby-700 border border-ruby-200",
  },
  unknown: {
    label: "Unknown",
    sublabel: "Could not determine",
    color:  "#4B5B6E",
    bgSoft: "#F5F3EE",
    border: "#D4CBB8",
    shadow: "0 0 0 3px rgba(75,91,110,0.10)",
    bar:    "bg-ink-300",
    icon:   (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B5B6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    badge: "bg-cream-200 text-ink-600 border border-cream-300",
  },
} as const;

function fmt(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Stat cell ─────────────────────────────────────────────────────────── */
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-mono text-ink-400 tracking-wider uppercase">{label}</p>
      <p className="font-display text-2xl font-semibold text-ink-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-ink-400 font-sans">{sub}</p>}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ResultCard({ result, capturedImage, onReset }: ResultCardProps) {
  const cfg  = CONFIG[result.freshness as keyof typeof CONFIG] ?? CONFIG.unknown;
  const pct  = (result.confidence * 100).toFixed(1);
  const food = result.detected ? fmt(result.food) : "Not detected";

  return (
    <div className="w-full space-y-3 animate-fadeUp stagger">

      {/* ── Top banner ── */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4 animate-scaleIn"
        style={{
          background: cfg.bgSoft,
          border: `1px solid ${cfg.border}`,
          boxShadow: cfg.shadow,
          animationDelay: "0ms",
        }}
      >
        {/* Icon badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "white", boxShadow: `0 2px 8px rgba(0,0,0,0.08)` }}
        >
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-ink-400 tracking-widest uppercase mb-0.5">
            Analysis complete
          </p>
          <p className="font-display text-2xl font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
          <p className="text-sm text-ink-500 font-sans">{cfg.sublabel}</p>
        </div>

        {/* Confidence pill */}
        <div
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold font-mono ${cfg.badge}`}
        >
          {pct}%
        </div>
      </div>

      {/* ── Data row ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Captured image */}
        {capturedImage && (
          <div
            className="col-span-1 rounded-2xl overflow-hidden bg-ink-100"
            style={{
              border: "1px solid #E8E2D8",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              aspectRatio: "1/1",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Stats grid */}
        <div
          className={`${capturedImage ? "col-span-2" : "col-span-3"} card p-5 grid grid-cols-2 gap-5 items-start`}
        >
          <Stat label="Food item" value={food} />
          <Stat
            label="Freshness"
            value={cfg.label}
            sub={cfg.sublabel}
          />
          <Stat
            label="Confidence"
            value={`${pct}%`}
            sub="combined score"
          />
          <Stat
            label="Latency"
            value={`${result.inference_time_ms.toFixed(0)}ms`}
            sub="inference time"
          />
        </div>
      </div>

      {/* ── Confidence bar ── */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-ink-400 tracking-widest uppercase">
            Confidence Level
          </p>
          <p className="font-mono text-sm font-medium" style={{ color: cfg.color }}>
            {pct}%
          </p>
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${cfg.bar}`}
            style={{ "--bar-w": `${pct}%` } as React.CSSProperties}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between">
          {["0%", "25%", "50%", "75%", "100%"].map((t) => (
            <span key={t} className="text-[10px] font-mono text-ink-300">{t}</span>
          ))}
        </div>
      </div>

      {/* ── Freshness scale visual ── */}
      <div className="card p-5 space-y-3">
        <p className="text-xs font-mono text-ink-400 tracking-widest uppercase">
          Freshness Scale
        </p>
        <div className="relative h-2 rounded-full overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, #15A348 0%, #F59E0B 50%, #F43F5E 100%)",
            }}
          />
          {/* Indicator needle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-md transition-all duration-700"
            style={{
              left: `calc(${
                result.freshness === "fresh" ? "15%"
                : result.freshness === "semi-fresh" ? "50%"
                : result.freshness === "spoiled" ? "85%"
                : "50%"
              } - 6px)`,
              borderColor: cfg.color,
              boxShadow: `0 0 0 3px ${cfg.color}30`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-ink-400">
          <span>Fresh</span><span>Semi-fresh</span><span>Spoiled</span>
        </div>
      </div>

      {/* ── Reset ── */}
      <button
        onClick={onReset}
        className="w-full py-3.5 rounded-2xl border border-ink-200 text-sm font-semibold font-sans text-ink-600
                   hover:border-ink-300 hover:bg-ink-100 hover:text-ink-900
                   active:scale-[0.98] transition-all duration-200"
      >
        ↺ &nbsp; Scan another item
      </button>
    </div>
  );
}
