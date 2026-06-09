import os
import json
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

AI_API_URL = os.getenv("AI_API_URL")
AI_API_KEY = os.getenv("AI_API_KEY")

# Load local Q&A
LOCAL_QA_PATH = os.path.join(os.path.dirname(__file__), "data", "school_data.txt")
local_qa = {}
if os.path.exists(LOCAL_QA_PATH):
    with open(LOCAL_QA_PATH, "r", encoding="utf-8") as f:
        content = f.read().strip()
        if content:
            entries = content.split("\n\n")
            for entry in entries:
                lines = [l.strip() for l in entry.splitlines() if l.strip()]
                if len(lines) >= 2:
                    q = lines[0].lower()
                    a = " ".join(lines[1:])
                    local_qa[q] = a

def local_lookup(query):
    if not query:
        return None
    return local_qa.get(query.lower().strip())

# --------------------------
# Wikipedia Web Search
# --------------------------
def fetch_wikipedia_summary(query):
    try:
        # Step 1: search Wikipedia
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "utf8": 1
        }

        search_res = requests.get(
            search_url,
            params=search_params,
            timeout=8,
            headers={"User-Agent": "EKA/1.0"}
        )
        search_data = search_res.json()
        search_results = search_data.get("query", {}).get("search", [])
        if not search_results:
            return None

        page_title = search_results[0]["title"]

        # Step 2: get summary
        summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title}"
        summary_res = requests.get(
            summary_url,
            timeout=8,
            headers={"User-Agent": "EKA/1.0"}
        )
        if summary_res.status_code != 200:
            return None

        summary_data = summary_res.json()
        return summary_data.get("extract")

    except Exception as e:
        print("Wiki error:", e)
        return None

# --------------------------
# AI helper
# --------------------------
def _extract_text_from_choice(choice):
    if not choice or not isinstance(choice, dict):
        return None
    # OpenAI / OpenRouter style
    message = choice.get("message")
    if isinstance(message, dict) and "content" in message:
        return message["content"].strip()
    # Older / fallback format
    text = choice.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip()
    return None

def _call_model(body, headers, timeout=30):
    try:
        resp = requests.post(AI_API_URL, headers=headers, json=body, timeout=timeout)
        try:
            return resp.status_code, resp.json()
        except Exception:
            return resp.status_code, resp.text
    except requests.exceptions.ReadTimeout:
        return None, "timeout"
    except Exception as e:
        return None, str(e)

def ai_query(user_input, history=None, system_note=None):
    if not AI_API_URL or not AI_API_KEY:
        return "EKA: AI backend not configured. Please set AI_API_URL and AI_API_KEY."

    system_note = system_note or (
        'You are EKA, a smart and friendly AI assistant developed by Abhi Raj. Your goal is to help users with their questions in a clear and engaging way.'
        'Make conversations feel smooth and humanic.'
    )

    messages = [{"role": "system", "content": system_note}]
    if history and isinstance(history, list):
        for m in history[-12:]:
            if m.get("role") in ("user", "assistant") and "content" in m:
                messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_input})

    headers = {"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"}

    primary_body = {"model": "meta-llama/llama-3.3-70b-instruct:free", "messages": messages, "max_tokens": 800, "temperature": 0.2}
    fallback_body = {"model": "nvidia/nemotron-3-ultra-550b-a55b:free", "messages": messages, "max_tokens": 600, "temperature": 0.2}

    status, result = _call_model(primary_body, headers)
    if status is None or status >= 400:
        # fallback AI
        status2, result2 = _call_model(fallback_body, headers)
        if status2 == 200:
            choice = result2.get("choices", [{}])[0]
            return _extract_text_from_choice(choice) or "EKA: Backup AI responded unexpectedly."
        if status2 is None and result2 == "timeout":
            return "EKA: AI server timeout. Try again shortly."
        return f"EKA: AI error {status2}: {result2}"

    if status == 200 and isinstance(result, dict):
        choice = result.get("choices", [{}])[0]
        return _extract_text_from_choice(choice) or "EKA: AI responded unexpectedly."

    return "EKA: Unexpected AI error."

# --------------------------
# Routes
# --------------------------
@app.route("/")
def index():
    return render_template("index.html", bot_name="EKA")

@app.route("/api/chat", methods=["POST"])
def chat():
    payload = request.json or {}
    msg = payload.get("message", "").strip()
    history = payload.get("history", [])
    use_web = payload.get("wiki", False)

    if not msg:
        return jsonify({"reply": "EKA: Your message seems empty.", "source": "system"})

    # Check local QA
    local = local_lookup(msg)
    if local:
        return jsonify({"reply": local, "source": "local"})

    # Web info from Wikipedia
    if use_web:
        web_summary = fetch_wikipedia_summary(msg)
        if web_summary:
            system_note = (
                f"You are EKA, an AI assistant. Use the following web information:\n\n"
                f"{web_summary}\n\n"
                "Answer naturally."
            )
            reply = ai_query(msg, history=history, system_note=system_note)
            return jsonify({"reply": reply, "source": "web+ai"})

    # Regular AI fallback
    reply = ai_query(msg, history=history)
    return jsonify({"reply": reply, "source": "ai"})

# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)