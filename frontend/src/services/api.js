/**
 * VeriGround API Integration Layer (Strict Research-Style Claim Classifier)
 */

const API_BASE = '/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false };
  }
}

export async function fetchSampleDatasets() {
  try {
    const res = await fetch(`${API_BASE}/sample-data`);
    if (res.ok) {
      const json = await res.json();
      return json.samples;
    }
  } catch (e) {
    console.warn("Backend unavailable, using local samples.");
  }
  
  // Fallback preset samples
  return [
    {
      id: "academic-strict-benchmark",
      title: "Strict Academic Evaluation Suite",
      description: "10-sentence benchmark suite testing Claims, Opinions, Questions, Predictions, Greetings, and Commands.",
      text: `The Eiffel Tower is located in Paris.

I think Paris is the most beautiful city in the world.

Can AI replace teachers?

OpenAI released GPT-4 in 2023.

Artificial Intelligence will completely replace humans by 2035.

Thank you for reading.

Water boils at 100°C under standard atmospheric pressure.

Our team believes VeriGround is an innovative framework.

The capital of Japan is Tokyo.

Please verify these claims.`
    }
  ];
}

export async function preprocessText(text, source = 'Paste Text') {
  try {
    const res = await fetch(`${API_BASE}/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend preprocess endpoint error, executing client fallback:", e);
  }

  // Client-side fallback preprocess logic
  const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const rawSentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 1);
  const words = cleaned ? cleaned.split(/\s+/).length : 0;
  
  let detectedSource = "ChatGPT";
  if (source === "Website URL") detectedSource = "Web Article";
  else if (source === "Upload File") detectedSource = "Document Upload";
  else if (text.toLowerCase().includes("gemini")) detectedSource = "Gemini";
  else if (text.toLowerCase().includes("claude")) detectedSource = "Claude";

  return {
    success: true,
    source: detectedSource,
    characters: cleaned.length,
    sentences_count: rawSentences.length,
    sentences: rawSentences,
    words: words,
    language: "English",
    status: "Ready for Claim Extraction",
    cleaned_text: cleaned
  };
}

export async function extractClaims(text) {
  try {
    const res = await fetch(`${API_BASE}/extract-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Backend claim extraction endpoint error, executing client fallback:", e);
  }

  // Client-side fallback strict extraction logic matching python engine
  const cleaned = text.trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 1);
  
  const claims = [];
  const ignored = [];
  const category_counts = {
    "Verifiable Claim": 0,
    "Opinion": 0,
    "Question": 0,
    "Command": 0,
    "Prediction": 0,
    "Greeting": 0
  };

  const questionStarters = ["who", "what", "when", "where", "why", "how", "can", "could", "should", "would", "will", "is", "are", "do", "does", "did"];
  const commandTriggers = ["please", "verify", "open", "summarize", "generate", "click", "check"];
  const opinionPhrases = ["i think", "i believe", "in my opinion", "we believe", "our team believes", "many people think", "it seems", "i feel", "most beautiful", "coolest", "amazing"];

  sentences.forEach((sentence) => {
    const clean_s = sentence.strip ? sentence.strip() : sentence.trim();
    const lower = clean_s.toLowerCase();
    const words = lower.match(/\b\w+\b/g) || [];
    const firstWord = words[0] || "";

    // 1. Question Check
    if (clean_s.endsWith('?') || (questionStarters.includes(firstWord) && words.length <= 12)) {
      ignored.push({
        text: clean_s,
        is_claim: false,
        confidence: 97,
        reason: "Interrogative Question / Non-verifiable Query",
        category: "Question"
      });
      category_counts["Question"]++;
      return;
    }

    // 2. Command Check
    if (commandTriggers.includes(firstWord) || lower.includes("please verify")) {
      ignored.push({
        text: clean_s,
        is_claim: false,
        confidence: 96,
        reason: "Directive Command / Non-verifiable Action",
        category: "Command"
      });
      category_counts["Command"]++;
      return;
    }

    // 3. Greeting Check
    if (lower.startsWith("thank you") || lower.startsWith("hi ") || lower.startsWith("hello") || lower.includes("thank you for reading")) {
      ignored.push({
        text: clean_s,
        is_claim: false,
        confidence: 98,
        reason: "Conversational Greeting / Politeness Marker",
        category: "Greeting"
      });
      category_counts["Greeting"]++;
      return;
    }

    // 4. Opinion Check
    if (opinionPhrases.some(p => lower.includes(p))) {
      ignored.push({
        text: clean_s,
        is_claim: false,
        confidence: 95,
        reason: "Subjective Opinion / Personal Belief Statement",
        category: "Opinion"
      });
      category_counts["Opinion"]++;
      return;
    }

    // 5. Prediction Check
    if (lower.includes("will ") || lower.includes("expected to") || lower.includes("likely to") || lower.includes("predicted")) {
      if (!/\b(19\d\d|20[0-2]\d)\b/.test(lower)) {
        ignored.push({
          text: clean_s,
          is_claim: false,
          confidence: 92,
          reason: "Unverifiable Future Prediction",
          category: "Prediction"
        });
        category_counts["Prediction"]++;
        return;
      }
    }

    // 6. Declarative Claim
    claims.push({
      text: clean_s,
      is_claim: true,
      confidence: 95,
      reason: "Verifiable Factual Claim",
      category: "Verifiable Claim"
    });
    category_counts["Verifiable Claim"]++;
  });

  return {
    metadata: {
      source_provider: "AI Generated / Input",
      character_count: cleaned.length,
      word_count: cleaned.split(/\s+/).length,
      sentence_count: sentences.length,
      language: "English",
      status: "Extraction Complete"
    },
    cleaned_text: cleaned,
    sentences: sentences,
    claims: claims,
    ignored: ignored,
    stats: {
      total_sentences: sentences.length,
      claims_extracted: claims.length,
      ignored_count: ignored.length,
      category_breakdown: category_counts
    }
  };
}

export async function parseUploadedFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/parse-file`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json();
    throw new Error(errJson.error || "File parsing failed");
  } catch (e) {
    if (e.message && !e.message.includes("fetch")) throw e;
    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      return { success: true, filename: file.name, extracted_text: text };
    }
    throw new Error(`File upload requires backend processing: ${e.message}`);
  }
}

export async function fetchUrlContent(url) {
  try {
    const res = await fetch(`${API_BASE}/fetch-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json();
    throw new Error(errJson.error || "URL fetch failed");
  } catch (e) {
    throw e;
  }
}
