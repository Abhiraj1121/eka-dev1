```markdown
# 🤖 Eka – Intelligent AI Chat Assistant

**Eka** is a modern, lightweight, and fully functional AI-powered web chatbot. It delivers natural, intelligent conversations with support for both text and voice interactions. Built with a clean, responsive interface, Eka combines local AI capabilities with optional web search, markdown rendering, and seamless voice features — all powered by a simple Flask backend.

Designed for performance, flexibility, and ease of deployment, Eka is perfect for personal assistants, knowledge tools, demos, prototypes, or production AI interfaces.

---

## 🚀 Features

### 🧠 AI Intelligence
- Powered by any OpenAI-compatible API (OpenAI, OpenRouter, Groq, etc.)
- Smart fallback and error handling for reliable conversations
- Clean, concise, and context-aware responses

### 🌐 Web Search (Optional)
- Toggleable Wikipedia-powered search
- Fetches accurate, factual information when enabled
- Graceful fallback to AI responses when no results are found

### 📝 Markdown Rendering
- Full Markdown support in AI and Wikipedia responses
- Beautiful rendering of headings, lists, code blocks, bold/italic text, and more

### 🎤 Voice Interaction
- **Voice Input**: Web Speech API (speech-to-text)
- **Voice Output**: Speech Synthesis API (text-to-speech)
- Automatic language detection (English/Hindi support)
- Hands-free experience with microphone controls

### 💬 Modern Chat Experience
- Smooth typing indicators and message animations
- Timestamps and chat bubbles
- Quick-reply suggestions
- Auto-scroll and responsive design (desktop + mobile)

### 🧹 Chat Controls
- Clear chat history with one click
- Dark/Light theme toggle
- Mute/unmute voice output
- Web search toggle with visual feedback

---

## 🛠️ Tech Stack

### Backend
- **Python 3.8+**
- **Flask**
- **Flask-CORS**
- **Requests**
- **python-dotenv**

### Frontend
- **HTML5 + CSS3**
- **Vanilla JavaScript**
- Web Speech API
- SpeechSynthesis API

### AI & Data
- OpenAI-compatible Chat Completions API
- Wikipedia REST API

---

## 📁 Project Structure

```
ai/
├── app.py                  # Flask backend (AI + Wiki logic)
├── templates/
│   └── index.html          # Main chat interface
├── static/
│   ├── style.css           # UI styling & animations
│   ├── script.js           # Chat, voice & toggle logic
│   └── Eka.png             # Logo (or your preferred image)
├── .env                    # API keys and configuration
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Abhiraj1121/ai.git
cd ai
```

### 2️⃣ Install Dependencies

```bash
pip install flask requests flask-cors python-dotenv
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
AI_API_URL="https://api.openai.com/v1/chat/completions"
AI_API_KEY="your-api-key-here"
```

> Works with **OpenAI**, **OpenRouter**, **Groq**, and other compatible providers.

### 4️⃣ Run the Application

```bash
python app.py
```

### 5️⃣ Open in Browser

Visit: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🧪 Try It Out

- "What is artificial intelligence?"
- "Explain quantum computing simply"
- "Write a Python function to check if a number is prime"
- Enable 🌐 Web Search and ask: "Who is the current President of India?"

---

## 📌 Notes

- Best voice experience on **Google Chrome**
- Web search is **disabled by default** for faster responses
- No conversation history is stored on the server
- Fully client-side voice processing (privacy-friendly)

---

## 👤 Author

**Abhi**  
Developer & Designer  
[GitHub](https://github.com/Abhiraj1121) | [Live Demo](https://abhiraj1121.github.io/ai/)

---

**Legal & Terms**: [View Documents](https://abhiraj1121.github.io/ai-tc/)
```


You can copy this directly into your `README.md` file. Let me know if you want any further adjustments (e.g., adding screenshots, badges, or deployment instructions).
