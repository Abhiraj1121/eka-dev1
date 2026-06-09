<div align="center">

```
███████╗██╗  ██╗ █████╗
██╔════╝██║ ██╔╝██╔══██╗
█████╗  █████╔╝ ███████║
██╔══╝  ██╔═██╗ ██╔══██║
███████╗██║  ██╗██║  ██║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

### ✦ Intelligent AI Chat Assistant ✦

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-6c63ff?style=for-the-badge)](https://abhiraj1121.github.io/ai/)
[![GitHub](https://img.shields.io/badge/GitHub-eka--dev1-181717?style=for-the-badge&logo=github)](https://github.com/Abhiraj1121/eka-dev1)
[![License](https://img.shields.io/badge/Legal_Docs-Read_Here-ff6b6b?style=for-the-badge)](https://abhiraj1121.github.io/ai-tc/)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render)](https://render.com)

*Conversational AI with voice, markdown, web search — beautifully packaged.*

</div>

---

## ⚡ What is Eka?

**Eka** is a modern, full-stack AI chat assistant built for real conversations. It combines a powerful Flask backend with a sleek, animated frontend to deliver fast, intelligent responses — with support for voice I/O, Wikipedia-powered search, and rich Markdown rendering.

Whether you're building a personal assistant, a knowledge bot, or just exploring AI interfaces, Eka gives you a solid, extensible foundation.

---

## 🚀 Features

### 🧠 AI Core
- Cloud-based text generation via any OpenAI / OpenRouter-compatible API
- Smart fallback logic for resilient, reliable responses
- Clean and concise replies by default

### 🌐 Web Search
- Toggle-based Wikipedia lookup (off by default)
- Auto-fallback to AI when no wiki result is found
- Fast, safe, non-intrusive

### 📝 Markdown Rendering
- Full support for headings, bullets, bold/italic, code blocks
- Clean reading experience for long-form answers

### 🎤 Voice Interaction
- 🎙️ Voice input via Web Speech API
- 🔊 Voice output via SpeechSynthesis API
- Auto language detection (English / Hindi)

### 💬 Chat UX
- Smooth typing animation & auto-scroll
- Chat bubbles with timestamps
- Quick-reply action buttons
- Fully responsive (desktop + mobile)

### 🎨 UI Controls
- Dark / Light theme toggle
- Mute / Unmute voice output
- Web search toggle with glow animation
- Clear chat history (with optional voice confirmation)

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) Flask · Flask-CORS · Requests · python-dotenv |
| **Frontend** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) Vanilla JS · Web Speech API · SpeechSynthesis |
| **AI Layer** | ![OpenAI](https://img.shields.io/badge/OpenAI_Compatible-412991?style=flat&logo=openai&logoColor=white) Any OpenAI / OpenRouter provider · Wikipedia REST API |
| **Deployment** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white) Render (cloud hosting) |

---

## 📁 Project Structure

```
eka/
├── app.py                  # Flask backend — AI + Wiki logic
├── templates/
│   └── index.html          # Chat UI (HTML5)
├── static/
│   ├── style.css           # Styling & animations (CSS3)
│   ├── script.js           # Chat logic, voice, toggles (JS)
│   └── eka.png             # Logo
├── .env                    # API keys & config
└── README.md
```

---

## ⚙️ Setup

### 1. Install Dependencies

```bash
pip install flask requests flask-cors python-dotenv
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
AI_API_URL="https://api.openai.com/v1/chat/completions"
AI_API_KEY="your-api-key-here"
```

> Works with OpenAI, OpenRouter, or any compatible provider.

### 3. Run Locally

```bash
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

### 4. Deploy on Render

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python app.py`
6. Add your environment variables in the Render dashboard
7. Deploy 🎉

---

## 🧪 Try It Out

```
"What is Artificial Intelligence?"
"Explain black holes in simple words"
"Write a Python function for Fibonacci"
"Latest news on space exploration"  ← with 🌐 Web Search ON
```

---

## 📌 Notes

- Best experience on **Google Chrome** (voice features)
- Web search only activates when toggled ON
- No conversation history is stored server-side
- AI responses are used when Wikipedia is disabled or unavailable

---

## 👤 Author

<div align="center">

**Abhi**
Developer & Designer

[![GitHub](https://img.shields.io/badge/GitHub-Abhiraj1121-181717?style=for-the-badge&logo=github)](https://github.com/Abhiraj1121)

*Built with curiosity. Deployed with confidence.*

</div>

---

<div align="center">
<sub>© Eka — Legal Docs: <a href="https://abhiraj1121.github.io/ai-tc/">abhiraj1121.github.io/ai-tc</a></sub>
</div>
