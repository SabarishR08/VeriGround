/**
 * VeriGround API Integration Layer (Full End-to-End Pipeline)
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
    console.warn("Backend preprocess endpoint error:", e);
  }

  const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const rawSentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 1);
  const words = cleaned ? cleaned.split(/\s+/).length : 0;
  
  return {
    success: true,
    source: "ChatGPT",
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
    console.warn("Backend claim extraction endpoint error:", e);
  }

  throw new Error("Backend claim extraction unavailable.");
}

export async function retrieveEvidence(claims, sourceDocuments, k = 5) {
  const res = await fetch(`${API_BASE}/retrieve-evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claims, source_documents: sourceDocuments, k })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Evidence retrieval failed");
  }
  return await res.json();
}

export async function verifyClaims(retrieveResults) {
  const res = await fetch(`${API_BASE}/verify-claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results: retrieveResults })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Claim verification failed");
  }
  return await res.json();
}

export async function explainClaim(claim, evidence, verdict, components, claimId = null) {
  const res = await fetch(`${API_BASE}/explain-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claim,
      evidence,
      verdict,
      components,
      claim_id: claimId
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Explanation generation failed");
  }
  return await res.json();
}

export async function fetchProvenanceLog(verdictFilter = null) {
  const url = verdictFilter
    ? `${API_BASE}/provenance-log?verdict=${encodeURIComponent(verdictFilter)}`
    : `${API_BASE}/provenance-log`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch provenance log");
  }
  return await res.json();
}

export async function parseUploadedFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/parse-file`, {
    method: 'POST',
    body: formData
  });
  if (res.ok) {
    return await res.json();
  }
  const errJson = await res.json().catch(() => ({}));
  throw new Error(errJson.error || "File parsing failed");
}

export async function fetchUrlContent(url) {
  const res = await fetch(`${API_BASE}/fetch-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (res.ok) {
    return await res.json();
  }
  const errJson = await res.json().catch(() => ({}));
  throw new Error(errJson.error || "URL fetch failed");
}
