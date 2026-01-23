import { GoogleGenAI, SchemaType } from "@google/generative-ai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from '../types';

// Безопасное получение ключа
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = API_KEY ? new GoogleGenAI(API_KEY) : null;

// Исправленная функция-заглушка (теперь она закрыта правильно)
export const getPriceData = async () => {
    return { price: 100 }; 
};

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  const prompt = `Fetch the most recent OHLC futures price data for Crude Palm Oil (FCPO) for: ${timeframe}. Provide JSON with prices array.`;

  // Если ИИ не инициализирован, возвращаем пустые данные, а не ломаем сайт
  if (!genAI) {
    console.error("AI Key is missing!");
    return { data: [], sources: [] };
  }

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text || '{"prices": []}');
    
    return { 
      data: parsed.prices || [], 
      sources: [] 
    };
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    return { data: [], sources: [] };
  }
};

export const fetchComparisonData = async (
  timeframe: Timeframe,
  comparison: ComparisonOption,
  referenceData: PriceData[]
): Promise<PriceData[]> => {
  return []; // Временно возвращаем пустоту для стабильности
};
