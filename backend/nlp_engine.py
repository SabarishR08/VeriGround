import re
import math
from typing import List, Dict, Any, Tuple

# Try loading spacy or fallback to rule-based NLP
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None
except ImportError:
    nlp = None

# Try loading NLTK
try:
    import nltk
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        try:
            nltk.download("punkt", quiet=True)
            nltk.download("punkt_tab", quiet=True)
        except Exception:
            pass
    from nltk.tokenize import sent_tokenize
except ImportError:
    sent_tokenize = None


def clean_text(text: str) -> str:
    """
    Cleans raw input text: removes HTML tags, normalizes whitespace, 
    and handles unwanted control characters.
    """
    if not text:
        return ""
    
    # Remove HTML tags if present
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Replace non-breaking spaces and unicode whitespace
    text = text.replace('\xa0', ' ').replace('\r\n', '\n').replace('\r', '\n')
    
    # Fix multiple spaces while preserving paragraph breaks
    paragraphs = text.split('\n')
    cleaned_paragraphs = []
    for p in paragraphs:
        cleaned_p = re.sub(r'[ \t]+', ' ', p).strip()
        if cleaned_p:
            cleaned_paragraphs.append(cleaned_p)
            
    return '\n'.join(cleaned_paragraphs)


def detect_ai_provider(text: str) -> str:
    """
    Detects the likely AI model provider or source from text formatting and stylistic signatures.
    """
    text_lower = text.lower()
    
    if any(k in text_lower for k in ["as an ai language model", "as an ai,", "openai", "gpt-4", "chatgpt"]):
        return "ChatGPT (OpenAI)"
    elif any(k in text_lower for k in ["gemini", "google ai", "as google's ai"]):
        return "Gemini (Google)"
    elif any(k in text_lower for k in ["claude", "anthropic", "here is a summary:"]):
        return "Claude (Anthropic)"
    elif any(k in text_lower for k in ["copilot", "bing chat", "microsoft copilot"]):
        return "Microsoft Copilot"
    elif any(k in text_lower for k in ["deepseek", "deepseek-r1"]):
        return "DeepSeek AI"
    elif "http://" in text_lower or "https://" in text_lower or "www." in text_lower:
        return "Web Content / URL"
    else:
        return "AI Generated / Custom Input"


def detect_language(text: str) -> str:
    """Returns detected language."""
    non_ascii = len([c for c in text if ord(c) > 127])
    if non_ascii / max(len(text), 1) > 0.3:
        return "Multilingual / Non-Latin"
    return "English"


def segment_sentences(text: str) -> List[str]:
    """
    Splits cleaned text into structured individual sentences.
    """
    if not text:
        return []
        
    if sent_tokenize:
        try:
            raw_sentences = []
            for line in text.split('\n'):
                if line.strip():
                    raw_sentences.extend(sent_tokenize(line.strip()))
            if raw_sentences:
                return [s.strip() for s in raw_sentences if s.strip()]
        except Exception:
            pass
            
    sentence_endings = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9])')
    raw_list = sentence_endings.split(text)
    
    final_sentences = []
    for item in raw_list:
        sub_items = [s.strip() for s in item.split('\n') if s.strip()]
        final_sentences.extend(sub_items)
        
    return [s for s in final_sentences if len(s) > 1]


def classify_sentence(sentence: str) -> Dict[str, Any]:
    """
    Classifies a sentence using strict, research-style hierarchical filtering:
    1. Question Check (Starts with interrogative or ends with '?') -> Ignore (Question)
    2. Command Check (Imperative / Action requests) -> Ignore (Command)
    3. Greeting Check (Conversational noise / Politeness) -> Ignore (Greeting)
    4. Opinion Check (Subjective beliefs, superlatives, 'I think', 'Our team believes') -> Ignore (Opinion)
    5. Prediction Check (Future modals 'will', 'predicted to', 'forecast') -> Ignore (Prediction)
    6. Declarative Factual Claim -> Extract (Verifiable Claim)
    """
    clean_s = sentence.strip()
    if not clean_s:
        return None
        
    s_lower = clean_s.lower()
    words = re.findall(r'\b\w+\b', s_lower)
    
    # -------------------------------------------------------------------
    # 1. QUESTION CHECK
    # -------------------------------------------------------------------
    question_starters = {
        "who", "what", "when", "where", "why", "how", "can", "could",
        "should", "would", "will", "is", "are", "do", "does", "did",
        "am", "was", "were", "have", "has", "had", "may", "might"
    }
    
    if clean_s.endswith('?'):
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 98,
            "reason": "Interrogative Question / Non-verifiable Query",
            "category": "Question"
        }
        
    if words and words[0] in question_starters and len(words) <= 12:
        # Avoid misclassifying statements starting with 'Is' or 'Will' if part of a declarative title,
        # but if it fits question syntax, mark as Question
        if words[0] in {"who", "what", "when", "where", "why", "how", "can", "could", "should", "would", "do", "does", "did"}:
            return {
                "text": clean_s,
                "is_claim": False,
                "confidence": 97,
                "reason": "Interrogative Question / Non-verifiable Query",
                "category": "Question"
            }

    # -------------------------------------------------------------------
    # 2. COMMAND / IMPERATIVE CHECK
    # -------------------------------------------------------------------
    command_triggers = {
        "please", "verify", "open", "summarize", "generate", "click", "check",
        "remember", "don't", "do not", "make sure", "ensure", "read", "run"
    }
    if (words and words[0] in command_triggers) or "please verify" in s_lower or "please summarize" in s_lower or "generate a report" in s_lower:
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 96,
            "reason": "Directive Command / Non-verifiable Action",
            "category": "Command"
        }

    # -------------------------------------------------------------------
    # 3. GREETING / CONVERSATIONAL NOISE CHECK
    # -------------------------------------------------------------------
    greetings = [
        "hello", "hi", "good morning", "good afternoon", "thank you",
        "thanks", "welcome", "regards", "best regards", "thank you for reading", "thanks for reading"
    ]
    if any(s_lower.startswith(g) or s_lower == g for g in greetings) or "thank you for" in s_lower or "thanks for" in s_lower:
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 98,
            "reason": "Conversational Greeting / Politeness Marker",
            "category": "Greeting"
        }

    # -------------------------------------------------------------------
    # 4. OPINION / SUBJECTIVE JUDGMENT CHECK
    # -------------------------------------------------------------------
    opinion_phrases = [
        "i think", "i believe", "in my opinion", "we believe", "our team believes",
        "many people think", "it seems", "i feel", "should use", "everyone should",
        "must be", "looks like", "is the best", "is the coolest", "most beautiful"
    ]
    if any(phrase in s_lower for phrase in opinion_phrases):
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 96,
            "reason": "Subjective Opinion / Personal Belief Statement",
            "category": "Opinion"
        }

    opinion_adjectives = {
        "coolest", "amazing", "awesome", "incredible", "best", "worst", "greatest",
        "wonderful", "terrible", "horrible", "fantastic", "beautiful", "ugly", "mind-blowing",
        "spectacular", "pleasant", "flawless", "superior", "inferior", "favorite"
    }
    if any(w in opinion_adjectives for w in words):
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 94,
            "reason": "Subjective Value Judgment / Superlative Qualifier",
            "category": "Opinion"
        }

    # -------------------------------------------------------------------
    # 5. PREDICTION / FUTURE SPECULATION CHECK
    # -------------------------------------------------------------------
    prediction_phrases = ["expected to", "likely to", "predicted", "forecast", "projected to"]
    if any(pw in s_lower for pw in prediction_phrases):
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 93,
            "reason": "Future Speculation / Unverified Prediction",
            "category": "Prediction"
        }

    # Future modals 'will', 'would', 'might' without historical date context
    if ("will" in words or "would" in words or "might" in words) and not re.search(r'\b(in|by|since|during)\s+(19\d\d|20[0-2]\d)\b', s_lower):
        return {
            "text": clean_s,
            "is_claim": False,
            "confidence": 92,
            "reason": "Unverifiable Future Prediction",
            "category": "Prediction"
        }

    # -------------------------------------------------------------------
    # 6. DECLARATIVE FACTUAL CLAIM CHECK
    # -------------------------------------------------------------------
    has_year = bool(re.search(r'\b(19\d\d|20\d\d)\b', clean_s))
    has_numbers = bool(re.search(r'\b\d+(\.\d+)?(°c|%|km|m)?\b', s_lower))
    has_fact_relations = any(rel in s_lower for rel in ["located in", "capital of", "revolves around", "boils at", "created by", "invented in", "released", "independent in"])

    capitalized_words = re.findall(r'\b[A-Z][a-zA-Z0-9\-]+\b', clean_s)
    proper_nouns = [w for idx, w in enumerate(capitalized_words) if idx > 0 or len(w) > 3]

    spacy_entities = []
    if nlp:
        try:
            doc = nlp(clean_s)
            spacy_entities = [ent.text for ent in doc.ents]
        except Exception:
            pass

    score = 70
    if has_year:
        score += 18
    if has_numbers:
        score += 15
    if has_fact_relations:
        score += 15
    if proper_nouns or spacy_entities:
        score += 10

    confidence = min(max(score, 88), 99)

    return {
        "text": clean_s,
        "is_claim": True,
        "confidence": confidence,
        "reason": "Verifiable Factual Claim",
        "category": "Verifiable Claim"
    }


def extract_claims_from_text(text: str) -> Dict[str, Any]:
    """
    Main pipeline entry for Module 1 & Module 2 processing.
    """
    cleaned = clean_text(text)
    sentences = segment_sentences(cleaned)
    ai_provider = detect_ai_provider(cleaned)
    language = detect_language(cleaned)
    
    claims = []
    ignored = []
    category_counts = {
        "Verifiable Claim": 0,
        "Opinion": 0,
        "Question": 0,
        "Command": 0,
        "Prediction": 0,
        "Greeting": 0,
        "Other": 0
    }
    
    for s in sentences:
        res = classify_sentence(s)
        if not res:
            continue
            
        cat = res.get("category", "Other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

        if res["is_claim"]:
            claims.append(res)
        else:
            ignored.append(res)

    words_count = len(re.findall(r'\w+', cleaned))
    chars_count = len(cleaned)

    return {
        "metadata": {
            "source_provider": ai_provider,
            "character_count": chars_count,
            "word_count": words_count,
            "sentence_count": len(sentences),
            "language": language,
            "status": "Ready for Claim Extraction" if sentences else "No Text Loaded"
        },
        "cleaned_text": cleaned,
        "sentences": sentences,
        "claims": claims,
        "ignored": ignored,
        "stats": {
            "total_sentences": len(sentences),
            "claims_extracted": len(claims),
            "ignored_count": len(ignored),
            "category_breakdown": category_counts
        }
    }
