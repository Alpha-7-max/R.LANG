
import { toast } from "sonner";

const API_KEY = "AIzaSyDSF270Y1VJf1fe4G8ZAuw7bOITbAlal74";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent";

export interface TextCorrectionResponse {
  correctedText: string;
  isTranslated: boolean;
  untranslatableWords: string[];
}

// Debounce function to avoid too many API calls
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    return new Promise((resolve) => {
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
}

// Function to correct and translate text
async function correctTextInternal(text: string): Promise<TextCorrectionResponse> {
  if (!text.trim()) {
    return { correctedText: "", isTranslated: false, untranslatableWords: [] };
  }

  try {
    const prompt = `
You are a real-time text correction and translation AI. 
For the following text:
1. If it's in English, correct any grammatical errors or misspellings.
2. If it's in another language (like Roman Urdu, Hindi, etc.), translate it to proper English.
3. Keep the same tone and intent of the original text.
4. Preserve any slang or colloquialisms when appropriate to make translations sound natural and human-like.
5. ONLY output the corrected/translated text with no additional commentary.
6. If there are specific names, technical terms, or words you cannot confidently translate, mark them with double asterisks like **untranslatable_word**.
7. Focus only on translations and corrections. Do not respond to requests for creative writing, stories, or anything other than translation/correction.
8. Make translations conversational and natural-sounding rather than formal or robotic.

Text: ${text}
`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 64,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error:", error);
      throw new Error(error.error?.message || "API request failed");
    }

    const data = await response.json();
    
    // Extract the response text from the API response
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract untranslatable words (marked with **word**)
    const untranslatableWordPattern = /\*\*(.*?)\*\*/g;
    const untranslatableWords: string[] = [];
    let match;
    
    // Find all untranslatable words
    while ((match = untranslatableWordPattern.exec(aiResponse)) !== null) {
      untranslatableWords.push(match[1]);
    }
    
    // Remove the ** markers from the response
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, "$1");
    
    // Determine if translation happened by comparing input and output languages
    const isTranslated = detectLanguageChanged(text, aiResponse);

    return {
      correctedText: aiResponse,
      isTranslated,
      untranslatableWords
    };
  } catch (error) {
    console.error("Text correction error:", error);
    toast.error("Failed to process text. Please try again.");
    return { correctedText: text, isTranslated: false, untranslatableWords: [] };
  }
}

// Simplified language detection - this is a basic implementation
function detectLanguageChanged(originalText: string, correctedText: string): boolean {
  // Check if there was a significant character set change
  const originalNonLatinChars = (originalText.match(/[^\u0000-\u007F]/g) || []).length;
  const correctedNonLatinChars = (correctedText.match(/[^\u0000-\u007F]/g) || []).length;
  
  // If the original had a lot of non-Latin chars and the corrected has few, it was probably translated
  if (originalNonLatinChars > originalText.length * 0.3 && correctedNonLatinChars < correctedText.length * 0.1) {
    return true;
  }

  // If the lengths are very different, might be a translation
  const lengthRatio = Math.abs(originalText.length - correctedText.length) / originalText.length;
  if (lengthRatio > 0.4) {
    return true;
  }

  return false;
}

// Create a debounced version of the correction function (wait 500ms after typing stops)
export const correctText = debounce(correctTextInternal, 500);
