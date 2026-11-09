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


FIELD_KEYS = ("company", "role", "base", "salary", "jd")

STRUCTURE_SYSTEM_PROMPT = """你只处理 OCR 后的招聘信息文本。输出 JSON，字段只能是 company、role、base、salary、jd。
规则：
- company：公司名称
- role：职位名称，不要把职位名写进 jd
- base：工作城市或 base 地
- salary：薪资范围
- jd：岗位描述全文。必须原样保留 OCR 文本中的职位职责、任职要求、加分项、福利等全部内容，禁止总结、缩写、改写，也禁止只填职位标题。
不要提取面试问题和回答，不要编造原文没有的内容。某个字段在原文中不存在就留空字符串。"""


def keep_full_jd(fields: dict[str, str], text: str) -> dict[str, str]:
    jd = fields.get("jd", "").strip()
    raw = text.strip()
    if not fields.get("role") and jd and len(jd) <= 40 and "\n" not in jd:
        fields["role"] = jd
    if raw and (not jd or len(jd) < max(80, int(len(raw) * 0.6))):
        fields["jd"] = raw
    elif jd:
        fields["jd"] = jd
    return fields


async def structure_fields(text: str) -> dict[str, str]:
    prompt = {
        "model": ollama_model,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": STRUCTURE_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{ollama_url}/api/chat", json=prompt)
        response.raise_for_status()
        content = response.json().get("message", {}).get("content", "{}")
    parsed = json.loads(content)
    fields = {key: str(parsed.get(key, "")).strip() for key in FIELD_KEYS}
    return keep_full_jd(fields, text)


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
        fields = {**{key: "" for key in FIELD_KEYS}, "jd": text}
    return {"text": text, "fields": fields, "provider": "paddleocr+qwen2.5:3b"}
