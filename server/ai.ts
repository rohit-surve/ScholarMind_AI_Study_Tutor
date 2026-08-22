import { GoogleGenAI, Type } from '@google/genai';

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Add it to the server environment and restart the app.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback chain for high availability when upstream Gemini servers experience temporary demand spikes (503 / 429)
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
].filter((model): model is string => Boolean(model));

const GREETING_TRANSLATIONS: Record<string, string> = {
  hi: 'नमस्ते',
  bn: 'নমস্কার',
  te: 'నమస్కారం',
  mr: 'नमस्कार',
  ta: 'வணக்கம்',
  gu: 'નમસ્તે',
  kn: 'ನಮಸ್ಕಾರ',
  ml: 'നമസ്കാരം',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  or: 'ନମସ୍କାର',
  ur: 'سلام',
  as: 'নমস্কাৰ',
  en: 'Hello',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  const status = err.status || err.code || err.statusCode || '';
  const statusStr = String(status).toUpperCase();

  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    statusStr === 'UNAVAILABLE' ||
    statusStr === 'RESOURCE_EXHAUSTED' ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('spikes in demand') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('overloaded') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset')
  );
}

const LANGUAGE_SCRIPT_PATTERNS: Record<string, RegExp> = {
  hi: /[\u0900-\u097F]/,
  mr: /[\u0900-\u097F]/,
  bn: /[\u0980-\u09FF]/,
  as: /[\u0980-\u09FF]/,
  pa: /[\u0A00-\u0A7F]/,
  gu: /[\u0A80-\u0AFF]/,
  or: /[\u0B00-\u0B7F]/,
  ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/,
  kn: /[\u0C80-\u0CFF]/,
  ml: /[\u0D00-\u0D7F]/,
  ur: /[\u0600-\u06FF]/,
};

function requiresLanguageTranslation(text: string, languageCode: string | undefined): boolean {
  if (!languageCode || languageCode === 'en') return false;
  const scriptPattern = LANGUAGE_SCRIPT_PATTERNS[languageCode];
  if (!scriptPattern) return false;
  const letters = text.match(/[A-Za-z\u00C0-\uFFFF]/g) || [];
  const selectedScriptLetters = text.match(new RegExp(scriptPattern.source, 'g')) || [];
  return letters.length > 0 && selectedScriptLetters.length < Math.max(2, Math.ceil(letters.length * 0.2));
}

async function translateResponseIfNeeded(
  model: string,
  responseText: string,
  language: string | undefined,
  languageCode: string | undefined,
): Promise<string> {
  if (!requiresLanguageTranslation(responseText, languageCode)) return responseText;

  try {
    const translated = await generateContentWithFallback({
      contents: [{
        role: 'user',
        parts: [{
          text: `Translate the following AI study response into ${language}. This is a translation task, not a request to answer in English. Preserve Markdown structure, code blocks, formulas, URLs, numbers, and technical identifiers. Translate every explanation, heading, label, example, and conclusion. Output only the translated response in the selected language and native script.\n\nSOURCE RESPONSE:\n${responseText}`,
        }],
      }],
      config: {
        systemInstruction: `You are a precise educational translator. The target output language is ${language}. Never output English prose. Preserve code and mathematical notation exactly when possible.`,
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });
    return translated.text?.trim() || responseText;
  } catch (error: any) {
    console.warn(`[AI Service] Translation fallback failed for ${model}:`, error?.message || error);
    return responseText;
  }
}

/**
 * Executes a Gemini generateContent call with automatic retry and model fallback.
 */
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getAiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Service] Model ${model} (attempt ${attempt + 1}) failed:`, err?.message || err);
        if (isRetryableError(err)) {
          if (attempt === 0) {
            await delay(600);
            continue;
          }
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All AI models are currently experiencing high demand. Please try again shortly.');
}

export const STUDY_MODE_PROMPTS: Record<string, string> = {
  tutor: `You are an elite, encouraging Socratic AI Study Tutor. 
Your goal is not just to give answers, but to foster deep understanding.
- Break concepts down logically into clear, digestible steps.
- Use intuitive mental models, practical examples, and analogies.
- Frequently include a short check question or prompt at the end to verify the student's comprehension.
- Format with rich Markdown, clear headings, bullet points, and LaTeX/math where appropriate ($...$ for inline, $$...$$ for block).`,

  exam: `You are a strict, high-yield Exam Preparation AI Coach.
- Focus on high-frequency exam topics, standard grading criteria, and mark-maximizing presentation.
- Highlight common exam pitfalls, traps, and misconceptions students frequently make.
- Include structured formulas, official definitions, and sample exam-style questions with marking schemes.
- Provide crisp, direct, and authoritative explanations.`,

  beginner: `You are a friendly, patient Beginner Explainer (ELI5 style).
- Assume zero prior background in the subject.
- Eliminate all unnecessary jargon, or clearly define any essential technical terms using everyday metaphors.
- Keep sentences accessible, clear, and engaging.
- Use step-by-step visual descriptions, everyday comparisons, and relatable analogies.`,

  coding: `You are an expert Senior Computer Science Instructor and Software Architect.
- Provide clean, modern, fully-typed code examples in the appropriate programming language.
- Always include Big-O Time and Space Complexity analysis.
- Walk through the logic step-by-step, highlighting edge cases, potential bugs, and optimization techniques.
- Provide clear syntax-highlighted code blocks with helpful inline comments.`,

  quiz: `You are an interactive Quiz Master and Assessment Evaluator.
- Test the user's knowledge through active recall questions, situational challenges, and conceptual drills.
- If the user answered a question, evaluate their response with precise score feedback, explain why alternatives are incorrect, and provide the correct reasoning.
- Keep the practice focused, stimulating, and targeted on weak areas.`,

  quick_revision: `You are a Rapid-Fire Revision and Cramming Assistant.
- Deliver high-density, concise cheat-sheet summaries.
- Use bullet points, bold key terms, formula boxes, comparison tables, and memory mnemonics.
- Strip out fluff: give only the essential points needed 15 minutes before an exam.`
};

export const aiService = {
  // 1. Streaming chat response with resilient model fallback
  async *streamChat(params: {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    studyMode?: string;
    responseLanguage?: string;
    documentContext?: string;
  }) {
    const ai = getAiClient();
    const mode = params.studyMode || 'tutor';
    const baseSystemPrompt = STUDY_MODE_PROMPTS[mode] || STUDY_MODE_PROMPTS.tutor;
    const languageCode = params.responseLanguage?.match(/,\s*([a-z]{2})\)/i)?.[1]?.toLowerCase();
    const greetingExample = languageCode && GREETING_TRANSLATIONS[languageCode]
      ? ` For example, if the English input is "hello", answer with "${GREETING_TRANSLATIONS[languageCode]}" (and continue all further explanation in the selected language).`
      : '';
    
    let fullSystemInstruction = baseSystemPrompt;
    if (params.responseLanguage) {
      fullSystemInstruction += `\n\n=== NON-NEGOTIABLE OUTPUT LANGUAGE ===\nThe student selected: ${params.responseLanguage}. This is a hard output requirement. Treat every student message as content that may need translation, including English questions, greetings, and one-word inputs. The language used in the question must never determine your reply language. Translate the meaning and answer entirely in the selected language and its native script.${greetingExample} Do not echo English input when an equivalent selected-language expression exists. Do not answer in English or translate the answer back to English. Preserve formulas, code syntax, URLs, and standard technical identifiers when necessary, but explain all surrounding text in the selected language. Only change language if the student explicitly requests a different output language.\n=== END NON-NEGOTIABLE OUTPUT LANGUAGE ===`;
    }
    if (params.documentContext) {
      fullSystemInstruction += `\n\n=== RELEVANT STUDY DOCUMENT CONTEXT ===\nUse the following reference document content to accurately and factually answer the student's question:\n${params.documentContext}\n=== END DOCUMENT CONTEXT ===`;
    }

    const contents: any[] = [];
    const recentMessages = params.messages.slice(-15);
    const latestUserMessageIndex = recentMessages.map(message => message.role).lastIndexOf('user');
    const languageDirective = params.responseLanguage
      ? `[MANDATORY OUTPUT LANGUAGE: ${params.responseLanguage}] The input below may be English, but it must be translated or answered in the selected language. Never mirror the input language. Reply only in the selected language and its native script. Keep code, formulas, and technical identifiers unchanged, but write all explanations, headings, labels, examples, and conclusions in the selected language.\n\nSTUDENT INPUT:\n`
      : '';

    for (const [index, msg] of recentMessages.entries()) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: index === latestUserMessageIndex ? `${languageDirective}${msg.content}` : msg.content }]
      });
    }

    let streamSucceeded = false;
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 1; attempt++) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: fullSystemInstruction,
              temperature: mode === 'exam' || mode === 'coding' ? 0.3 : 0.7,
              maxOutputTokens: 4096,
            }
          });

          let responseText = '';
          for await (const chunk of responseStream) {
            if (chunk.text) {
              responseText += chunk.text;
            }
          }

          if (responseText) {
            const finalResponse = await translateResponseIfNeeded(
              model,
              responseText,
              params.responseLanguage,
              languageCode,
            );
            yield finalResponse;
            streamSucceeded = true;
            return;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[AI Service streamChat] ${model} (attempt ${attempt + 1}) failed:`, err?.message || err);
          break;
        }
      }
    }

    if (!streamSucceeded) {
      console.error('[AI Service streamChat] All candidate models exhausted:', lastError);
      throw lastError || new Error('All configured Gemini models failed to generate a response.');
    }
  },

  // 2. Generate comprehensive Study Notes
  async generateNotes(topic: string, subject?: string, detailLevel: 'concise' | 'standard' | 'comprehensive' = 'standard') {
    const prompt = `Generate a masterclass-quality structured study note on the topic: "${topic}"${subject ? ` in the subject of ${subject}` : ''}. Detail level: ${detailLevel}.
The output must be formatted in clean Markdown including:
1. # Clear H1 Title
2. Executive Overview / Summary (2-3 sentences)
3. Core Principles & Detailed Conceptual Breakdown with Subheadings
4. Key Definitions & Important Terminology
5. Equations / Formulas / Code (if applicable) with LaTeX or syntax highlighting
6. Practical Real-World Application or Case Study
7. Common Misconceptions & Exam Tips
8. Key Takeaways bullet list (5 high-yield bullets)
9. 3 Self-Test Quick Review Questions with brief answers at the end.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an award-winning university professor and textbook author creating pristine, crystal-clear study notes.',
        temperature: 0.4,
      }
    });

    return response.text || 'Unable to generate notes.';
  },

  // 3. Text Summarizer
  async summarizeText(text: string, format: 'bullet_points' | 'executive' | 'key_takeaways' | 'simplified' = 'bullet_points') {
    const prompt = `Summarize the following study material using format: "${format}".
Source Content:
"""
${text}
"""
Provide an ultra-clear, insightful, high-yield summary preserving all critical facts, dates, names, formulas, and arguments.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert academic research summarizer capable of distilling complex documents into crisp, memorable summaries.',
      }
    });

    return response.text || 'Unable to summarize text.';
  },

  // 4. Generate structured MCQ Quiz
  async generateQuiz(params: {
    topic: string;
    subject?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
    documentText?: string;
  }) {
    const { topic, subject, difficulty, questionCount, documentText } = params;

    let contentPrompt = `Generate a rigorous ${questionCount}-question multiple-choice quiz on "${topic}"${subject ? ` for ${subject}` : ''}.
Difficulty level: ${difficulty}.`;

    if (documentText) {
      contentPrompt += `\nBase the questions on this uploaded document material:\n"""\n${documentText.slice(0, 8000)}\n"""`;
    }

    const response = await generateContentWithFallback({
      contents: contentPrompt,
      config: {
        systemInstruction: 'You are a professional educational assessment designer who creates fair, challenging, unambiguous multiple-choice questions with 4 distinct options, accurate answer keys, and clear explanations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              }
            }
          },
          required: ['title', 'questions'],
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return parsed;
    } catch (e) {
      console.error('Failed to parse quiz JSON:', response.text);
      throw new Error('AI failed to generate valid quiz structure. Please try again.');
    }
  },

  // 5. Generate Flashcards Deck
  async generateFlashcards(params: {
    topic: string;
    subject?: string;
    cardCount: number;
    difficulty?: string;
    sourceText?: string;
  }) {
    const { topic, subject, cardCount, difficulty = 'medium', sourceText } = params;

    let contentPrompt = `Generate ${cardCount} active-recall flashcards on "${topic}"${subject ? ` (${subject})` : ''}. Difficulty: ${difficulty}.`;
    if (sourceText) {
      contentPrompt += `\nExtract key concepts, definitions, and mechanisms from this source text:\n"""\n${sourceText.slice(0, 8000)}\n"""`;
    }

    const response = await generateContentWithFallback({
      contents: contentPrompt,
      config: {
        systemInstruction: 'You are a spaced-repetition and memory science expert. Create focused, high-yield flashcards with punchy front prompts and clear, accurate back explanations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question or prompt' },
                  back: { type: Type.STRING, description: 'Answer or explanation' },
                  hint: { type: Type.STRING, description: 'Helpful memory clue' },
                  difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                },
                required: ['front', 'back'],
              }
            }
          },
          required: ['title', 'cards'],
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      throw new Error('AI failed to generate flashcard deck structure.');
    }
  },

  // 6. Generate Study Plan
  async generateStudyPlan(params: {
    goal: string;
    subject?: string;
    daysCount: number;
    dailyHours: number;
    currentLevel?: string;
  }) {
    const { goal, subject, daysCount, dailyHours, currentLevel = 'intermediate' } = params;

    const contentPrompt = `Create a realistic, structured ${daysCount}-day study schedule to achieve this goal: "${goal}"${subject ? ` in ${subject}` : ''}.
Daily commitment: ${dailyHours} hours/day. Current student level: ${currentLevel}.
Generate actionable tasks per day with realistic duration estimates.`;

    const response = await generateContentWithFallback({
      contents: contentPrompt,
      config: {
        systemInstruction: 'You are an academic advisor and time-management coach designing high-efficiency study plans.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            targetGoal: { type: Type.STRING },
            weeklySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        task: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                      },
                      required: ['task', 'durationMinutes'],
                    }
                  }
                },
                required: ['day', 'focus', 'tasks'],
              }
            }
          },
          required: ['title', 'targetGoal', 'weeklySchedule'],
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      throw new Error('AI failed to generate study plan structure.');
    }
  },

  // 7. Explain Code
  async explainCode(code: string, language?: string) {
    const prompt = `Deeply explain the following ${language || 'programming'} code snippet for a computer science student:
\`\`\`${language || ''}
${code}
\`\`\`

Format your response in Markdown with:
1. **High-Level Purpose**: What problem this code solves in 2 sentences.
2. **Line-by-Line / Block-by-Block Walkthrough**: Clear analysis of key logic flow.
3. **Time & Space Complexity**: Big-O analysis with exact justification.
4. **Edge Cases & Failure Modes**: Potential bugs, null checks, boundary hazards.
5. **Optimizations / Best Practice Alternatives**: Refactored code snippet if improvements exist.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are a staff software engineer and computer science professor specializing in clean code and algorithmic pedagogy.',
      }
    });

    return response.text || 'Unable to explain code.';
  },

  // 8. Step-by-Step Doubt Solver
  async solveDoubt(doubt: string, subject?: string) {
    const prompt = `Solve this academic doubt / problem step-by-step:
"${doubt}"${subject ? ` (Subject: ${subject})` : ''}

Format in Markdown:
1. **Understanding the Problem**: What are the given variables, constraints, and target question?
2. **Key Formulas / Theorems Needed**: State all prerequisite concepts.
3. **Step-by-Step Working**: Clear, numbered, unskipped algebraic or conceptual steps with thorough explanations.
4. **Final Answer Verification**: Double-check the answer and state the final result boxed or bolded.
5. **Pro Tip / Shortcut**: How to solve similar problems faster on an exam.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an empathetic master tutor who breaks complex multi-step problems into intuitive, foolproof steps.',
      }
    });

    return response.text || 'Unable to solve doubt.';
  },

  // 9. Multi-Level Topic Explainer
  async explainTopic(topic: string, level: '5yo' | 'high_school' | 'college' | 'expert' | 'all' = 'all') {
    const prompt = `Explain the concept: "${topic}" across different depth levels.
Selected Level: ${level}.
If level is "all", provide:
- **Level 1: Like I'm 5 Years Old (ELI5)**: Pure intuitive analogy.
- **Level 2: High School Level**: Fundamental scientific/logical mechanics without overly heavy math.
- **Level 3: Undergraduate College Level**: Rigorous definitions, mathematical/technical equations, formal mechanisms.
- **Level 4: Industry / Research Expert Level**: Cutting-edge nuances, edge-case applications, state of the art.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are a versatile polymath teacher who can tailor concepts from kindergarten simplicity to PhD-level rigor.',
      }
    });

    return response.text || 'Unable to explain topic.';
  },

  // 10. Generate Practice Questions
  async generateQuestions(topic: string, type: 'conceptual' | 'numerical' | 'coding' | 'mixed' = 'mixed') {
    const prompt = `Generate 5 high-yield practice questions of type "${type}" for topic: "${topic}".
For each question:
- State the Question clearly.
- Provide a [Hint] dropdown or spoiler.
- Provide the [Detailed Solution & Explanation].`;

    const response = await generateContentWithFallback({
      contents: prompt,
    });

    return response.text || 'Unable to generate questions.';
  },

  // 11. Parse & Summarize Document on Upload
  async analyzeDocument(docText: string, fileName: string) {
    const prompt = `Analyze this uploaded study material ("${fileName}"):
"""
${docText.slice(0, 10000)}
"""

Extract:
1. A concise 3-sentence summary of the document.
2. A list of 5-8 primary key topics/concepts covered.
3. 3 suggested study questions a student can ask the AI about this document.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            }
          },
          required: ['summary', 'keyTopics', 'suggestedQuestions'],
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        summary: 'Uploaded study document parsed successfully.',
        keyTopics: ['Study Material', fileName],
        suggestedQuestions: ['What are the main concepts in this document?', 'Summarize the key formulas', 'Create a quiz based on this text']
      };
    }
  }
};