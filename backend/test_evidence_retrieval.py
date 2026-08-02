"""
VeriGround — Module 3 smoke test
=================================
Three sample claims against two short source documents.

Run from the backend/ directory:
    python test_evidence_retrieval.py

Expected output shows top-3 evidence chunks per claim with cosine similarity
scores.  Scores for semantically related claim/chunk pairs should be noticeably
higher (e.g. > 0.5) than unrelated pairs (< 0.3).
"""

import json
from evidence_retrieval import retrieve_evidence_batch

# ---------------------------------------------------------------------------
# Sample source documents  (two short Wikipedia-style paragraphs each)
# ---------------------------------------------------------------------------
SOURCE_DOCUMENTS = [
    {
        "id": "doc_eiffel",
        "text": (
            "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. "
            "It was constructed from 1887 to 1889 as the centerpiece of the 1889 World's Fair.\n\n"
            "The tower was designed and built by Gustave Eiffel's engineering company. "
            "It stands 330 metres (1,083 ft) tall and was the tallest man-made structure in the world "
            "for 41 years until the Chrysler Building was completed in New York City in 1930.\n\n"
            "Approximately 7 million people visit the Eiffel Tower every year, making it the most-visited "
            "paid monument in the world. It has become a global cultural icon of France."
        ),
    },
    {
        "id": "doc_deepmind",
        "text": (
            "DeepMind Technologies is a British artificial intelligence research laboratory founded in London "
            "in 2010. It was acquired by Google in 2014 and is now a subsidiary of Alphabet Inc.\n\n"
            "AlphaGo is a computer program developed by DeepMind to play the board game Go. "
            "In March 2016, AlphaGo defeated world champion Lee Sedol in a five-game match, "
            "winning four games to one. This was the first time a computer program had beaten a "
            "professional Go player without handicap on a full-sized board.\n\n"
            "DeepMind later developed AlphaFold, a program that predicts protein structures from amino "
            "acid sequences. AlphaFold 2, released in 2020, achieved near-experimental accuracy and is "
            "considered a major breakthrough in structural biology."
        ),
    },
    {
        "id": "doc_water",
        "text": (
            "Water boils at 100 degrees Celsius (212 degrees Fahrenheit) under standard atmospheric "
            "pressure of 101.325 kPa (1 atm). This is one of the fixed points used to define the "
            "Celsius temperature scale.\n\n"
            "At higher altitudes, atmospheric pressure decreases, which lowers the boiling point of water. "
            "For example, at the summit of Mount Everest (about 8,849 m above sea level), water boils "
            "at approximately 70 degrees Celsius.\n\n"
            "Dissolved salts and other solutes raise the boiling point of water through a phenomenon "
            "called boiling-point elevation, a colligative property of solutions."
        ),
    },
]

# ---------------------------------------------------------------------------
# Sample claims
# ---------------------------------------------------------------------------
CLAIMS = [
    "The Eiffel Tower was built in 1889 and is located in Paris.",
    "AlphaGo defeated Lee Sedol in 2016.",
    "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
]

# ---------------------------------------------------------------------------
# Run retrieval
# ---------------------------------------------------------------------------
def main() -> None:
    print("=" * 70)
    print("VeriGround — Module 3: Evidence Retrieval Test")
    print(f"Model : all-MiniLM-L6-v2")
    print(f"Claims: {len(CLAIMS)}  |  Source docs: {len(SOURCE_DOCUMENTS)}")
    print("=" * 70)

    results = retrieve_evidence_batch(CLAIMS, SOURCE_DOCUMENTS, k=3)

    for item in results:
        claim = item["claim"]
        evidence = item["evidence"]

        print(f"\nCLAIM : {claim}")
        print("-" * 70)

        if not evidence:
            print("  (no evidence chunks found)")
            continue

        for ev in evidence:
            score = ev["similarity_score"]
            bar = "#" * int(score * 40)  # visual bar out of 40 chars
            print(
                f"  Rank {ev['rank']}  |  source={ev['source_id']}  "
                f"|  chunk={ev['chunk_id']}"
            )
            print(f"  Score: {score:.4f}  [{bar:<40}]")
            # Print first 120 chars of the chunk text
            snippet = ev["text"][:120].replace("\n", " ")
            print(f"  Text : {snippet}...")
            print()

    # --- Machine-readable summary ---
    print("\n" + "=" * 70)
    print("JSON summary (for integration tests):")
    summary = [
        {
            "claim": r["claim"],
            "top_evidence": {
                "source_id": r["evidence"][0]["source_id"],
                "similarity_score": r["evidence"][0]["similarity_score"],
            }
            if r["evidence"]
            else None,
        }
        for r in results
    ]
    print(json.dumps(summary, indent=2))
    print("=" * 70)


if __name__ == "__main__":
    main()
