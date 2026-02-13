"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Image received",         done: true,  delay: 0    },
  { label: "Running object detection", done: false, delay: 400  },
  { label: "Cropping region of interest", done: false, delay: 900  },
  { label: "Classifying freshness",  done: false, delay: 1500 },
  { label: "Calculating confidence", done: false, delay: 2100 },
];

export default function LoadingIndicator() {
  const [completedCount, setCompletedCount] = useState(1);

  useEffect(() => {
    const timers = STEPS.slice(1).map((step, i) =>
      setTimeout(() => setCompletedCount(i + 2), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-6 animate-fadeIn">

      {/* Spinner visual */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-ink-200" />
        {/* Spinning arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="38"
            fill="none"
            stroke="#15A348"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="60 200"
            style={{ animation: "spin 1.1s linear infinite" }}
          />
        </svg>
        {/* Inner icon */}
        <div className="absolute inset-3 rounded-full bg-leaf-50 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15A348" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      </div>

      {/* Step list */}
      <div className="w-full max-w-xs space-y-3">
        {STEPS.map((step, i) => {
          const done = i < completedCount;
          const active = i === completedCount - 1 && completedCount < STEPS.length;
          return (
            <div
              key={step.label}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: i >= completedCount ? 0.35 : 1 }}
            >
              {/* Indicator dot */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {done && !active ? (
                  <div className="w-4 h-4 rounded-full bg-leaf-600 flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : active ? (
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-leaf-500 animate-pulseRing" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-leaf-500" />
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-ink-200" />
                )}
              </div>

              {/* Label */}
              <span className={`text-sm font-sans ${done || active ? "text-ink-900 font-medium" : "text-ink-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Shimmer bar */}
      <div className="w-full max-w-xs h-1 rounded-full overflow-hidden bg-ink-100">
        <div
          className="h-full w-1/2 rounded-full animate-shimmer"
          style={{
            background: "linear-gradient(90deg, transparent, #21C55C, transparent)",
            backgroundSize: "600px 100%",
          }}
        />
      </div>

      <p className="text-sm text-ink-400 font-sans">Analysing your food sample…</p>

      <style jsx>{`
        @keyframes spin {
          to { stroke-dashoffset: -260; }
        }
      `}</style>
    </div>
  );
}
