"""
VeriGround — Module 6: Provenance Store
========================================
SQLite-backed audit trail for verified claims.

Each call to log_verification() writes one row per claim containing the
full chain of evidence: claim text, matched evidence chunk, source document,
verdict, fused fusion score, all component scores, LLM explanation, and
a UTC timestamp.

The database file is created automatically in the same directory as this
module on first access.  No migration tooling needed — the schema is
created via CREATE TABLE IF NOT EXISTS on every startup.

Design notes
------------
- stdlib sqlite3 only — no new dependency.
- component_scores stored as JSON text for schema flexibility; the query
  layer returns them already parsed.
- Thread safety: each call uses its own connection (connect → use → close),
  which is safe for Flask's threaded request model.  A connection pool
  would be needed at production scale, but is unnecessary for a prototype.
"""

from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

# Database file next to this module
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "provenance.db")


# ---------------------------------------------------------------------------
# Schema initialisation — called once on import
# ---------------------------------------------------------------------------

def _init_db() -> None:
    """Create the provenance table if it does not already exist."""
    with sqlite3.connect(_DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS provenance (
                claim_id            TEXT PRIMARY KEY,
                claim_text          TEXT NOT NULL,
                evidence_chunk_id   TEXT,
                source_document_id  TEXT,
                verdict             TEXT NOT NULL,
                fused_score         REAL,
                component_scores    TEXT,   -- JSON
                explanation         TEXT,
                timestamp           TEXT NOT NULL
            )
        """)
        conn.commit()


_init_db()


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

def log_verification(
    claim_text: str,
    verdict: str,
    *,
    evidence_chunk_id: str = "",
    source_document_id: str = "",
    fused_score: float = 0.0,
    component_scores: dict[str, Any] | None = None,
    explanation: str = "",
    claim_id: str | None = None,
) -> str:
    """
    Write one provenance row and return the claim_id.

    Parameters
    ----------
    claim_text          : The atomic claim that was verified.
    verdict             : One of Supported / Partially Supported /
                          Unsupported / Contradicted.
    evidence_chunk_id   : Chunk id from Module 3 (e.g. "doc0_2").
    source_document_id  : Source document id from Module 3 (e.g. "doc0").
    fused_score         : Weighted fusion score from Module 4 (0–1).
    component_scores    : Dict with sem_sim, p_entail, p_neutral,
                          p_contradict, entity_overlap.
    explanation         : One-sentence explanation from Module 5.
    claim_id            : Optional — auto-generated UUID if not supplied.

    Returns
    -------
    The claim_id string that was written.
    """
    if claim_id is None:
        claim_id = str(uuid.uuid4())

    ts = datetime.now(timezone.utc).isoformat()
    comp_json = json.dumps(component_scores or {})

    with sqlite3.connect(_DB_PATH) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO provenance
                (claim_id, claim_text, evidence_chunk_id, source_document_id,
                 verdict, fused_score, component_scores, explanation, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                claim_id, claim_text, evidence_chunk_id, source_document_id,
                verdict, fused_score, comp_json, explanation, ts,
            ),
        )
        conn.commit()

    return claim_id


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

def _row_to_dict(row: tuple) -> dict[str, Any]:
    """Convert a sqlite3 row tuple to a clean dict with parsed JSON."""
    (claim_id, claim_text, evidence_chunk_id, source_document_id,
     verdict, fused_score, component_scores_json, explanation, timestamp) = row
    return {
        "claim_id":           claim_id,
        "claim_text":         claim_text,
        "evidence_chunk_id":  evidence_chunk_id or "",
        "source_document_id": source_document_id or "",
        "verdict":            verdict,
        "fused_score":        fused_score,
        "component_scores":   json.loads(component_scores_json or "{}"),
        "explanation":        explanation or "",
        "timestamp":          timestamp,
    }


def get_provenance_log(
    verdict_filter: str | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    """
    Return logged rows, newest first.

    Parameters
    ----------
    verdict_filter : If provided, only rows with this exact verdict are
                     returned.  Case-sensitive.  Pass None for all rows.
    limit          : Maximum rows to return (default 500 — enough for any
                     prototype demo; set higher or remove for production).
    """
    with sqlite3.connect(_DB_PATH) as conn:
        if verdict_filter:
            rows = conn.execute(
                "SELECT * FROM provenance WHERE verdict = ? "
                "ORDER BY timestamp DESC LIMIT ?",
                (verdict_filter, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM provenance ORDER BY timestamp DESC LIMIT ?",
                (limit,),
            ).fetchall()

    return [_row_to_dict(r) for r in rows]


def get_claim_by_id(claim_id: str) -> dict[str, Any] | None:
    """Return a single provenance row by claim_id, or None if not found."""
    with sqlite3.connect(_DB_PATH) as conn:
        row = conn.execute(
            "SELECT * FROM provenance WHERE claim_id = ?",
            (claim_id,),
        ).fetchone()
    return _row_to_dict(row) if row else None


def get_provenance_stats() -> dict[str, Any]:
    """
    Return aggregate counts per verdict — used by the dashboard summary bar.

    Returns
    -------
    {
        "total": int,
        "by_verdict": {
            "Supported": int,
            "Partially Supported": int,
            "Unsupported": int,
            "Contradicted": int,
        }
    }
    """
    with sqlite3.connect(_DB_PATH) as conn:
        total = conn.execute("SELECT COUNT(*) FROM provenance").fetchone()[0]
        rows = conn.execute(
            "SELECT verdict, COUNT(*) FROM provenance GROUP BY verdict"
        ).fetchall()

    by_verdict = {
        "Supported": 0,
        "Partially Supported": 0,
        "Unsupported": 0,
        "Contradicted": 0,
    }
    for verdict, count in rows:
        by_verdict[verdict] = count

    return {"total": total, "by_verdict": by_verdict}
