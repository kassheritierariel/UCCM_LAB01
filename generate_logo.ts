import { GoogleGenAI } from "@google/genai";

async function generateLogo() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: 'Un logo professionnel, moderne et minimaliste pour une institution éducative nommée "UCCM". Style vectoriel, design plat, palette de couleurs basée sur le bleu (#4f46e5) et l\'émeraude. Fond blanc, sans aucun texte, avec un symbole iconique représentant l\'excellence académique et la technologie.',
        },
      ],
    },
    config: {
      imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      console.log("IMAGE_DATA:" + base64EncodeString);
    }
  }
}

generateLogo();
