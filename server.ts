import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a high limit to handle large screenshot base64 payloads
  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client setup
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const SYSTEM_INSTRUCTION = `You are 'Second Opinion,' a scam and misinformation detection assistant for Bangladeshi university students. You analyze messages, screenshots, and offers for signs of scams, phishing, or misinformation — common in student WhatsApp/Facebook groups (fake scholarships, fake job offers, phishing links, fake urgent notices, impersonated official announcements).

RULES:
1. Analyze the actual content given — cite specific phrases/elements that triggered concern (urgency language, fee requests, suspicious links/domains, grammar inconsistent with official sources, unofficial contact methods).
2. Never accuse with certainty — use probability framing ('this pattern is commonly seen in scams' not 'this IS a scam').
3. If the content is in Bangla or mixed Bangla-English, analyze it as-is; respond in the same mixed style if relevant.
4. Always include practical next steps, not just a verdict.
5. Output ONLY valid JSON, no markdown, no preamble.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      trustScore: {
        type: Type.INTEGER,
        description: "A number from 0 to 100 representing how trustworthy the message/screenshot is."
      },
      verdict: {
        type: Type.STRING,
        description: "The verdict rating based on the content analysis. Must be one of: 'Likely Safe', 'Suspicious', 'Likely Scam'."
      },
      redFlags: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: "List of specific red flags or concern areas spotted in the content."
      },
      explanation: {
        type: Type.STRING,
        description: "A plain language explanation of the analysis, in English, Bangla, or mixed Bangla-English, maximum 40 words."
      },
      recommendedAction: {
        type: Type.STRING,
        description: "A practical next step recommendation, maximum 25 words."
      }
    },
    required: ["trustScore", "verdict", "redFlags", "explanation", "recommendedAction"]
  };

  // API Route for checking scam content
  app.post("/api/check", async (req, res) => {
    try {
      const { text, image, imageMimeType } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: "Gemini API key is not configured in the environment. Please add GEMINI_API_KEY to your Secrets panel."
        });
      }

      let contents: any;

      if (image && imageMimeType) {
        const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: imageMimeType,
                data: base64Data
              }
            },
            {
              text: "Analyze this screenshot for scam/misinformation signs."
            }
          ]
        };
      } else if (text && text.trim() !== "") {
        contents = `Analyze this content for scam/misinformation signs:\n\n${text}`;
      } else {
        return res.status(400).json({ error: "Please provide text content or a screenshot image to analyze." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text received from Gemini.");
      }

      const analysisResult = JSON.parse(responseText.trim());
      return res.json(analysisResult);

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({
        error: error.message || "Failed to analyze content using Gemini. Please try again."
      });
    }
  });

  // Vite dev server or static file serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
