import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Annotation } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please provide a valid key for the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateTitle = async (text: string): Promise<string> => {
  const prompt = `Analyze the following text. First, identify its language. Second, identify its type (e.g., Poem, Prose, Article, Dialogue). Third, briefly summarize its content in a few words.
Based on this analysis, generate a title in the following format: "[Type] in [Language] about [Content Summary]".

Example output for a Czech poem about a mother: "Poem in Czech about a Mother's Love"
Example output for a Latin text about war: "Prose in Latin about the Trojan War"

Return ONLY the generated title as a single line of plain text, without any introductory phrases, labels, or quotation marks.

Text:
---
${text.substring(0, 1000)}
---
`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // The model might return the title in quotes, so let's remove them.
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Failed to generate title:", error);
    return "Untitled Text"; // Fallback title
  }
};

export const generateAnnotation = async (text: string, sourceLang: string, targetLang: string): Promise<Annotation> => {
  const langInstruction = sourceLang === 'Autodetect Language'
    ? 'First, automatically detect the language of the text. Then, for that language,'
    : `The provided text is in ${sourceLang}.`;

  const prompt = `
    ${langInstruction} first analyze the text to determine its type: 'poem', 'prose', or 'dialogue'.
    Then, provide a detailed grammatical annotation for the text. Analyze the text paragraph by paragraph, and line by line.

    If the text type is 'dialogue', for each line of dialogue, identify the speaker. The speaker's name must be placed in a 'speaker' field for that line. The speaker's name itself should NOT be included in the 'words' array.

    For each line, provide an idiomatic, natural-sounding translation of the entire line in ${targetLang}.

    Then, break down the line into individual words AND PUNCTUATION marks. It is CRITICAL that every punctuation mark (e.g., '.', ',', '?', '!') is treated as a separate item in the 'words' array. Do not group punctuation with words.
    
    For each item (word or punctuation), provide:
    1. 'original': The word or punctuation mark.
    2. 'translation': A literal, word-for-word translation in ${targetLang}. For punctuation, this should be the same punctuation mark.
    3. 'grammar': A detailed grammatical analysis. For punctuation, use 'Punct'.

    For the grammatical analysis:
    - Identify the part of speech (e.g., Noun, Verb, Adj).
    - For nouns, pronouns, and adjectives, specify case, gender, and number.
    - For verbs, specify tense, mood, voice, person, and number.
    - Keep the analysis concise and abbreviated (e.g., "Noun: Acc, Fem, Pl" or "V: Pres, Ind, Act, 3rd, Sg").

    Return the output ONLY as a single JSON object following the specified schema. The JSON object must have a 'textType' field at the root level, set to 'poem', 'prose', or 'dialogue'. Do not add any extra text or markdown formatting.

    Original Text:
    ---
    ${text}
    ---
  `;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
        textType: {
            type: Type.STRING,
            enum: ['poem', 'prose', 'dialogue'],
            description: "The type of the text provided, determined by analysis."
        },
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
                                speaker: {
                                    type: Type.STRING,
                                    description: "If the text is a dialogue, this is the speaker of the line. Omit for non-dialogue text."
                                },
                                idiomaticTranslation: {
                                    type: Type.STRING,
                                    description: `An idiomatic, natural-sounding translation of the entire line in ${targetLang}.`
                                },
                                words: {
                                    type: Type.ARRAY,
                                    description: "Each object represents a single word or punctuation mark with its analysis.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            original: { type: Type.STRING },
                                            translation: { type: Type.STRING },
                                            grammar: { type: Type.STRING, description: "Concise grammatical analysis. Use 'Punct' for punctuation." }
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
    required: ["stanzas", "textType"]
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

  } catch (error)
 {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate annotation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the annotation.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a neutral and clear voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm, clear voice
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("The model did not return audio data.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
};