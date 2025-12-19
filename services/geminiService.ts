
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// FIX: Always use a named parameter for the API key from process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeForensicEvidence = async (documentTitle: string, content: string, userQuery: string) => {
  try {
    // FIX: Properly type the response as GenerateContentResponse and use the .text property.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a forensic audit assistant helping an internal auditor at WorldCom in June 2002. 
      You are analyzing a document titled "${documentTitle}" with the following content: "${content}". 
      The user asks: "${userQuery}". 
      Explain the accounting fraud implications in simple terms, focusing on how this helped hide WorldCom's actual financial state.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "I'm having trouble analyzing this document right now. Please try again later.";
  }
};
