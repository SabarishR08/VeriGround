import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlp_engine import extract_claims_from_text

test_text = """The Eiffel Tower is located in Paris.
I think Paris is the most beautiful city in the world.
Can AI replace teachers?
OpenAI released GPT-4 in 2023.
Artificial Intelligence will completely replace humans by 2035.
Thank you for reading.
Water boils at 100°C under standard atmospheric pressure.
Our team believes VeriGround is an innovative framework.
The capital of Japan is Tokyo.
Please verify these claims."""

res = extract_claims_from_text(test_text)

print("\n==========================================")
print(f"TOTAL SENTENCES: {res['stats']['total_sentences']}")
print(f"EXTRACTED CLAIMS: {res['stats']['claims_extracted']}")
print(f"IGNORED SENTENCES: {res['stats']['ignored_count']}")
print("==========================================")

print("\n--- EXTRACTED CLAIMS ---")
for idx, c in enumerate(res['claims'], 1):
    print(f"{idx}. {c['text']} (Confidence: {c['confidence']}%)")

print("\n--- IGNORED SENTENCES ---")
for idx, i in enumerate(res['ignored'], 1):
    print(f"{idx}. [{i['category']}] {i['text']} -> {i['reason']}")
