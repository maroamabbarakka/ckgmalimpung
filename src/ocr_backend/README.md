# CKG KTP OCR Backend

Backend opsional untuk OCR KTP memakai PaddleOCR. Frontend akan otomatis mencoba endpoint ini dulu:

```bash
cd src/ocr_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Jika backend tidak aktif, aplikasi tetap fallback ke OCR lokal browser memakai Tesseract.js.

Untuk produksi lokal, jalankan di komputer/laptop yang sama dengan aplikasi atau set URL backend via:

```env
VITE_KTP_OCR_BACKEND=http://alamat-server:8000
```
