# **Newsify: News Summarization and Multilingual Audio Platform**

## **Overview**
**Newsify** is a web application that fetches the latest news articles, summarizes them using AI, translates the summaries into multiple languages, and generates audio files for each translation. The platform provides a user-friendly interface where users can browse news categories, listen to audio summaries, and read transcripts—all in their preferred language.

Inspired by platforms like **Apple Music** and **Netflix**, Newsify organizes audio files by **category** and **language**, making it easy for users to explore and consume news content in a personalized way.

---

## **Key Features**
1. **News Fetching**:
   - Fetches the latest news articles from the **NewsAPI** based on predefined categories (e.g., business, healthcare, trade-commerce).

2. **AI Summarization**:
   - Uses **OpenAI's GPT-4 Turbo** to generate concise summaries of news articles.

3. **Multilingual Translation**:
   - Translates summaries into multiple languages (e.g., Hindi, Kannada, Tamil, Telugu) using OpenAI's GPT-4 Turbo.

4. **Audio Generation**:
   - Converts translated summaries into audio files using **OpenAI's Text-to-Speech (TTS)** API.

5. **User Interface**:
   - A **Netflix/Apple Music-like interface** where users can:
     - Browse news categories.
     - Select a language.
     - Play audio files.
     - View transcripts (summaries) alongside the audio player.

6. **Responsive Design**:
   - The frontend is designed to work seamlessly on both desktop and mobile devices.

---

## **Technical Stack**
- **Frontend**:
  - HTML, CSS, JavaScript.
  - Responsive design for cross-device compatibility.

- **Backend**:
  - **Node.js** with **Express.js** for server-side logic.
  - **Axios** for making HTTP requests to external APIs.
  - **OpenAI API** for summarization, translation, and text-to-speech.

- **APIs Used**:
  - **NewsAPI**: Fetches news articles.
  - **OpenAI API**: Handles summarization, translation, and audio generation.

- **File Storage**:
  - Local storage for:
    - News data (`data/` folder).
    - Audio files (`audio/` folder).

- **Environment Management**:
  - **dotenv** for managing environment variables (e.g., API keys).

---

## **How It Works**
1. **Fetch News**:
   - The backend fetches news articles from **NewsAPI** and stores them in JSON files.

2. **Summarize News**:
   - The backend uses **OpenAI GPT-4 Turbo** to generate summaries of the news articles.

3. **Translate Summaries**:
   - Summaries are translated into multiple languages using **OpenAI GPT-4 Turbo**.

4. **Generate Audio**:
   - Translated summaries are converted into audio files using **OpenAI's TTS API**.

5. **Serve Audio Files**:
   - The frontend displays categorized audio files, allowing users to play them and view the corresponding transcripts.

---

## **File Structure**
```
newsify/
├── frontend/          # Frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── scripts/       # Optional: For additional JS files
├── backend/           # Backend files (Node.js, Express)
│   ├── server.js
│   ├── routes/        # Optional: For API routes
│   └── controllers/   # Optional: For business logic
├── audio/             # Audio files
├── data/              # JSON and text files
├── node_modules/      # Node.js dependencies
├── .env               # Environment variables
├── .gitignore         # Git ignore file
├── package-lock.json  # Dependency lock file
└── package.json       # Project metadata and dependencies
```

---

## **Setup Instructions**
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd newsify
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory and add your API keys:
     ```
     OPENAI_API_KEY=your_openai_api_key
     NEWS_API_KEY=your_newsapi_key
     ```

4. **Run the Server**:
   ```bash
   node server.js
   ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:5000`.

---

## **Future Enhancements**
1. **User Authentication**:
   - Allow users to create accounts and save their preferences.

2. **Advanced Search**:
   - Add search functionality to find specific news articles or categories.

3. **Download Audio**:
   - Allow users to download audio files for offline listening.

4. **More Languages**:
   - Support additional languages for translation and audio generation.

5. **Deployment**:
   - Deploy the application on platforms like **Heroku**, **Vercel**, or **AWS**.

---

## **Why Newsify?**
- **Personalized News Consumption**: Users can listen to news summaries in their preferred language.
- **Accessibility**: Audio files make news accessible to visually impaired users.
- **Efficiency**: Summarized news saves time for busy individuals.

---

## **Screenshots**
1. **Homepage**:
   - Displays categories and languages.
2. **Audio Player**:
   - Plays audio files with transcripts.
3. **Grid Layout**:
   - Shows audio files organized by category and language.

---

## **Contributors**
- [Saqlain Ahmed P]

---

## **License**
This project is licensed under the **MIT License**. See the `LICENSE` file for details.

---

This description provides a comprehensive overview of your project, making it easy for users, developers, and stakeholders to understand its purpose and functionality. You can adapt it further based on your specific needs!
