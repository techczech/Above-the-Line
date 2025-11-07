import { GoogleGenAI, Type } from "@google/genai";
import { Annotation } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please provide a valid key for the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateAnnotation = async (text: string, sourceLang: string, targetLang: string): Promise<Annotation> => {
  const langInstruction = sourceLang === 'Autodetect Language'
    ? 'First, automatically detect the language of the text. Then, for that language,'
    : `The provided text is in ${sourceLang}.`;

  const prompt = `
    ${langInstruction} provide a detailed grammatical annotation for the following text.
    Analyze the text paragraph by paragraph, and line by line.

    For each line, provide an idiomatic, natural-sounding translation of the entire line in ${targetLang}.

    Then, for each word within that line, provide:
    1. A literal, word-for-word translation in ${targetLang}.
    2. A detailed grammatical analysis.
    
    For the grammatical analysis:
    - Identify the part of speech (e.g., Noun, Verb, Adj).
    - For nouns, pronouns, and adjectives, specify case, gender, and number.
    - For verbs, specify tense, mood, voice, person, and number.
    - Keep the analysis concise and abbreviated (e.g., "Noun: Acc, Fem, Pl" or "V: Pres, Ind, Act, 3rd, Sg").

    Return the output ONLY as a JSON object following the specified schema. Do not add any extra text or markdown formatting.

    Original Text:
    ---
    ${text}
    ---
  `;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
        stanzas: {
            type: Type.ARRAY,
            description: "Each object represents a paragraph or stanza from the original text.",
            items: {
                type: Type.OBJECT,
                properties: {
                    lines: {
                        type: Type.ARRAY,
                        description: "Each object represents a line within the stanza.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                idiomaticTranslation: {
                                    type: Type.STRING,
                                    description: `An idiomatic, natural-sounding translation of the entire line in ${targetLang}.`
                                },
                                words: {
                                    type: Type.ARRAY,
                                    description: "Each object represents a single word with its analysis.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            original: { type: Type.STRING },
                                            translation: { type: Type.STRING },
                                            grammar: { type: Type.STRING, description: "Concise grammatical analysis." }
                                        },
                                        required: ["original", "translation", "grammar"]
                                    }
                                }
                            },
                             required: ["words"]
                        }
                    }
                },
                required: ["lines"]
            }
        }
    },
    required: ["stanzas"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("The model returned an empty response.");
    }

    const parsedJson = JSON.parse(jsonText);
    return parsedJson as Annotation;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate annotation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the annotation.");
  }
};