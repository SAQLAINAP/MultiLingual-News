import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini client
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = gemini.getGenerativeModel({ model: "gemini-pro" });

// Initialize Google Cloud TTS client
const ttsClient = new TextToSpeechClient();

// Ensure the "audio" directory exists
if (!fs.existsSync("./audio")) {
  fs.mkdirSync("./audio");
}

// 📰 Fetch News Articles
app.get("/fetch-news", async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

    const response = await axios.get(url);

    let articles = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description || "No description available",
      url: article.url,
    }));

    fs.writeFileSync("news.json", JSON.stringify(articles, null, 2));
    res.json({ success: true, message: "News fetched and stored!" });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// 📜 Summarize News Articles (with OpenAI or Gemini fallback)
app.get("/summarize-news", async (req, res) => {
  try {
    let newsData = JSON.parse(fs.readFileSync("news.json"));

    for (let article of newsData) {
      console.log(`Processing article: ${article.title}`);
      console.log(`Description: ${article.description}`);

      // Skip if no description
      if (!article.description || article.description.trim() === "") {
        console.warn(`Skipping article "${article.title}" - no description found.`);
        article.summary = "No description available.";
        continue;
      }

      let summary;

      // Try OpenAI first
      try {
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: "Summarize this article in 2 sentences:" },
            { role: "user", content: article.description },
          ],
          temperature: 0.7,
        });
        summary = gptResponse.choices[0].message.content;
        console.log(`OpenAI Summary: ${summary}`);
      } catch (openaiError) {
        console.warn("OpenAI failed, falling back to Gemini...");

        // Fallback to Gemini
        try {
          const geminiResponse = await geminiModel.generateContent(
            `Summarize this article in 2 sentences: ${article.description}`
          );
          summary = geminiResponse.response.text();
          console.log(`Gemini Summary: ${summary}`);
        } catch (geminiError) {
          console.error("Gemini failed:", geminiError.message);
          summary = "No summary available.";
        }
      }

      // Validate summary
      if (!summary || summary.trim() === "") {
        console.warn(`Skipping article "${article.title}" - no valid summary generated.`);
        summary = "No summary available.";
      }

      article.summary = summary;
    }

    fs.writeFileSync("news.json", JSON.stringify(newsData, null, 2));
    res.json({ success: true, message: "News summarized!" });
  } catch (error) {
    console.error("Error summarizing news:", error.message);
    res.status(500).json({ error: "Summarization failed" });
  }
});

// 🎙 Convert Summary to Speech (with OpenAI or Google Cloud TTS fallback)
app.get("/generate-audio", async (req, res) => {
  try {
    let newsData = JSON.parse(fs.readFileSync("news.json"));

    for (let article of newsData) {
      // Skip if no valid summary
      if (!article.summary || article.summary === "No summary available.") {
        console.warn(`Skipping article "${article.title}" - no valid summary found.`);
        continue;
      }

      let audioBuffer;

      // Try OpenAI TTS first
      try {
        const ttsResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: article.summary,
        });
        audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      } catch (openaiError) {
        console.warn("OpenAI TTS failed, falling back to Google Cloud TTS...");

        // Fallback to Google Cloud TTS
        const [response] = await ttsClient.synthesizeSpeech({
          input: { text: article.summary },
          voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
          audioConfig: { audioEncoding: "MP3" },
        });

        audioBuffer = response.audioContent;
      }

      // Save audio file
      const filePath = `./audio/${article.title.replace(/\s/g, "_")}.mp3`;
      fs.writeFileSync(filePath, audioBuffer);

      // Update article with audio URL
      article.audioUrl = `/audio/${article.title.replace(/\s/g, "_")}.mp3`;
    }

    fs.writeFileSync("news.json", JSON.stringify(newsData, null, 2));
    res.json({ success: true, message: "Audio generated!" });
  } catch (error) {
    console.error("Error generating audio:", error.message);
    res.status(500).json({ error: "TTS failed" });
  }
});

// Serve Audio Files
app.use("/audio", express.static("audio"));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// const express = require("express");
// const fs = require("fs");
// const axios = require("axios");
// const cors = require("cors"); // Make sure this line is present
// const OpenAI = require("openai");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.static("public"));
// const port = 5000;

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const categories = ["business", "healthcare", "trade-commerce"];
// const languages = [
//   { code: "hi", name: "Hindi" },
//   {code: "en", name: "English"},
//   { code: "kn", name: "Kannada" },
//   { code: "ta", name: "Tamil" },
//   { code: "te", name: "Telugu" },
// ];

// // 📰 Fetch News Articles
// app.get("/fetch-news", async (req, res) => {
//   try {
//     for (const category of categories) {
//       const url = `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${process.env.NEWS_API_KEY}`;
//       const response = await axios.get(url);
//       const newsData = response.data.articles.map((article) => ({
//         title: article.title,
//         description: article.description,
//         url: article.url,
//       }));

//       fs.writeFileSync(`./data/news_${category}.json`, JSON.stringify(newsData, null, 2));
//     }

//     res.json({ success: true, message: "News fetched for all categories!" });
//   } catch (error) {
//     console.error("Error fetching news:", error.message);
//     res.status(500).json({ error: "Failed to fetch news" });
//   }
// });

// // 📖 Summarize News Articles
// app.get("/summarize-news", async (req, res) => {
//   try {
//     for (const category of categories) {
//       const filePath = `./data/news_${category}.json`;
//       const news = JSON.parse(fs.readFileSync(filePath, "utf-8"));

//       const combinedText = news.map((article) => article.description).join(" ");
//       const summaryResponse = await openai.chat.completions.create({
//         model: "gpt-4-turbo",
//         messages: [{ role: "user", content: `Summarize this news: ${combinedText}` }],
//       });

//       const summary = summaryResponse.choices[0].message.content;
//       fs.writeFileSync(`./data/summary_${category}.txt`, summary);
//     }

//     res.json({ success: true, message: "News summarized for all categories!" });
//   } catch (error) {
//     console.error("Error summarizing news:", error.message);
//     res.status(500).json({ error: "Summarization failed" });
//   }
// });

// // 🌍 Translate Summaries
// app.get("/translate-summaries", async (req, res) => {
//   try {
//     for (const category of categories) {
//       const summaryPath = `./data/summary_${category}.txt`;
//       const summary = fs.readFileSync(summaryPath, "utf-8");

//       for (const language of languages) {
//         const translationResponse = await openai.chat.completions.create({
//           model: "gpt-4-turbo",
//           messages: [{ role: "user", content: `Translate to ${language.name}: ${summary}` }],
//         });

//         const translatedText = translationResponse.choices[0].message.content;
//         fs.writeFileSync(`./data/summary_${category}_${language.code}.txt`, translatedText);
//       }
//     }

//     res.json({ success: true, message: "Summaries translated into multiple languages!" });
//   } catch (error) {
//     console.error("Error translating summaries:", error.message);
//     res.status(500).json({ error: "Translation failed" });
//   }
// });

// // 🎙 Generate Audio Files for Each Translated Summary using OpenAI TTS
// app.get("/generate-audio", async (req, res) => {
//   try {
//     for (const category of categories) {
//       for (const language of languages) {
//         try {
//           const filePath = `./data/summary_${category}_${language.code}.txt`;
//           if (!fs.existsSync(filePath)) continue;

//           const summary = fs.readFileSync(filePath, "utf-8");
//           const audioFilePath = `./audio/audio_${category}_${language.code}.mp3`;

//           const response = await openai.audio.speech.create({
//             model: "tts-1", // Use "tts-1" or "tts-1-hd" for higher quality
//             voice: "alloy",
//             input: summary,
//           });

//           const audioBuffer = Buffer.from(await response.arrayBuffer());
//           fs.writeFileSync(audioFilePath, audioBuffer);
//           console.log(`Generated audio for ${category} in ${language.name}.`);
//         } catch (error) {
//           console.error(`Failed to generate audio for ${category} in ${language.name}:`, error.message);
//         }
//       }
//     }

//     res.json({ success: true, message: "Audio files generated!" });
//   } catch (error) {
//     console.error("Error generating audio:", error.message);
//     res.status(500).json({ error: "Audio generation failed" });
//   }
// });

// // 🎵 Serve Audio Files
// app.use("/audio", express.static("audio"));


// // Endpoint to get available categories and their translations
// app.get("/categories", (req, res) => {
//   const categories = ["business", "healthcare", "trade-commerce"];
//   const languages = ["en", "hi", "kn", "ta", "te"];

//   // Map categories to their respective audio files in different languages
//   const availableFiles = categories.map((category) => ({
//     category,
//     audios: languages.map((lang) => ({
//       language: lang,
//       url: `/audio/audio_${category}_${lang}.mp3`,
//     })),
//   }));

//   res.json(availableFiles);
// });


// // Start the Server
// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });