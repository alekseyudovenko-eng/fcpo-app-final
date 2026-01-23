import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from './types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  if (!genAI) return { data: [], sources: [] };

  try {
    // ВТОРОЙ АРГУМЕНТ { apiVersion: "v1beta" } — ЭТО ФИКС ОШИБКИ 404
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
    }, { apiVersion: "v1beta" }); 

    const prompt = `Provide exactly 30 historical price points for FCPO futures for ${timeframe}. Return JSON with "prices" array. Values between 3800 and 4200.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text || '{"prices": []}');
    
    return { data: parsed.prices || [], sources: [] };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { data: [], sources: [] };
  }
};

export const fetchComparisonData = async (timeframe: Timeframe, comparison: ComparisonOption, referenceData: PriceData[]): Promise<PriceData[]> => [];
