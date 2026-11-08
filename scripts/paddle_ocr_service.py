import json
import os
import re
import tempfile
from pathlib import Path

import httpx
from fastapi import FastAPI, File, UploadFile

try:
    from paddleocr import PaddleOCR
except ImportError as exc:
    raise RuntimeError("请先安装 requirements-ocr.txt") from exc

app = FastAPI(title="Life Management OCR")
ocr = PaddleOCR(lang="ch", use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False)
ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
ollama_model = os.getenv("OCR_STRUCTURE_MODEL", "qwen2.5:3b")


def extract_text(path: str) -> str:
    result = ocr.predict(path)
    pieces: list[str] = []
    for page in result:
        data = page.json if hasattr(page, "json") else page
        if isinstance(data, str):
            data = json.loads(data)
        for item in data.get("res", {}).get("rec_texts", []):
            if item and item.strip():
                pieces.append(item.strip())
    return "\n".join(pieces)


async def structure_fields(text: str) -> dict[str, str]:
    prompt = {
        "model": ollama_model,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": "你只处理 OCR 后的招聘信息文本。只提取 company、base、jd、salary 四个字段。不要提取面试问题和回答，不要编造内容。字段没有就留空。"},
            {"role": "user", "content": text},
        ],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{ollama_url}/api/chat", json=prompt)
        response.raise_for_status()
        content = response.json().get("message", {}).get("content", "{}")
    parsed = json.loads(content)
    return {key: str(parsed.get(key, "")) for key in ("company", "base", "jd", "salary")}


@app.post("/ocr")
async def ocr_images(images: list[UploadFile] = File(...)):
    texts: list[str] = []
    with tempfile.TemporaryDirectory(prefix="life-management-ocr-") as directory:
        for image in images:
            suffix = Path(image.filename or "image.png").suffix or ".png"
            target = Path(directory) / f"upload-{len(texts)}{suffix}"
            target.write_bytes(await image.read())
            texts.append(extract_text(str(target)))
    text = "\n\n".join(filter(None, texts))
    try:
        fields = await structure_fields(text)
    except Exception:
        fields = {"company": "", "base": "", "jd": text, "salary": ""}
    return {"text": text, "fields": fields, "provider": "paddleocr+qwen2.5:3b"}
