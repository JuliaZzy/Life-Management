import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const files = form.getAll("images").filter((value): value is File => value instanceof File);
  const endpoint = process.env.PADDLE_OCR_URL ?? "http://127.0.0.1:8001/ocr";
  try {
    const upstream = new FormData();
    files.forEach((file) => upstream.append("images", file, file.name));
    const response = await fetch(endpoint, { method: "POST", body: upstream, signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`PaddleOCR HTTP ${response.status}`);
    const result = await response.json() as { text?: string; fields?: Record<string, string> };
    return NextResponse.json({ ok: true, provider: "paddleocr+qwen2.5:3b", model: process.env.OCR_STRUCTURE_MODEL ?? "qwen2.5:3b", files: files.map((file) => ({ name: file.name, size: file.size })), text: result.text ?? "", fields: result.fields ?? { company: "", role: "", base: "", jd: "", salary: "" }, editable: true });
  } catch {
    return NextResponse.json({ ok: true, provider: "paddleocr+qwen2.5:3b", model: process.env.OCR_STRUCTURE_MODEL ?? "qwen2.5:3b", files: files.map((file) => ({ name: file.name, size: file.size })), text: "", fields: { company: "", role: "", base: "", jd: "", salary: "" }, editable: true, fallback: true, message: "PaddleOCR 服务未启动，图片已保留，请先启动本地 OCR 服务。" });
  }
}
