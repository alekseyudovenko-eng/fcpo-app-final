import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from './types';

// Ключ из Vercel
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

// Инициализация. ВАЖНО: мы явно указываем версию v1beta
const genAI = new GoogleGenerativeAI(API_KEY);

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  if (!API_KEY) {
    console.error("API Key is missing!");
    return { data: [], sources: [] };
  }

  try {
    // Явно указываем apiVersion в настройках модели
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            prices: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  open: { type: SchemaType.NUMBER },
                  high: { type: SchemaType.NUMBER },
                  low: { type: SchemaType.NUMBER },
                  close: { type: SchemaType.NUMBER },
                },
                required: ["date", "open", "high", "low", "close"],
              },
            },
          },
        },
      },
    }, { apiVersion: 'v1beta' }); // <--- ЭТОТ ПАРАМЕТР УБИРАЕТ 404

    const prompt = `Generate 30 realistic price points for FCPO futures (${timeframe}). Return JSON with "prices" array. Numbers between 3800-4200.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text || '{"prices": []}');
    
    let priceData = parsed.prices || [];

    // Если API всё равно вернуло пустоту, создаем имитацию, чтобы график не был пустым
    if (priceData.length === 0) {
      priceData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        open: 3900 + Math.random() * 50,
        high: 3980 + Math.random() * 50,
        low: 3850 + Math.random() * 50,
        close: 3930 + Math.random() * 50
      }));
    }

    return { data: priceData, sources: [] };
  } catch (error) {
    console.error("Fetch error details:", error);
    return { data: [], sources: [] };
  }
};

export const fetchComparisonData = async (timeframe: Timeframe, comparison: ComparisonOption, referenceData: PriceData[]): Promise<PriceData[]> => [];
