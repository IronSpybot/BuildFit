import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

/**
 * Intelligent deterministic fallback nutritionist if GEMINI_API_KEY is not set or network fails
 */
function estimateNutritionalFallback(query: string) {
  const q = query.toLowerCase();
  
  if (q.includes('chapati') || q.includes('curry')) {
    const chapatis = q.includes('3') ? 3 : 2;
    const baseCal = chapatis * 105 + 320;
    return {
      name: `${chapatis} Chapatis & Chicken Curry`,
      calories: baseCal,
      protein: 36,
      carbs: chapatis * 20 + 8,
      fat: 16,
    };
  }

  if (q.includes('pizza')) {
    return {
      name: 'Pizza Slices',
      calories: 580,
      protein: 24,
      carbs: 64,
      fat: 26,
    };
  }

  if (q.includes('salmon') || q.includes('fish')) {
    return {
      name: 'Baked Salmon Fillet & Greens',
      calories: 490,
      protein: 42,
      carbs: 12,
      fat: 22,
    };
  }

  if (q.includes('burger')) {
    return {
      name: 'Cheeseburger',
      calories: 620,
      protein: 34,
      carbs: 46,
      fat: 32,
    };
  }

  if (q.includes('salad') || q.includes('chicken')) {
    return {
      name: 'Grilled Chicken Garden Salad',
      calories: 380,
      protein: 40,
      carbs: 14,
      fat: 16,
    };
  }

  if (q.includes('egg') || q.includes('toast')) {
    return {
      name: 'Eggs on Toast',
      calories: 360,
      protein: 22,
      carbs: 28,
      fat: 18,
    };
  }

  // General balanced meal estimate
  const words = query.split(' ').slice(0, 4).join(' ');
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  return {
    name: title,
    calories: 450,
    protein: 30,
    carbs: 45,
    fat: 15,
  };
}

// API endpoint for Gemini Smart Meal Logging
app.post('/api/gemini/estimate-meal', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'A natural language query is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json(estimateNutritionalFallback(query));
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Estimate the macros and calories for this meal: "${query}"`,
      config: {
        systemInstruction: `You are an expert sports nutritionist and clinical dietitian.
Analyze the user's natural language meal description. Return ONLY a valid JSON object estimating the dietary measures.
Do not output markdown code blocks or surrounding text, only the JSON object.
Use standard single serving portions if unspecified.
Schema:
{
  "name": string (concise clean meal title, under 6 words),
  "calories": number (rounded kcal),
  "protein": number (grams of protein),
  "carbs": number (grams of carbohydrates),
  "fat": number (grams of fat)
}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Concise food/meal title',
            },
            calories: {
              type: Type.NUMBER,
              description: 'Total estimated calories in kcal',
            },
            protein: {
              type: Type.NUMBER,
              description: 'Protein in grams',
            },
            carbs: {
              type: Type.NUMBER,
              description: 'Carbohydrates in grams',
            },
            fat: {
              type: Type.NUMBER,
              description: 'Fats in grams',
            },
          },
          required: ['name', 'calories', 'protein', 'carbs', 'fat'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.json(estimateNutritionalFallback(query));
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    console.error('Error invoking Gemini for food analysis:', error);
    return res.json(estimateNutritionalFallback(query));
  }
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${port}`);
  });
}

startServer();
