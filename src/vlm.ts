import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const VLM_SYSTEM_PROMPT = `
You are an expert web accessibility and automation engineer. You are provided with a screenshot of a webpage and its heavily pruned HTML DOM. 
Your task is to analyze the visual layout to understand the purpose of the interactive elements, and map them to their corresponding DOM nodes.

You must output a strictly formatted JSON array of objects representing the "Semantic Map" of the page.
Prioritize highly resilient selectors: \`aria-label\`, \`role\`, \`data-testid\`, \`name\`, and \`id\`. Avoid brittle nested CSS paths.

Return ONLY a valid JSON array with this exact schema for each interactive element. Do not wrap it in markdown.
[
  {
    "intent": "string (e.g., 'enter_email', 'navigate_home', 'adjust_brightness')",
    "selector": "string (the most robust CSS/XPath selector possible)",
    "action_type": "string ('type', 'click', 'select', 'drag')",
    "semantic_label": "string (the human-readable text or icon meaning)",
    "is_navigation": "boolean (true ONLY if interacting navigates to a different view, page, or modal)",
    "available_options": ["array of strings (ONLY IF element is a <select> dropdown, radial group, or range slider, list the distinct values/states)"],
    "interaction_steps": "string (Explain the exact DOM manipulation required. e.g. 'Click the input box, type the string, and press Enter' or 'Drag the slider thumbnail across the track horizontal limits' or 'null' if basic click)"
  }
]
`;

export async function generateSemanticMap(prunedHtml: string, screenshotPath: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Read screenshot and convert to base64 inline data
  const imageBuff = fs.readFileSync(screenshotPath);
  const imageBase64 = imageBuff.toString('base64');
  
  console.log(`[VLM] Sending pruned HTML and screenshot to Gemini...`);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      {
         role: 'user',
         parts: [
           { text: VLM_SYSTEM_PROMPT },
           { text: `Pruned HTML DOM:\n\`\`\`html\n${prunedHtml}\n\`\`\`` },
           { 
             inlineData: {
               data: imageBase64,
               mimeType: 'image/png'
             }
           }
         ]
      }
    ],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  });

  const responseText = response.text || '';
  
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[VLM] Error parsing JSON output from Gemini:', responseText);
    throw new Error('Failed to parse VLM response as JSON array');
  }
}
