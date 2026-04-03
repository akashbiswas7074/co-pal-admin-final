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
    brand: string;
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
    sample5mlPrice?: string;
    sample10mlPrice?: string;
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
    - brand: The brand name if visible.
    - description: A short, engaging summary (max 150 characters).
    - longDescription: A detailed, professional product description in HTML format (use <p>, <ul>, <li>, <strong> tags).
    - category: The broad category (e.g., Beauty, Electronics, Fashion).
    - subCategory: A more specific sub-category.
    - sku: Generate a professional SKU (e.g., BRAND-NAME-MODEL).
    - price: The price as a string (e.g. "1200"). If not visible, provide a realistic estimate.
    - discount: The discount percentage as a string (e.g. "10"). If not visible, use "0".
    - potential_sizes: An array of potential sizes or weights if visible (e.g., ["50ml", "100ml"] or ["S", "M", "L"]).
    - benefits: An array of key benefits if visible or inferable.
    - ingredients: An array of ingredients if visible (especially for beauty/health products).
    - details: A dictionary of other specs like Material, Color, etc.
    - shippingDimensions: An object with { length, breadth, height, weight } as strings (provide estimates if not clear).
    - questions: An array of 3 potential FAQ objects { question, answer } for this product.
    - sample5mlPrice: A realistic price for a 5ml sample of this product as a string (e.g. "60").
    - sample10mlPrice: A realistic price for a 10ml sample of this product as a string (e.g. "100").

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

