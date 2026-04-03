import { GoogleGenAI } from "@google/genai";

const getGeminiApiKeys = () => {
    return [
        process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_4,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_5,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_6,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY_7,
    ].filter(Boolean) as string[];
};

export interface ProductAIAnalysis {
    name: string;
    description: string;
    longDescription: string;
    category: string;
    subCategory: string;
    sku: string;
    price: string;
    discount: string;
    potential_sizes: string[];
    benefits: string[];
    ingredients: string[];
    details: Record<string, string>;
    shippingDimensions: {
        length: string;
        breadth: string;
        height: string;
        weight: string;
    };
    questions: { question: string; answer: string }[];
    samples: { value: string; unit: string; price: string }[];
}


export async function analyzeProductImage(imageFile: File): Promise<ProductAIAnalysis | null> {
    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length === 0) {
        console.warn("Gemini API Keys are missing");
        return null;
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };

    const prompt = `
    Analyze this product image and extract as much information as possible to fill out a product creation form.
    Please return ONLY a JSON object with the following fields:
    - name: A professional product name (min 10 characters).
    - description: A short, engaging summary (max 150 characters).
    - longDescription: A detailed, MODERN and PROFESSIONAL product description in HTML format. 
      Use a clean, responsive structure with:
      - <h2> headers for major sections (e.g., "Key Features," "Why You'll Love It").
      - <p> tags with professional, marketing-oriented copy.
      - <ul> and <li> tags for clear, scannable lists.
      - <strong> for emphasis on key selling points.
      Do NOT use inline styles or fixed widths (must be fully responsive).
    - category: The broad category (e.g., Beauty, Electronics, Fashion).
    - subCategory: A more specific sub-category.
    - sku: Generate a professional SKU (e.g., BRAND-NAME-MODEL).
    - price: The price as a string (e.g. "1200"). If not visible, provide a realistic estimate.
    - discount: The discount percentage as a string (e.g. "10"). If not visible, use "0".
    - potential_sizes: An array of potential sizes or weights if visible (e.g., ["50ml", "100ml"] or ["S", "M", "L"]).
    - benefits: An array of key benefits if visible or inferable.
    - ingredients: An array of ingredients if visible (especially for beauty/health products).
    - details: A dictionary of other specs like Material, Color, etc.
    - shippingDimensions: An object with { length, breadth, height, weight } as strings (provide estimates if not clear). CRITICAL: Weight MUST be in Kilograms (KG). If the product weight is in grams (e.g. 500g), convert it to KG (0.5).
    - questions: An array of 3 potential FAQ objects { question, answer } for this product.
    - samples: An array of objects { value, unit, price } representing smaller trial versions (e.g. { value: "5", unit: "ml", price: "60" }). Provide 2-3 realistic options if it's a beauty or health product.


    Return ONLY the JSON. No markdown formatting, no code blocks, just the raw JSON string.
  `;

    // Try keys in random order
    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    let lastError: any = null;

    for (const apiKey of shuffledKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview", // As requested by user
                contents: [
                    { role: "user", parts: [{ text: prompt }, imagePart] }
                ],
            });

            const text = response.text;
            if (text) {
                const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(jsonString) as ProductAIAnalysis;
            }
        } catch (error: any) {
            console.error(`Gemini API Key failed: ${apiKey.substring(0, 8)}...`, error.message);
            lastError = error;

            // If gemini-3-flash-preview fails, backup to 1.5-flash with the same key
            if (error.message?.includes("not found") || error.message?.includes("404")) {
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const response = await ai.models.generateContent({
                        model: "gemini-1.5-flash",
                        contents: [
                            { role: "user", parts: [{ text: prompt }, imagePart] }
                        ],
                    });
                    const text = response.text;
                    if (text) {
                        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                        return JSON.parse(jsonString) as ProductAIAnalysis;
                    }
                } catch (innerError: any) {
                    console.error("Backup AI Analysis failed:", innerError.message || innerError);
                }
            }
            // Continue to next key if this one failed
        }
    }

    return null;
}

export async function generateCustomPageContent(title: string, userPrompt?: string): Promise<string | null> {
    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length === 0) {
        console.warn("Gemini API Keys are missing");
        return null;
    }

    const prompt = `
    You are an expert e-commerce content strategist and copywriter.
    Generate a PROFESSIONAL, MODERN, and ENGAGING custom page content for a website.
    The page title is: "${title}".
    ${userPrompt ? `Additional context or instructions: "${userPrompt}"` : ""}

    Requirements:
    - Return ONLY the HTML content. No markdown, no code blocks, no <html> or <body> tags.
    - Use clean, semantic HTML5.
    - Structure the content with:
        - <h2> and <h3> for subheadings.
        - <p> for paragraphs with professional marketing copy.
        - <ul> and <li> for bullet points.
        - <strong> for emphasis.
        - <br> for spacing if needed.
    - The tone should be authoritative yet welcoming, optimized for readability and SEO.
    - If the title suggests a specific type of page (e.g., "About Us", "Our Mission", "Shipping Policy"), include relevant sections for that type.
    - Do NOT use inline styles.

    Return the raw HTML string only.
    `;

    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);

    for (const apiKey of shuffledKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview", 
                contents: [
                    { role: "user", parts: [{ text: prompt }] }
                ],
            });

            const text = response.text;
            
            if (text) {
                // Clean up any markdown code blocks or other structural artifacts
                const cleanedHtml = text
                    .replace(/```html/g, "")
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .replace(/<!DOCTYPE html>/gi, "")
                    .replace(/<html>/gi, "")
                    .replace(/<\/html>/gi, "")
                    .replace(/<head>[\s\S]*?<\/head>/gi, "")
                    .replace(/<body>/gi, "")
                    .replace(/<\/body>/gi, "")
                    .trim();
                return cleanedHtml;
            }
        } catch (error: any) {
            console.error(`Gemini API Key failed during text generation: ${apiKey.substring(0, 8)}...`);
            console.error("Full AI Error:", error);
        }
    }

    return null;
}
export interface WebsiteSeoAnalysis {
    siteName: string;
    defaultTitle: string;
    siteDescription: string;
    siteKeywords: string[];
    ogTitle: string;
    ogDescription: string;
}

export async function generateWebsiteSeoContent(brandName: string, niche: string): Promise<WebsiteSeoAnalysis | null> {
    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length === 0) {
        console.warn("Gemini API Keys are missing");
        return null;
    }

    const prompt = `
    You are an expert SEO strategist for high-end e-commerce brands.
    Given a Brand Name: "${brandName}" and a Niche/Description: "${niche}".
    
    Generate optimized SEO metadata for the website.
    Please return ONLY a JSON object with the following fields:
    - siteName: A professional brand name (e.g. "Peed's Luxe").
    - defaultTitle: An SEO-optimized default page title (max 60 chars).
    - siteDescription: A compelling, keyword-rich meta description (max 160 chars).
    - siteKeywords: An array of 10-15 relevant SEO keywords.
    - ogTitle: A punchy title for social media sharing.
    - ogDescription: An engaging description for social media sharing.

    Return ONLY the JSON. No markdown, no code blocks, just the raw JSON string.
    `;

    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);

    for (const apiKey of shuffledKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    { role: "user", parts: [{ text: prompt }] }
                ],
            });

            const text = response.text;
            if (text) {
                const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(jsonString) as WebsiteSeoAnalysis;
            }
        } catch (error: any) {
            console.error(`Gemini API Key failed: ${apiKey.substring(0, 8)}...`, error.message);
            
            // Fallback to gemini-1.5-flash
            try {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [
                        { role: "user", parts: [{ text: prompt }] }
                    ],
                });
                const text = response.text;
                if (text) {
                    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                    return JSON.parse(jsonString) as WebsiteSeoAnalysis;
                }
            } catch (innerError: any) {
                console.error("Backup Website SEO AI Generation failed:", innerError.message || innerError);
            }
        }
    }

    return null;
}
