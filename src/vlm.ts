import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

const VLM_SYSTEM_PROMPT = `
You are an expert web accessibility and automation engineer. You are provided exclusively with a heavily pruned HTML DOM of a webpage. 
Your task is to analyze the textual and structural layout to understand the purpose of the interactive elements, and map them to their corresponding DOM nodes.

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

export async function generateSemanticMap(prunedHtml: string): Promise<any> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  console.log(`[VLM] Sending pruned HTML to Claude for text-only semantic mapping...`);
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0.1,
    system: VLM_SYSTEM_PROMPT,
    messages: [
      {
         role: 'user',
         content: [
           { 
             type: 'text', 
             text: `Pruned HTML DOM:\n\`\`\`html\n${prunedHtml}\n\`\`\`` 
           }
         ]
      }
    ]
  });

  let responseText = '';
  if (response.content.length > 0 && response.content[0].type === 'text') {
    responseText += response.content[0].text;
  }
  
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: If JSON is truncated, recover partial array
    if (responseText.includes('[')) {
        const startIdx = responseText.indexOf('[');
        let partial = responseText.substring(startIdx);
        const lastBrace = partial.lastIndexOf('}');
        if (lastBrace !== -1) {
            partial = partial.substring(0, lastBrace + 1) + ']';
            return JSON.parse(partial);
        }
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[VLM] Error parsing JSON output from Claude:', responseText);
    throw new Error('Failed to parse VLM response as JSON array');
  }
}
