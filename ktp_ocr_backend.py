#!/usr/bin/env python3
"""
Backend FastAPI untuk OCR KTP dengan PaddleOCR
Mendukung: akurasi tinggi, parsing data, quality scoring
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from paddleocr import PaddleOCR
import cv2
import numpy as np
import base64
import io
import re
from typing import Optional
import uvicorn
from datetime import datetime

app = FastAPI(title="KTP OCR Service", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sesuaikan dengan domain production Anda
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi PaddleOCR (model untuk bahasa Indonesia)
print("🚀 Initializing PaddleOCR... (pertama kali bisa memakan waktu 1-2 menit)")
try:
    # Versi terbaru PaddleOCR
    ocr = PaddleOCR(use_textline_orientation=True, lang='ch')
except TypeError:
    # Fallback untuk versi lama
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False)
print("✅ PaddleOCR ready!")

# ==================== MODELS ====================
class KTPData(BaseModel):
    nik: str = ""
    nama: str = ""
    jenis_kelamin: str = ""
    tempat_lahir: str = ""
    tanggal_lahir: str = ""
    alamat: str = ""
    kelurahan: str = ""
    kecamatan: str = ""
    kabupaten: str = ""
    provinsi: str = ""
    agama: str = ""
    status_perkawinan: str = ""
    pekerjaan: str = ""
    kewarganegaraan: str = ""
    berlaku_sampai: str = ""
    raw_text: str = ""
    confidence: float = 0.0
    processing_time: float = 0.0

class OCRResponse(BaseModel):
    success: bool
    data: Optional[KTPData] = None
    error: Optional[str] = None
    message: str = ""

# ==================== HELPER FUNCTIONS ====================

def preprocess_image(image_cv):
    """Preprocess gambar untuk hasil OCR lebih baik"""
    # Resize jika terlalu besar
    height, width = image_cv.shape[:2]
    if width > 1500:
        scale = 1500 / width
        image_cv = cv2.resize(image_cv, (1500, int(height * scale)))
    
    # Improve contrast
    lab = cv2.cvtColor(image_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    image_cv = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    return image_cv

def clean_text(text):
    """Bersihkan teks hasil OCR"""
    text = str(text).strip()
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    return text

def parse_ktp_data(raw_text: str) -> tuple[dict, float]:
    """Parse OCR text menjadi data KTP terstruktur"""
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    
    ktp_data = {
        'nik': '',
        'nama': '',
        'jenis_kelamin': '',
        'tempat_lahir': '',
        'tanggal_lahir': '',
        'alamat': '',
        'kelurahan': '',
        'kecamatan': '',
        'kabupaten': '',
        'provinsi': '',
        'agama': '',
        'status_perkawinan': '',
        'pekerjaan': '',
        'kewarganegaraan': '',
        'berlaku_sampai': ''
    }
    
    confidence_scores = []
    
    # Extract NIK (16 digits)
    nik_pattern = r'\b\d{16}\b'
    for line in lines:
        nik_match = re.search(nik_pattern, line)
        if nik_match:
            ktp_data['nik'] = nik_match.group()
            confidence_scores.append(0.95)
            break
    
    # Extract Nama (biasanya di baris tertentu setelah NIK)
    for i, line in enumerate(lines):
        if 'nama' in line.lower():
            if i + 1 < len(lines):
                ktp_data['nama'] = clean_text(lines[i + 1])
                confidence_scores.append(0.9)
            break
        elif ktp_data['nik'] and i < 5:  # Nama biasanya di dekat awal
            if line and not any(x in line.lower() for x in ['provinsi', 'kabupaten', 'no', 'tgl']):
                if len(line) > 3 and not line.isdigit():
                    ktp_data['nama'] = clean_text(line)
                    confidence_scores.append(0.85)
    
    # Extract Jenis Kelamin
    for line in lines:
        if 'laki' in line.lower() or 'l/' in line.lower():
            ktp_data['jenis_kelamin'] = 'L'
            confidence_scores.append(0.95)
            break
        elif 'perempuan' in line.lower() or 'p/' in line.lower():
            ktp_data['jenis_kelamin'] = 'P'
            confidence_scores.append(0.95)
            break
    
    # Extract Tanggal Lahir (format: dd-mm-yyyy atau dd/mm/yyyy)
    date_pattern = r'(\d{2})[/-](\d{2})[/-](\d{4})'
    for line in lines:
        date_match = re.search(date_pattern, line)
        if date_match:
            ktp_data['tanggal_lahir'] = date_match.group().replace('-', '/')
            confidence_scores.append(0.9)
            break
    
    # Extract Alamat (biasanya ada di tengah dokumen)
    for i, line in enumerate(lines):
        if 'alamat' in line.lower():
            if i + 1 < len(lines):
                ktp_data['alamat'] = clean_text(lines[i + 1])
                confidence_scores.append(0.8)
            break
    
    # Extract Kelurahan/Dusun
    for i, line in enumerate(lines):
        if 'kelurahan' in line.lower() or 'desa' in line.lower():
            if i + 1 < len(lines):
                ktp_data['kelurahan'] = clean_text(lines[i + 1])
                confidence_scores.append(0.85)
            break
    
    # Extract Kecamatan
    for i, line in enumerate(lines):
        if 'kecamatan' in line.lower():
            if i + 1 < len(lines):
                ktp_data['kecamatan'] = clean_text(lines[i + 1])
                confidence_scores.append(0.85)
            break
    
    # Extract Kabupaten
    for i, line in enumerate(lines):
        if 'kabupaten' in line.lower() or 'kota' in line.lower():
            if i + 1 < len(lines):
                ktp_data['kabupaten'] = clean_text(lines[i + 1])
                confidence_scores.append(0.85)
            break
    
    # Extract Provinsi
    for i, line in enumerate(lines):
        if 'provinsi' in line.lower():
            if i + 1 < len(lines):
                ktp_data['provinsi'] = clean_text(lines[i + 1])
                confidence_scores.append(0.9)
            break
    
    # Calculate average confidence
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
    
    return ktp_data, avg_confidence

def correct_nik(nik_text):
    """Koreksi OCR errors pada NIK"""
    if not nik_text:
        return ""
    
    # Replace common OCR mistakes
    corrections = {
        'O': '0', 'o': '0',
        'I': '1', 'i': '1', 'l': '1',
        'Z': '2', 'z': '2',
        'S': '5', 's': '5',
        'G': '6', 'g': '6',
        'B': '8', 'b': '8',
        'L': '1'
    }
    
    corrected = ""
    for char in nik_text:
        corrected += corrections.get(char, char)
    
    # Keep only digits
    corrected = re.sub(r'[^\d]', '', corrected)
    
    return corrected[:16]  # Ensure 16 digits

# ==================== ROUTES ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "KTP OCR Service",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/ocr/ktp", response_model=OCRResponse)
async def ocr_ktp(file: UploadFile = File(...)):
    """
    Upload KTP image dan lakukan OCR
    
    Returns:
        OCRResponse dengan data KTP yang sudah diparsing
    """
    try:
        start_time = datetime.now()
        
        # Validasi file
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
        # Baca file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image_cv is None:
            raise HTTPException(status_code=400, detail="Gagal membaca gambar")
        
        # Preprocess image
        image_cv = preprocess_image(image_cv)
        
        # OCR dengan PaddleOCR
        results = ocr.ocr(image_cv, cls=True)
        
        # Extract text dari results
        raw_text = ""
        if results:
            for line in results:
                if line:
                    for word_info in line:
                        if len(word_info) >= 1:
                            text = word_info[1] if len(word_info) > 1 else word_info[0]
                            raw_text += str(text) + " "
        
        raw_text = clean_text(raw_text)
        
        if not raw_text:
            raise HTTPException(status_code=400, detail="Tidak dapat membaca teks dari gambar")
        
        # Parse data KTP
        ktp_data, confidence = parse_ktp_data(raw_text)
        
        # Correct NIK
        if ktp_data['nik']:
            ktp_data['nik'] = correct_nik(ktp_data['nik'])
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Build response
        response_data = KTPData(
            **ktp_data,
            raw_text=raw_text,
            confidence=confidence,
            processing_time=processing_time
        )
        
        return OCRResponse(
            success=True,
            data=response_data,
            message=f"OCR berhasil ({len(ktp_data)} fields, confidence: {confidence:.1%})"
        )
    
    except HTTPException as e:
        return OCRResponse(success=False, error=e.detail, message="OCR gagal")
    except Exception as e:
        print(f"Error: {str(e)}")
        return OCRResponse(success=False, error=str(e), message="Server error")

@app.post("/ocr/ktp/base64", response_model=OCRResponse)
async def ocr_ktp_base64(base64_image: str):
    """
    OCR dari base64 image (untuk camera capture)
    """
    try:
        start_time = datetime.now()
        
        # Decode base64
        image_data = base64.b64decode(base64_image)
        nparr = np.frombuffer(image_data, np.uint8)
        image_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image_cv is None:
            raise HTTPException(status_code=400, detail="Gagal decode gambar")
        
        # Preprocess
        image_cv = preprocess_image(image_cv)
        
        # OCR
        results = ocr.ocr(image_cv, cls=True)
        
        # Extract text
        raw_text = ""
        if results:
            for line in results:
                if line:
                    for word_info in line:
                        if len(word_info) >= 1:
                            text = word_info[1] if len(word_info) > 1 else word_info[0]
                            raw_text += str(text) + " "
        
        raw_text = clean_text(raw_text)
        
        if not raw_text:
            return OCRResponse(success=False, error="No text detected", message="Tidak dapat membaca teks")
        
        # Parse
        ktp_data, confidence = parse_ktp_data(raw_text)
        
        if ktp_data['nik']:
            ktp_data['nik'] = correct_nik(ktp_data['nik'])
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        response_data = KTPData(
            **ktp_data,
            raw_text=raw_text,
            confidence=confidence,
            processing_time=processing_time
        )
        
        return OCRResponse(success=True, data=response_data)
    
    except Exception as e:
        return OCRResponse(success=False, error=str(e), message="Processing error")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 KTP OCR Backend Service")
    print("="*60)
    print("📍 Endpoint: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
