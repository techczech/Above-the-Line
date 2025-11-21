
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Annotation } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please provide a valid key for the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Retry Logic Helper ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes an async operation with exponential backoff for rate limit errors (429).
 */
async function runWithRetry<T>(
  operation: () => Promise<T>,
  retries = 5,
  initialDelay = 3000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for various forms of Rate Limit / Quota errors
    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      (error?.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')));

    if (isQuotaError && retries > 0) {
      console.warn(`Quota hit (429). Retrying in ${initialDelay}ms... (${retries} attempts left)`);
      await delay(initialDelay);
      // Exponential backoff: double the delay for the next attempt
      return runWithRetry(operation, retries - 1, initialDelay * 2);
    }

    throw error;
  }
}

// --- API Functions ---

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
    return await runWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      // The model might return the title in quotes, so let's remove them.
      return response.text.trim().replace(/^"|"$/g, '');
    });
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
    const response = await runWithRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
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
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("Service is currently busy (Quota exceeded). Please wait a minute or consider upgrading your API plan.");
        }
        throw new Error(`Failed to generate annotation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the annotation.");
  }
};

export const MALE_VOICES = ['Puck', 'Charon', 'Fenrir'];
export const FEMALE_VOICES = ['Kore', 'Zephyr'];
export const ALL_VOICES = [...FEMALE_VOICES, ...MALE_VOICES];

export interface SpeakerProfile {
  voice: string;
  gender: 'male' | 'female' | 'unknown';
  userOverride?: 'auto' | 'male' | 'female';
}

export const determineSpeakerGender = async (
  speaker: string,
  sampleText: string,
  language: string
): Promise<'male' | 'female' | 'unknown'> => {
  if (!language || language === 'Autodetect Language') {
    return 'unknown'; // Cannot determine without language context
  }

  const prompt = `
    Analyze the speaker's name/role and a sample of their dialogue in the ${language} language to determine their likely gender.
    Consider grammatical cues (like verb endings, adjectives which in many languages agree with gender) and the name/role itself (e.g., 'Prodavač' is male in Czech, 'Prodavačka' is female).
    
    Speaker: "${speaker}"
    Sample Dialogue: "${sampleText}"

    Respond with only one of the following words, in lowercase: 'male', 'female', or 'unknown'. Do not provide any explanation or other text.
  `;

  try {
    const response = await runWithRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
    });
    
    const result = response.text.trim().toLowerCase();
    if (result === 'male' || result === 'female') {
      return result;
    }
    return 'unknown';
  } catch (error) {
    console.error("Failed to determine speaker gender:", error);
    return 'unknown'; // Default on error
  }
};

export const generateSpeech = async (
  text: string, 
  speaker: string | null | undefined,
  language: string,
  currentProfileMap: Map<string, SpeakerProfile>
): Promise<{ base64Audio: string, profileMap: Map<string, SpeakerProfile> }> => {
  const profileMap = new Map(currentProfileMap);
  let voiceName = 'Kore'; // A neutral default voice

  if (speaker) {
    let profile = profileMap.get(speaker);

    if (!profile) {
      // New speaker, determine gender and assign a voice
      const gender = await determineSpeakerGender(speaker, text, language);
      
      const usedVoices = new Set(Array.from(profileMap.values()).map(p => p.voice));

      let voicePool: string[];
      if (gender === 'male') {
        voicePool = MALE_VOICES;
      } else if (gender === 'female') {
        voicePool = FEMALE_VOICES;
      } else {
        voicePool = ALL_VOICES;
      }
      
      let assignedVoice = voicePool.find(v => !usedVoices.has(v));
      if (!assignedVoice) {
        // All preferred voices are used, cycle through the pool
        const voicesInUseForThisGender = Array.from(profileMap.values())
            .filter(p => p.gender === gender)
            .length;
        assignedVoice = voicePool[voicesInUseForThisGender % voicePool.length];
      }
      
      profile = { voice: assignedVoice, gender, userOverride: 'auto' };
      profileMap.set(speaker, profile);
    }
    voiceName = profile.voice;
  }

  const prompt = `Read the following text aloud exactly as it is written. Do not add any extra words, sounds, or introductory phrases. The text is: "${text}"`;

  try {
    const response = await runWithRetry(async () => {
        return await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
                },
            },
        });
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("The model did not return audio data.");
    }
    return { base64Audio, profileMap };
  } catch (error) {
    console.error(`Gemini TTS API call failed for voice ${voiceName}:`, error);
    if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("Audio generation quota exceeded. Please wait a minute or upgrade your plan.");
        }
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
};
