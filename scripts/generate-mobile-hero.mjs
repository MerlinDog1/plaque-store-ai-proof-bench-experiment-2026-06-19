import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";

const envPath = ".env.local";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const desktopPath = "public/site-images/plaque-hero-memorial-wall-desktop.jpg";
const mobilePath = "public/site-images/plaque-hero-memorial-wall-mobile.png";
const source = fs.readFileSync(desktopPath).toString("base64");
const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: {
    parts: [
      {
        text: [
          "Create a portrait 9:16 mobile website hero image from the attached plaque photograph.",
          "Keep the same real wall, walnut backing board, aged brass plaque, corner caps, border, and dignified memorial mood.",
          "Compose it for a phone screen: plaque in the upper half to upper two-thirds, full plaque visible, no cropping.",
          "Do not add extra text, new words, stars, decorative symbols, logos, or watermarks.",
          "Extend the wall naturally below the plaque so website headline and buttons can sit underneath the image outside the picture.",
          "Photorealistic, warm natural light, premium memorial plaque product photography.",
        ].join(" "),
      },
      { inlineData: { mimeType: "image/jpeg", data: source } },
    ],
  },
  config: {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: { aspectRatio: "9:16", imageSize: "2K" },
  },
});

const parts = response.candidates?.[0]?.content?.parts || [];
const image = parts.find((part) => part.inlineData?.data);
if (!image) {
  console.error(JSON.stringify(parts, null, 2));
  throw new Error("No image returned");
}

fs.writeFileSync(mobilePath, Buffer.from(image.inlineData.data, "base64"));
console.log(`Wrote ${mobilePath}`);
