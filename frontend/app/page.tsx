"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture from "./components/CameraCapture";
import LoadingIndicator from "./components/LoadingIndicator";
import ResultCard from "./components/ResultCard";
import { checkHealth, predictFreshness, PredictionResult } from "@/lib/api";

type AppState = "scanning" | "loading" | "result" | "error";

export default function Home() {
  const [appState, setAppState]       = useState<AppState>("scanning");
  const [result, setResult]           = useState<PredictionResult | null>(null);
  const [capture, setCapture]         = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [backendUp, setBackendUp]     = useState<boolean | null>(null);
  const [scanCount, setScanCount]     = useState(0);
  const totalScansRef                 = useRef(0);

  /* ── Backend health ── */
  useEffect(() => {
    checkHealth().then((ok) => setBackendUp(ok));
  }, []);

  /* ── Capture handler ── */
  const handleCapture = useCallback(async (blob: Blob, dataUrl: string) => {
    setCapture(dataUrl);
    setAppState("loading");
    try {
      const res = await predictFreshness(blob);
      setResult(res);
      totalScansRef.current += 1;
      setScanCount(totalScansRef.current);
      setAppState("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Inference failed.");
      setAppState("error");
    }
  }, []);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setResult(null);
    setCapture(null);
    setErrorMsg("");
    setAppState("scanning");
  }, []);

  /* ─────────────────────────────── Render ─────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#FAFAF7" }}>

      {/* ══ Header ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-cream-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ink-900 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-semibold text-ink-900 leading-tight">
                FreshScan
              </span>
              <span className="text-[10px] font-mono text-ink-400 tracking-widest uppercase leading-tight hidden sm:block">
                Food Analysis System
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {scanCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100 border border-cream-200">
                <span className="text-xs font-mono text-ink-400">{scanCount} scan{scanCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cream-200 bg-cream-100">
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendUp === null ? "bg-honey-500 animate-pulse" :
                backendUp ? "bg-leaf-500" : "bg-ruby-500"
              }`} />
              <span className="text-xs font-mono text-ink-500">
                {backendUp === null ? "Connecting" : backendUp ? "API online" : "API offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ Main layout ════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: Camera / results ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Page title */}
            <div className="animate-fadeUp">
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink-900 leading-tight">
                Food Freshness<br />
                <em className="text-leaf-600 not-italic">Detection</em>
              </h1>
              <p className="mt-2 text-ink-500 font-sans text-base leading-relaxed max-w-md">
                Point your camera at any food item and capture a photo.
                AI will analyse its freshness instantly.
              </p>
            </div>

            {/* State indicator pill */}
            <div className="flex items-center gap-2 animate-fadeUp" style={{ animationDelay: "60ms" }}>
              <div className={`px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase border ${
                appState === "scanning" ? "bg-cream-100 border-cream-200 text-ink-500"
                : appState === "loading" ? "bg-honey-50 border-honey-200 text-honey-700"
                : appState === "result"  ? "bg-leaf-50 border-leaf-200 text-leaf-700"
                : "bg-ruby-50 border-ruby-200 text-ruby-700"
              }`}>
                {appState === "scanning" ? "Ready to scan"
                 : appState === "loading" ? "Analysing…"
                 : appState === "result"  ? "Result ready"
                 : "Error occurred"}
              </div>
              {appState === "loading" && (
                <div className="w-4 h-4 rounded-full border-2 border-honey-300 border-t-honey-600 animate-spin" />
              )}
            </div>

            {/* ── Content panel ── */}
            <div
              className="animate-scaleIn"
              style={{ animationDelay: "100ms" }}
            >
              {appState === "scanning" && (
                <CameraCapture onCapture={handleCapture} />
              )}

              {appState === "loading" && (
                <div className="card p-8 sm:p-10">
                  <LoadingIndicator />
                </div>
              )}

              {appState === "result" && result && (
                <ResultCard
                  result={result}
                  capturedImage={capture}
                  onReset={handleReset}
                />
              )}

              {appState === "error" && (
                <div className="card p-10 flex flex-col items-center gap-6 text-center animate-scaleIn">
                  <div className="w-14 h-14 rounded-2xl bg-ruby-50 border border-ruby-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink-900">Analysis failed</h3>
                    <p className="mt-1 text-sm text-ink-500 max-w-xs">{errorMsg}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition-colors active:scale-[0.97]"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info sidebar ── */}
          <div className="lg:col-span-5 space-y-4">

            {/* How it works */}
            <div className="card p-6 space-y-5 animate-fadeUp" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-ink-400 tracking-widest uppercase">How it works</p>
              </div>
              <div className="space-y-4">
                {[
                  {
                    step: "01",
                    title: "Point & capture",
                    desc: "Aim your camera at the food item and tap Capture Photo.",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    ),
                  },
                  {
                    step: "02",
                    title: "Detection",
                    desc: "YOLOv8 identifies the food item and its location in the frame.",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    ),
                  },
                  {
                    step: "03",
                    title: "Freshness classification",
                    desc: "A fine-tuned MobileNetV2 classifies freshness from the detected region.",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    ),
                  },
                  {
                    step: "04",
                    title: "Result",
                    desc: "Fresh, semi-fresh, or spoiled — with a confidence score.",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ),
                  },
                ].map(({ step, title, desc, icon }) => (
                  <div key={step} className="flex gap-3.5">
                    <div className="flex-col flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-ink-900 text-white flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 w-px bg-cream-200" />
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-ink-300 tracking-wider">{step}</span>
                        <p className="text-sm font-semibold text-ink-900">{title}</p>
                      </div>
                      <p className="text-xs text-ink-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model info */}
            <div className="card p-6 animate-fadeUp" style={{ animationDelay: "180ms" }}>
              <p className="text-xs font-mono text-ink-400 tracking-widest uppercase mb-4">Model Info</p>
              <div className="space-y-0">
                {[
                  ["Detector",    "YOLOv8 Nano"],
                  ["Classifier",  "MobileNetV2"],
                  ["Food classes","30 categories"],
                  ["Output",      "3-class freshness"],
                  ["Backend",     "FastAPI + Uvicorn"],
                ].map(([k, v], i, arr) => (
                  <div
                    key={k}
                    className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-cream-200" : ""}`}
                  >
                    <span className="text-sm text-ink-500 font-sans">{k}</span>
                    <span className="text-sm font-medium font-mono text-ink-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Freshness legend */}
            <div className="card p-6 animate-fadeUp" style={{ animationDelay: "240ms" }}>
              <p className="text-xs font-mono text-ink-400 tracking-widest uppercase mb-4">Freshness Guide</p>
              <div className="space-y-3">
                {[
                  { label: "Fresh",       sub: "Optimal quality",    color: "#15A348", bg: "#F0FDF4", border: "#BBF7D0" },
                  { label: "Semi-fresh",  sub: "Consume promptly",   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                  { label: "Spoiled",     sub: "Discard immediately", color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3" },
                ].map(({ label, sub, color, bg, border }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color }}>{label}</p>
                      <p className="text-xs text-ink-400 font-sans">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ══ Footer ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-cream-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs font-mono text-ink-300">
            FreshScan · YOLOv8 + MobileNetV2
          </p>
          <p className="text-xs font-mono text-ink-300">
            FastAPI · Next.js 14
          </p>
        </div>
      </footer>

    </div>
  );
}
