import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Muat variabel environment
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY tidak ditemukan di environment variable backend!');
}

// Inisialisasi instance Google Gen AI SDK
export const ai = new GoogleGenAI({
  apiKey: apiKey || 'dummy-key-to-prevent-crash',
});

export default ai;
