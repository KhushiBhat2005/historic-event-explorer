
import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // This is a fallback for development if the env var isn't set.
  // In a real production environment, this should throw an error or be handled securely.
  console.warn("API_KEY not found. Using a placeholder. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || " " });

export const generateSummary = async (description: string): Promise<string> => {
  if (!apiKey || apiKey === " ") {
    return "AI summary generation is unavailable. API key is not configured.";
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following historical event description in 2-3 concise sentences: "${description}"`,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    if (error instanceof Error) {
        return `AI generation failed: ${error.message}`;
    }
    return "AI generation failed due to an unknown error.";
  }
};
