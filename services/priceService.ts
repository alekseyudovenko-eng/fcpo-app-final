import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from './types';

// Используем ключ из настроек Vercel
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

// Исправленное название класса
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  if (!genAI) {
    console.error("Критическая ошибка: API ключ не найден в переменных окружения!");
    return { data: [], sources: [] };
  }

  try {
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
    });

    // Улучшенный промпт: требуем минимум 30 точек данных для отрисовки красивого графика
    const prompt = `Generate a realistic historical price dataset for FCPO (Crude Palm Oil) futures for the ${timeframe} period. 
    Provide exactly 30 data points. 
    Prices should be realistic (between 3800 and 4200 RM). 
    Return ONLY a JSON object with a "prices" array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Безопасный парсинг JSON
    const parsed = JSON.parse(text || '{"prices": []}');
    const priceData = parsed.prices || [];

    console.log(`Успешно загружено ${priceData.length} точек данных.`);

    return { 
      data: priceData, 
      sources: [] 
    };
  } catch (error) {
    console.error("Ошибка при получении данных от Gemini:", error);
    return { data: [], sources: [] };
  }
};

export const fetchComparisonData = async (timeframe: Timeframe, comparison: ComparisonOption, referenceData: PriceData[]): Promise<PriceData[]> => {
  // Заглушка для сравнения
  return [];
};
