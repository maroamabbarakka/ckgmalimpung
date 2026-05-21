import base64
import re
import time
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from pydantic import BaseModel


app = FastAPI(title="CKG KTP OCR Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)


class OCRRequest(BaseModel):
    base64_image: str


def correct_nik(text: str) -> str:
    table = str.maketrans({
        "O": "0", "o": "0", "Q": "0", "D": "0",
        "I": "1", "i": "1", "l": "1", "L": "1", "|": "1",
        "Z": "2", "z": "2", "A": "4", "a": "4",
        "S": "5", "s": "5", "G": "6", "g": "6",
        "B": "8", "b": "8",
    })
    return re.sub(r"\D", "", text.translate(table))[:16]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.upper()).strip()


def decode_image(base64_image: str) -> np.ndarray:
    if "," in base64_image:
        base64_image = base64_image.split(",", 1)[1]
    try:
        raw = base64.b64decode(base64_image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="base64_image tidak valid") from exc

    arr = np.frombuffer(raw, np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Gambar tidak dapat dibaca")
    return image


def enhance_image(image: np.ndarray) -> list[np.ndarray]:
    height, width = image.shape[:2]
    scale = max(1.0, min(2.0, 2200 / max(height, width)))
    if scale > 1:
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(gray)
    sharp = cv2.filter2D(clahe, -1, np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]))
    binary = cv2.adaptiveThreshold(
        sharp, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 9
    )
    return [image, cv2.cvtColor(sharp, cv2.COLOR_GRAY2BGR), cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)]


def flatten_paddle_result(result: Any) -> tuple[list[str], list[float]]:
    lines: list[str] = []
    scores: list[float] = []

    for page in result or []:
        if not page:
            continue
        for item in page:
            if not item or len(item) < 2:
                continue
            payload = item[1]
            if isinstance(payload, (list, tuple)) and payload:
                text = str(payload[0]).strip()
                score = float(payload[1]) if len(payload) > 1 else 0.0
                if text:
                    lines.append(text)
                    scores.append(score)
    return lines, scores


def parse_ktp(lines: list[str], scores: list[float]) -> dict[str, Any]:
    raw_text = "\n".join(lines)
    compact = re.sub(r"\s+", "", raw_text.upper())

    nik = ""
    candidates = re.findall(r"[0-9OoQDIilL|ZzAaSsGgBb]{16,24}", compact)
    for candidate in candidates:
        corrected = correct_nik(candidate)
        if len(corrected) == 16:
            nik = corrected
            break

    nama = ""
    normalized_lines = [normalize_text(line) for line in lines]
    for index, line in enumerate(normalized_lines):
        if re.search(r"\b(NAMA|NMA|NAM|AMA)\b", line):
            inline = re.sub(r"^.*?\b(?:NAMA|NMA|NAM|AMA)\b\s*:?", "", line).strip()
            nama = re.sub(r"[^A-Z\s\.,']", "", inline).strip()
            if len(nama) < 3 and index + 1 < len(normalized_lines):
                nama = re.sub(r"[^A-Z\s\.,']", "", normalized_lines[index + 1]).strip()
            break

    date = ""
    match = re.search(r"\b([0-3]?\d)[\s\-\/\.]([01]?\d)[\s\-\/\.]((?:19|20)?\d{2})\b", raw_text)
    if match:
        day = match.group(1).zfill(2)
        month = match.group(2).zfill(2)
        year = match.group(3)
        if len(year) == 2:
            year = ("19" if int(year) > 30 else "20") + year
        date = f"{year}-{month}-{day}"

    gender = ""
    if re.search(r"LAKI.?LAKI|LKI", compact):
        gender = "L"
    elif re.search(r"PEREMPUAN|PEREMP|PRMP", compact):
        gender = "P"

    status = ""
    if "BELUMKAWIN" in compact:
        status = "Belum Kawin"
    elif "CERAIHIDUP" in compact:
        status = "Cerai Hidup"
    elif "CERAIMATI" in compact:
        status = "Cerai Mati"
    elif "KAWIN" in compact:
        status = "Kawin"

    desa = ""
    if "MALIMPUNG" in compact:
        desa = "Desa Malimpung"
    elif "PADANG" in compact and "LOANG" in compact:
        desa = "Desa Padang Loang"
    elif "MACCIRINNA" in compact or "MACCIRINA" in compact:
        desa = "Kelurahan Maccirinna"

    confidence = float(np.mean(scores)) if scores else 0.0
    if nik:
        confidence = min(0.99, confidence + 0.12)

    return {
        "nik": nik,
        "nama": nama,
        "tgl_lahir": date,
        "j_kelamin": gender,
        "desa": desa,
        "status_perkawinan": status,
        "raw_text": raw_text,
        "confidence": confidence,
        "processing_time": 0,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr/ktp/base64")
def ocr_ktp_base64(payload: OCRRequest) -> dict[str, Any]:
    start = time.perf_counter()
    image = decode_image(payload.base64_image)

    best_data: dict[str, Any] | None = None
    best_score = -1
    for variant in enhance_image(image):
        result = ocr_engine.ocr(variant, cls=True)
        lines, scores = flatten_paddle_result(result)
        data = parse_ktp(lines, scores)
        score = int(bool(data["nik"])) * 4 + int(bool(data["nama"])) * 2 + int(bool(data["tgl_lahir"]))
        if score > best_score:
            best_score = score
            best_data = data
        if data["nik"] and data["nama"]:
            break

    if not best_data:
        return {"success": False, "error": "Tidak ada teks terbaca"}

    best_data["processing_time"] = round(time.perf_counter() - start, 2)
    return {"success": True, "data": best_data}
