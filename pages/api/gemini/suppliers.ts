import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_AI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_AI_API_KEY not configured' });
  }

  try {
    const { techPackSummary } = req.body;

    if (!techPackSummary) {
      return res.status(400).json({ error: 'No tech pack summary provided' });
    }

    const sourcingPrompt = `You are a world-class supply chain and manufacturing sourcing expert.
Your task is to find high-quality potential suppliers for a new product based on its tech pack.
You MUST use your Google Search grounding tool to find real, relevant companies.

**Instructions:**
- Analyze the provided tech pack summary to understand the product's materials, complexity, and category.
- Find 5-7 potential manufacturers that specialize in this type of product.
- Prioritize suppliers with a good online presence, clear capabilities, and experience in the product category.
- The output MUST be a single block of well-formatted HTML. Do NOT include \`<html>\` or \`<body>\` tags.
- The HTML should be a single \`<table>\` with the class \`supplier-table\`.
- The table must have the following columns: "Supplier Name", "Location", "Specialization", and "Website".
- For the "Website" column, provide a direct, clickable \`<a>\` link to the supplier's website.

**Tech Pack Summary:**
---
${techPackSummary}
---

Now, perform the search and generate the HTML table of potential suppliers.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: sourcingPrompt },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "AI did not return supplier information" });
    }

    return res.status(200).json({ suppliersHtml: response.text });
  } catch (error) {
    console.error("Error finding suppliers:", error);
    return res.status(500).json({ error: "Failed to find suppliers" });
  }
}
