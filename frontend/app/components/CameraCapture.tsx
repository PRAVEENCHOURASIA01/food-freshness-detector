"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
  disabled?: boolean;
}

type CameraState = "idle" | "requesting" | "streaming" | "error";

export default function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState]   = useState<CameraState>("idle");
  const [error, setError]   = useState("");
  const [flash, setFlash]   = useState(false);
  const [count, setCount]   = useState<number | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  /* ── Start ── */
  const startCamera = useCallback(async () => {
    setState("requesting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setState("streaming");
    } catch (e) {
      const err = e as DOMException;
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow access in your browser settings."
          : err.name === "NotFoundError"
          ? "No camera detected on this device."
          : `Camera error: ${err.message}`
      );
      setState("error");
      setHasCamera(false);
    }
  }, []);

  /* ── Stop ── */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  useEffect(() => { startCamera(); return () => stopCamera(); }, []); // eslint-disable-line

  /* ── Capture ── */
  const doCapture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    setFlash(true);
    setTimeout(() => setFlash(false), 350);

    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(blob, canvas.toDataURL("image/jpeg", 0.93));
    }, "image/jpeg", 0.93);
  }, [onCapture]);

  const triggerCapture = useCallback(() => {
    if (state !== "streaming" || disabled || count !== null) return;
    let n = 3;
    setCount(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(id); setCount(null); doCapture(); }
      else setCount(n);
    }, 700);
  }, [state, disabled, count, doCapture]);

  /* ── Spacebar shortcut ── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.code === "Space" && !disabled && state === "streaming") { e.preventDefault(); triggerCapture(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [triggerCapture, disabled, state]);

  /* ────────────────────────────────── UI ── */
  return (
    <div className="w-full space-y-4">

      {/* ── Viewport ── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-ink-900"
        style={{ aspectRatio: "16/9", boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)", display: state === "streaming" ? "block" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture flash */}
        {flash && <div className="absolute inset-0 bg-white z-30 capture-flash" />}

        {/* ── Streaming overlays ── */}
        {state === "streaming" && (
          <>
            {/* Animated scan line */}
            <div className="scan-line z-10" />

            {/* Corner brackets */}
            {([
              ["top-5 left-5",     "border-t-2 border-l-2", "rounded-tl-md"],
              ["top-5 right-5",    "border-t-2 border-r-2", "rounded-tr-md"],
              ["bottom-5 left-5",  "border-b-2 border-l-2", "rounded-bl-md"],
              ["bottom-5 right-5", "border-b-2 border-r-2", "rounded-br-md"],
            ] as const).map(([pos, border, round], i) => (
              <div
                key={i}
                className={`absolute ${pos} w-6 h-6 ${border} ${round} border-leaf-500 z-10 opacity-80`}
              />
            ))}

            {/* Live badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-ruby-500 animate-pulseRing" />
              <span className="text-white text-xs font-mono tracking-widest font-medium">LIVE</span>
            </div>

            {/* Space hint */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="text-white/50 text-[10px] font-mono tracking-wider">
                SPACE to capture
              </span>
            </div>
          </>
        )}

        {/* ── Countdown overlay ── */}
        {count !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span
              key={count}
              className="font-display text-9xl font-semibold text-white animate-scaleIn"
              style={{ textShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
            >
              {count}
            </span>
          </div>
        )}

        {/* ── Requesting state ── */}
        {state === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-ink-700 border-t-leaf-500 animate-spin" />
            <p className="text-ink-400 text-sm font-sans">Requesting camera access…</p>
          </div>
        )}

        {/* ── Idle ── */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ink-800 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4B5B6E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="text-ink-500 text-sm">Camera inactive</p>
          </div>
        )}

        {/* ── Error state ── */}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
            <div className="w-14 h-14 rounded-2xl bg-ruby-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-medium text-sm">Camera unavailable</p>
              <p className="text-ink-400 text-xs leading-relaxed">{error}</p>
            </div>
            <button
              onClick={startCamera}
              className="px-5 py-2 text-sm font-medium rounded-xl bg-ink-800 text-white hover:bg-ink-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* ── Capture button ── */}
      <div className="flex items-center justify-center gap-4 pt-1">

        {/* Main capture button */}
        <button
          onClick={triggerCapture}
          disabled={state !== "streaming" || disabled || count !== null}
          className="group relative flex items-center gap-3 px-8 py-3.5 rounded-2xl font-sans font-semibold text-sm
                     bg-ink-900 text-white shadow-lg
                     hover:bg-ink-800 active:scale-[0.97]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200"
        >
          {/* Record dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-ruby-500 group-hover:animate-pulseRing group-disabled:animate-none" />
          {count !== null ? `Capturing in ${count}…` : "Capture Photo"}
        </button>
      </div>
    </div>
  );
}
