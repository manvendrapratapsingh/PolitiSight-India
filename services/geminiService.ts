
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Report, SectionType, GroundingSource } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (context?: string): Chat => {
  const ai = getAiClient();
  const systemInstruction = `You are a helpful and knowledgeable AI political assistant for 'PolitiSight India'. 
  Answer questions about Indian politics, elections, and the application's analysis features. 
  Keep responses concise and neutral.
  ${context ? `\nCONTEXT: ${context}` : ''}`;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction,
    }
  });
};

export const generatePoliticalReport = async (
  topic: string, 
  historyContext: string[], // List of previous topics to inform the model
  onProgress: (stage: 'researching' | 'analyzing' | 'formatting') => void
): Promise<Report> => {
  const ai = getAiClient();
  
  // 1. Research Phase
  onProgress('researching');

  // We define the schema we want the AI to return.
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy, professional title for the report" },
      date: { type: Type.STRING, description: "Current date formatted nicely" },
      executiveSummary: { type: Type.STRING, description: "2-3 paragraphs summarizing the findings" },
      keyInsights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING, enum: ['trend-up', 'trend-down', 'alert', 'info'] },
            text: { type: Type.STRING },
            value: { type: Type.STRING, description: "Short stat e.g., '+15%'" },
            color: { type: Type.STRING, description: "Hex color code suitable for dark mode" }
          },
          required: ['icon', 'text']
        }
      },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['TEXT', 'BAR_CHART', 'PIE_CHART', 'LINE_CHART'] },
            content: { type: Type.STRING, description: "Markdown content. For charts, provide context/analysis." },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  label: { type: Type.STRING }
                },
                required: ['name', 'value']
              },
              nullable: true
            },
            chartConfig: {
               type: Type.OBJECT,
               properties: {
                 xLabel: { type: Type.STRING },
                 yLabel: { type: Type.STRING },
                 title: { type: Type.STRING }
               },
               nullable: true
            }
          },
          required: ['id', 'title', 'type', 'content']
        }
      }
    },
    required: ['title', 'executiveSummary', 'keyInsights', 'sections']
  };

  onProgress('analyzing');

  try {
    const userHistoryStr = historyContext.length > 0 
      ? `User's recent research history: ${historyContext.join(', ')}. Use this to understand the user's political interests, but focus primarily on the new topic.`
      : '';
    
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Conduct a deep, data-driven political analysis on: "${topic}". 
      Focus on Indian politics with real-time data.
      Today's date is ${today}.
      ${userHistoryStr}

      Structure the report with the following specific focus areas:
      1. **Current Political Situation**: The immediate context, recent events, and current standing.
      2. **Historical Trends**: Analysis of past elections/voting patterns relevant to the topic.
      3. **Future Projections (2025-2029)**: Based on past performance and current trends, provide data-backed projections for upcoming elections (e.g., 2027 Vidhan Sabha, 2029 Lok Sabha). Use scenario planning (e.g., "If Swing X happens...").
      4. **Demographic/Caste Dynamics**: If relevant, include social engineering analysis.

      You must return a JSON object that matches the following schema:
      ${JSON.stringify(schema, null, 2)}

      Requirements:
      - Include at least 3 sections with CHARTS (BAR_CHART, PIE_CHART, or LINE_CHART).
      - Ensure 'Future Projections' has a chart if possible.
      - For chart data, ensure 'value' is a number.
      
      IMPORTANT: Return ONLY the JSON string. Do not use Markdown code blocks or 'json' tags.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a senior Indian political analyst. You provide data-driven, neutral, and comprehensive reports. You extrapolate future trends based on historical data.",
        temperature: 0.3,
      }
    });

    onProgress('formatting');

    let responseText = response.text;
    if (!responseText) {
      throw new Error("No response generated");
    }

    // Clean up markdown code blocks if the model adds them (e.g. ```json ... ```)
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(responseText) as Omit<Report, 'id' | 'createdAt' | 'sources'>;

    // Extract grounding metadata (sources)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = [];
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
    
    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to generate analysis. Please try again.");
  }
};
