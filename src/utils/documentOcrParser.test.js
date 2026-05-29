import { describe, it, expect } from 'vitest';
import { normalizeSmartScanResult } from './documentOcrParser.js';

describe('Smart Scan Document OCR Normalizer & Wilayah Kerja', () => {
  
  it('harus menormalisasi KTP di wilayah kerja (Desa Malimpung)', () => {
    const rawData = {
      documentType: 'KTP',
      nik: '7315021205900002',
      nama: 'MURNIATI',
      jenisKelamin: 'P',
      tanggalLahir: '1990-05-12',
      alamatDusun: 'Dusun Pajalele',
      desaKelurahan: 'Malimpung',
      confidence: 0.92
    };

    const result = normalizeSmartScanResult(rawData, 'gemini');

    expect(result.engine).toBe('gemini');
    expect(result.documentType).toBe('KTP');
    expect(result.confidence).toBe(0.92);
    expect(result.data.nik).toBe('7315021205900002');
    expect(result.data.nama).toBe('MURNIATI');
    expect(result.data.jenisKelamin).toBe('PEREMPUAN');
    expect(result.data.tanggalLahir).toBe('1990-05-12');
    expect(result.data.alamatDusun).toBe('DUSUN PAJALELE');
    expect(result.data.desaKelurahan).toBe('Desa Malimpung');
    expect(result.data.statusWilayah).toBe('wilayah_kerja');
    expect(result.warnings.length).toBe(0);
  });

  it('harus menormalisasi KTP di luar wilayah kerja', () => {
    const rawData = {
      documentType: 'KTP',
      nik: '7315021205900002',
      nama: 'BUDI SANTOSO',
      jenisKelamin: 'LAKI-LAKI',
      tanggalLahir: '12/08/1985',
      alamatDusun: 'Jl. Jenderal Sudirman',
      desaKelurahan: 'Soreang', // Luar wilayah kerja
      confidence: 0.88
    };

    const result = normalizeSmartScanResult(rawData, 'gemini');

    expect(result.data.desaKelurahan).toBe('LUAR WILAYAH');
    expect(result.data.statusWilayah).toBe('luar_wilayah');
    expect(result.warnings).toContain('Desa/Kelurahan di luar wilayah kerja Puskesmas Malimpung.');
  });

  it('harus menandai desa yang tidak terbaca dengan perlu_konfirmasi', () => {
    const rawData = {
      documentType: 'KTP',
      nik: '7315021205900002',
      nama: 'AHMAD',
      jenisKelamin: 'L',
      tanggalLahir: '1995-10-20',
      alamatDusun: '',
      desaKelurahan: '', // Kosong/Tidak terbaca
      confidence: 0.70
    };

    const result = normalizeSmartScanResult(rawData, 'gemini');

    expect(result.data.desaKelurahan).toBe('');
    expect(result.data.statusWilayah).toBe('perlu_konfirmasi');
    expect(result.warnings).toContain('Desa/Kelurahan tidak terbaca. Harap konfirmasi manual.');
  });

  it('harus mengabaikan nomor KK saat memproses dokumen KK dan mengekstrak field penting saja', () => {
    const rawData = {
      documentType: 'KK',
      nik: '7315011010150003',
      nama: 'ALIF PRATAMA',
      jenisKelamin: 'LAKI',
      tanggalLahir: '2015-10-10',
      alamatDusun: 'Dusun Palita',
      desaKelurahan: 'PADANG LOANG',
      kk: '7315010202100005', // Nomor KK harus diabaikan (tidak masuk ke field utama form)
      confidence: 0.95
    };

    const result = normalizeSmartScanResult(rawData, 'gemini');

    expect(result.data.nik).toBe('7315011010150003'); // NIK Anggota
    expect(result.data.nama).toBe('ALIF PRATAMA');
    expect(result.data.desaKelurahan).toBe('Desa Padang Loang');
    expect(result.data.statusWilayah).toBe('wilayah_kerja');
    expect(result.data.kk).toBeUndefined(); // Tidak ada field kk di form utama
  });

  it('harus mengabaikan nomor BPJS/JKN saat memproses dokumen BPJS', () => {
    const rawData = {
      documentType: 'BPJS',
      nik: '7315021205900002',
      nama: 'SITI AMINAH',
      jenisKelamin: 'PEREMPUAN',
      tanggalLahir: '1992-04-03',
      nomorBPJS: '000123456789', // Diabaikan
      confidence: 0.90
    };

    const result = normalizeSmartScanResult(rawData, 'gemini');

    expect(result.data.nik).toBe('7315021205900002');
    expect(result.data.nama).toBe('SITI AMINAH');
    expect(result.data.nomorBPJS).toBeUndefined();
  });

});
