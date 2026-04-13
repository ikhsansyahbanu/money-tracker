import { useState } from "react";

interface OcrItem {
  name: string;
  qty: number;
  price: number;
}

interface OcrResult {
  merchant: string | null;
  date: string | null;
  items: OcrItem[];
  total: number | null;
}

interface OcrState {
  status: "idle" | "loading" | "success" | "error";
  result: OcrResult | null;
  error: string | null;
}

export function useOcr() {
  const [state, setState] = useState<OcrState>({
    status: "idle",
    result: null,
    error: null,
  });

  async function scan(file: File) {
    setState({ status: "loading", result: null, error: null });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", result: null, error: data.error });
        return;
      }

      setState({ status: "success", result: data, error: null });
    } catch {
      setState({
        status: "error",
        result: null,
        error: "Koneksi bermasalah, coba lagi",
      });
    }
  }

  function reset() {
    setState({ status: "idle", result: null, error: null });
  }

  return { ...state, scan, reset };
}
