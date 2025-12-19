
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Difficulty, DifficultyConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeForensicEvidence = async (
  documentTitle: string, 
  content: string, 
  userQuery: string,
  mode: 'shadow' | 'forensic' = 'shadow',
  difficultyConfig?: DifficultyConfig
) => {
  try {
    let systemInstruction = "";
    
    if (mode === 'shadow') {
      systemInstruction = `You are a corrupt, high-stakes financial consultant advising the CFO of WorldCom in 2002.
      
      CONTEXT:
      - The goal is to keep the stock price high at all costs.
      - We need to hide losses but avoid getting caught by the SEC or Arthur Andersen.
      - Use "Corporate Speak" to justify unethical actions (e.g., "aggressive accounting," "creative interpretation").
      - Warn about the specific jail time or fines if this goes wrong.
      
      Your tone should be: Cynical, pragmatic, intelligent, and slightly nervous about the legal risks.`;
    } else {
      const auditorPersonality = difficultyConfig?.auditorAggression || "Senior Forensic Accountant";
      
      systemInstruction = `You are a ${auditorPersonality} for the SEC (Securities and Exchange Commission).
      
      CONTEXT:
      - You are analyzing a potential financial crime.
      - Identify specifically which GAAP principles are being violated (e.g., Matching Principle, Revenue Recognition).
      - Explain the mechanism of the fraud in technical but clear terms.
      - State the likely legal charge (e.g., Securities Fraud, Filing False Statements).
      
      Your tone should be: Objective, strict, analytical, and authoritative. Focus on the facts and the law.`;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${systemInstruction}
      
      TOPIC: "${documentTitle}"
      DETAILS: "${content}"
      
      USER QUESTION: "${userQuery}"`,
      config: {
        temperature: 0.7, 
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Connection to Server failed. Data unavailable.";
  }
};

export const searchRelevantEvidence = async (query: string, documents: {id: string, title: string, content: string}[]) => {
  if (!query.trim()) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an intelligent search assistant for a game about the WorldCom fraud.
      
      Query: "${query}"
      
      Documents:
      ${JSON.stringify(documents.map(d => ({id: d.id, text: d.title + ": " + d.content})))}
      
      Identify which documents are semantically relevant to the query.
      Return a JSON array of the matching document IDs.
      If no documents match, return an empty array.`,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("AI Search Error:", error);
    // Fallback to simple text matching
    const lowerQuery = query.toLowerCase();
    return documents.filter(d => 
        d.title.toLowerCase().includes(lowerQuery) || 
        d.content.toLowerCase().includes(lowerQuery)
    ).map(d => d.id);
  }
};
