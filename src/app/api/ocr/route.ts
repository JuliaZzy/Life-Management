import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const files = form.getAll("images").filter((value): value is File => value instanceof File);
  return NextResponse.json({ ok: true, provider: "paddleocr+qwen2.5:3b", files: files.map((file) => ({ name: file.name, size: file.size })), text: "", fields: { company: "", base: "", jd: "", salary: "" }, editable: true, message: "OCR 服务边界已准备，识别结果会回填到可编辑字段。" });
}
