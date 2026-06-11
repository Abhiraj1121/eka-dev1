"""
EKA AI — app.py  v3
Real-time web: DuckDuckGo (free, no key) + Wikipedia
Models: Llama 4 Maverick → Scout → Qwen3 → Mistral (all free via OpenRouter)
"""

import os, re, time, logging, requests
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("eka")

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

AI_API_URL = os.getenv("AI_API_URL", "https://openrouter.ai/api/v1/chat/completions")
AI_API_KEY = os.getenv("AI_API_KEY", "")
BOT_NAME   = os.getenv("BOT_NAME", "EKA")
DEV_NAME   = os.getenv("DEV_NAME", "Abhi Raj Singh and Binod Soren")

# ── Model waterfall (all free tier) ──
MODELS = [
    {"id": "google/gemma-4-31b-it:free",       "max_tokens": 900,  "temp": 0.65},
    {"id": "meta-llama/llama-3.3-70b-instruct:free",           "max_tokens": 900,  "temp": 0.65},
    {"id": "nvidia/nemotron-3.5-content-safety:free",               "max_tokens": 800,  "temp": 0.60},
    {"id": "poolside/laguna-xs.2:free",      "max_tokens": 700,  "temp": 0.60},
    {"id": "google/gemma-3-27b-it:free",              "max_tokens": 700,  "temp": 0.65},
]

# ── System prompts ──
SYS_BASE = f"""You are {BOT_NAME}, a smart helpful AI built by {DEV_NAME} in India 🇮🇳.
Be direct — lead with the answer. No filler phrases like "Great question!".
Use markdown: **bold** for key terms, code blocks for code, bullet lists for steps.
Match the user's language (Hindi if they write Hindi, Hinglish if mixed).
Today: {datetime.now().strftime("%d %B %Y")}."""

SYS_WEB = f"""You are {BOT_NAME}, a smart helpful AI built by {DEV_NAME} in India 🇮🇳.
Web search results are provided below. Use them to give an accurate answer.
Synthesise naturally — don't just copy. Add context from your knowledge where helpful.
End with: *Source: [source name]*
Today: {datetime.now().strftime("%d %B %Y")}.

WEB RESULTS:
{{web_content}}"""


# ══════════════════════════════════════
# WEB SEARCH — DuckDuckGo (free, no key)
# Uses the DDG Instant Answer API
# ══════════════════════════════════════
def ddg_search(query: str) -> tuple[str | None, str]:
    """DuckDuckGo Instant Answer API — completely free, no key needed."""
    try:
        r = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            headers={"User-Agent": f"{BOT_NAME}AI/3.0"},
            timeout=6,
        )
        d = r.json()
        # Try best answer first, then abstract, then definition
        for key in ("Answer", "AbstractText", "Definition"):
            val = d.get(key, "").strip()
            if val and len(val) > 40:
                src = d.get("AbstractSource") or d.get("DefinitionSource") or "DuckDuckGo"
                return val[:1200], src
        # RelatedTopics fallback
        topics = d.get("RelatedTopics", [])
        snippets = []
        for t in topics[:4]:
            if isinstance(t, dict) and t.get("Text"):
                snippets.append(t["Text"])
        if snippets:
            return "\n".join(snippets)[:1200], "DuckDuckGo"
    except Exception as e:
        log.warning(f"DDG error: {e}")
    return None, ""


def wikipedia_search(query: str) -> tuple[str | None, str]:
    """Wikipedia full-extract API."""
    try:
        # Step 1: search
        sr = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search", "srsearch": query,
                    "format": "json", "srlimit": 2, "utf8": 1},
            headers={"User-Agent": f"{BOT_NAME}AI/3.0"}, timeout=7,
        ).json()
        results = sr.get("query", {}).get("search", [])
        if not results:
            return None, ""
        title = results[0]["title"]

        # Step 2: extract
        er = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "titles": title, "prop": "extracts",
                    "exintro": True, "explaintext": True, "format": "json"},
            headers={"User-Agent": f"{BOT_NAME}AI/3.0"}, timeout=7,
        ).json()
        pages = er.get("query", {}).get("pages", {})
        extract = next(iter(pages.values()), {}).get("extract", "").strip()
        if extract:
            return extract[:1400] + f"\n— Wikipedia: {title}", "Wikipedia"
    except Exception as e:
        log.warning(f"Wikipedia error: {e}")
    return None, ""


def web_search(query: str) -> tuple[str | None, str]:
    """Try DDG first (faster), then Wikipedia."""
    content, src = ddg_search(query)
    if content:
        return content, src
    return wikipedia_search(query)


# ══════════════════════════════════════
# RESPONSE CLEANING
# ══════════════════════════════════════
def clean(text: str) -> str:
    if not text:
        return ""
    # Strip internal <think> blocks some models emit
    text = re.sub(r"<think(?:ing)?>.*?</think(?:ing)?>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # Strip self-labelling prefix
    text = re.sub(r"^(EKA\s*:\s*|Eka\s*:\s*|Assistant\s*:\s*)", "", text, flags=re.IGNORECASE)
    # Remove stray XML tags
    text = re.sub(r"</?[a-zA-Z_][^>]{0,50}>", "", text)
    # Collapse 3+ blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ══════════════════════════════════════
# AI CORE
# ══════════════════════════════════════
def ai_query(user_input: str, history: list = None, system: str = None) -> str:
    if not AI_API_KEY:
        return "AI backend not configured. Please set AI_API_KEY in your .env file."

    messages = [{"role": "system", "content": system or SYS_BASE}]

    if history:
        for m in history[-16:]:
            if m.get("role") in ("user", "assistant") and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})

    messages.append({"role": "user", "content": user_input})

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://eka-dev1.onrender.com",
        "X-Title": f"{BOT_NAME} AI",
    }

    for model in MODELS:
        try:
            t0   = time.time()
            body = {"model": model["id"], "messages": messages,
                    "max_tokens": model["max_tokens"], "temperature": model["temp"]}
            resp = requests.post(AI_API_URL, headers=headers, json=body, timeout=35)
            log.info(f"  {model['id']} → {resp.status_code} ({round(time.time()-t0,2)}s)")

            if resp.status_code == 200:
                data   = resp.json()
                choice = (data.get("choices") or [{}])[0]
                text   = (choice.get("message") or {}).get("content", "").strip()
                if text:
                    return clean(text)
                log.warning(f"  Empty reply from {model['id']}")

            elif resp.status_code == 429:
                log.warning(f"  Rate-limited on {model['id']}, trying next…")
                time.sleep(0.4)

            elif 400 <= resp.status_code < 500:
                log.warning(f"  Client error {resp.status_code}, skipping {model['id']}")

        except requests.exceptions.Timeout:
            log.warning(f"  Timeout on {model['id']}")
        except Exception as e:
            log.error(f"  Error on {model['id']}: {e}")

    return "All AI models are temporarily unavailable. Please try again shortly."


# ══════════════════════════════════════
# QUICK REPLIES (no AI cost)
# ══════════════════════════════════════
def quick_reply(text: str) -> str | None:
    t = text.lower().strip().rstrip("?!.,")
    greetings = {"hi","hello","hey","namaste","namaskar","hola","yo","hii","hai","hyy","good morning","good evening","good night","good afternoon"}
    if t in greetings:
        return f"Hey! 👋 I'm **{BOT_NAME}**, your AI assistant built in India 🇮🇳. What can I help you with?"

    identity = re.search(r"\b(who are you|your name|what are you|introduce yourself|aap kaun|tumhara naam|kaun ho)\b", t)
    if identity:
        return f"I'm **{BOT_NAME}** — an AI assistant built by **{DEV_NAME}** in India 🇮🇳. I can help with questions, code, writing, analysis, and more. Ask away!"

    return None


# ══════════════════════════════════════
# ROUTES
# ══════════════════════════════════════
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    payload  = request.get_json(silent=True) or {}
    user_msg = (payload.get("message") or "").strip()
    history  = payload.get("history", [])
    use_web  = payload.get("wiki", False)

    if not user_msg:
        return jsonify({"reply": "Your message seems empty. What would you like to ask?", "source": "system"})

    log.info(f"→ {user_msg[:80]}")

    # Quick path
    quick = quick_reply(user_msg)
    if quick:
        return jsonify({"reply": quick, "source": "system"})

    # Web search path
    if use_web:
        content, src = web_search(user_msg)
        if content:
            system = SYS_WEB.replace("{web_content}", content)
            reply  = ai_query(user_msg, history=history, system=system)
            log.info(f"← web+ai [{src}]: {reply[:60]}")
            return jsonify({"reply": reply, "source": "web+ai", "web_source": src})

    # Standard AI
    reply = ai_query(user_msg, history=history)
    log.info(f"← ai: {reply[:60]}")
    return jsonify({"reply": reply, "source": "ai"})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "bot": BOT_NAME,
                    "models": [m["id"] for m in MODELS],
                    "time": datetime.now().isoformat()})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    log.info(f"Starting {BOT_NAME} AI on :{port}")
    app.run(debug=os.getenv("DEBUG","true").lower()=="true", host="0.0.0.0", port=port)
