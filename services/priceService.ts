import { GoogleGenAI, SchemaType } from "@google/generative-ai";
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = API_KEY ? new GoogleGenAI(API_KEY) : null;

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[] }> => {
  if (!genAI) return { data: [], sources: [] };

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

    const result = await model.generateContent(`Get FCPO futures prices for ${timeframe}`);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text || '{"prices": []}');
    
    return { 
      data: parsed.prices || [], 
      sources: [] 
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return { data: [], sources: [] };
  }
};

export const fetchComparisonData = async (timeframe: Timeframe, comparison: ComparisonOption, referenceData: PriceData[]): Promise<PriceData[]> => {
  return [];
};
