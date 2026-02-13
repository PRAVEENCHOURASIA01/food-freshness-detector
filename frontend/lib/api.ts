/**
 * API Client
 * ----------
 * Typed Axios wrapper for communicating with the FastAPI backend.
 */

import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000, // 30 s — allow time for first-run model download
});

// ---- Types ----------------------------------------------------------------

export interface PredictionResult {
  food: string;
  freshness: "fresh" | "semi-fresh" | "spoiled" | "unknown";
  confidence: number;
  detected: boolean;
  inference_time_ms: number;
}

export interface ApiError {
  detail: string;
}

// ---- Endpoints ------------------------------------------------------------

/**
 * Send a captured image blob to the /predict endpoint.
 *
 * @param blob - Image blob from canvas.toBlob() or similar
 * @returns PredictionResult on success
 * @throws Error with a human-readable message on failure
 */
export async function predictFreshness(blob: Blob): Promise<PredictionResult> {
  const form = new FormData();
  form.append("file", blob, "capture.jpg");

  try {
    const { data } = await apiClient.post<PredictionResult>("/predict", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const detail =
      axiosErr.response?.data?.detail ??
      axiosErr.message ??
      "Unexpected error communicating with the API.";
    throw new Error(detail);
  }
}

/**
 * Liveness check — returns true if the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await apiClient.get<{ status: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}
