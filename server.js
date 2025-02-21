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

// Serve static files from the "public" directory
app.use(express.static("public"));

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

// Helper function to fetch news from NewsAPI
async function fetchNewsFromNewsAPI(keyword, category) {
    const apiKey = process.env.NEWS_API_KEY;
    const url = `https://newsapi.org/v2/top-headlines?country=us&q=${keyword}&category=${category}&apiKey=${apiKey}`;
    const response = await axios.get(url);
    return response.data.articles.map((article) => ({
        title: article.title,
        description: article.description || "No description available",
        url: article.url,
    }));
}

// Helper function to fetch news from The Guardian API
async function fetchNewsFromGuardian(keyword) {
    const apiKey = process.env.GUARDIAN_API_KEY;
    const url = `https://content.guardianapis.com/search?q=${keyword}&api-key=${apiKey}&show-fields=headline,trailText,shortUrl`;
    const response = await axios.get(url);
    return response.data.response.results.map((article) => ({
        title: article.fields.headline,
        description: article.fields.trailText || "No description available",
        url: article.fields.shortUrl,
    }));
}

// 📰 Fetch News Articles
app.get("/fetch-news", async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const category = req.query.category || '';

        let articles = [];

        // Try NewsAPI first
        try {
            articles = await fetchNewsFromNewsAPI(keyword, category);
            if (articles.length === 0) {
                throw new Error("No results from NewsAPI");
            }
        } catch (newsAPIError) {
            console.warn("NewsAPI failed, falling back to The Guardian API...");
            // Fallback to The Guardian API
            articles = await fetchNewsFromGuardian(keyword);
        }

        fs.writeFileSync("news.json", JSON.stringify(articles, null, 2));
        res.json({ success: true, message: "News fetched and stored!", articles });
    } catch (error) {
        console.error("Error fetching news:", error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

// 📜 Summarize News Articles
app.get("/summarize-news", async (req, res) => {
    try {
        let newsData = JSON.parse(fs.readFileSync("news.json"));
        let summaries = [];

        for (let article of newsData) {
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
            } catch (openaiError) {
                // Fallback to Gemini
                try {
                    const geminiResponse = await geminiModel.generateContent(
                        `Summarize this article in 2 sentences: ${article.description}`
                    );
                    summary = geminiResponse.response.text();
                } catch (geminiError) {
                    summary = "No summary available.";
                }
            }

            summaries.push(summary);
        }

        res.json({ success: true, message: "News summarized!", summaries });
    } catch (error) {
        console.error("Error summarizing news:", error.message);
        res.status(500).json({ error: "Summarization failed" });
    }
});

// 🎙 Convert Summary to Speech
app.get("/generate-audio", async (req, res) => {
  try {
      let newsData = JSON.parse(fs.readFileSync("news.json"));

      // Generate summaries if they don't exist
      for (let article of newsData) {
          if (!article.summary) {
              // Generate a summary for the article
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
              } catch (openaiError) {
                  // Fallback to Gemini
                  try {
                      const geminiResponse = await geminiModel.generateContent(
                          `Summarize this article in 2 sentences: ${article.description}`
                      );
                      summary = geminiResponse.response.text();
                  } catch (geminiError) {
                      summary = "No summary available.";
                  }
              }

              // Add the summary to the article
              article.summary = summary;
          }
      }

      // Combine all summaries into a single string with pauses
      const combinedSummaries = newsData
          .map((article) => article.summary)
          .filter((summary) => summary !== "No summary available.")
          .join(". ... Pause ... "); // Add a pause between summaries

      // Save combined summaries to summaries.json
      fs.writeFileSync("summaries.json", JSON.stringify({ summaries: combinedSummaries }, null, 2));

      let audioBuffer;

      // Try OpenAI TTS first
      try {
          const ttsResponse = await openai.audio.speech.create({
              model: "tts-1",
              voice: "alloy",
              input: combinedSummaries,
          });
          audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      } catch (openaiError) {
          console.warn("OpenAI TTS failed, falling back to Google Cloud TTS...");

          // Fallback to Google Cloud TTS
          const [response] = await ttsClient.synthesizeSpeech({
              input: { text: combinedSummaries },
              voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
              audioConfig: { audioEncoding: "MP3" },
          });

          audioBuffer = response.audioContent;
      }

      // Save the combined audio file
      const filePath = `./audio/combined_summaries.mp3`;
      fs.writeFileSync(filePath, audioBuffer);

      // Respond with the audio URL
      res.json({ success: true, message: "Audio generated!", audioUrl: `/audio/combined_summaries.mp3` });
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