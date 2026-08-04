import os
import sys
# Ensure backend package modules are importable when running this script from repo root
sys.path.insert(0, os.path.dirname(__file__))

import evidence_retrieval as er
import nli_verification as nv
from test_evidence_retrieval import SOURCE_DOCUMENTS, CLAIMS

claims = [CLAIMS[2], CLAIMS[3]]
index, chunks = er.build_faiss_index(SOURCE_DOCUMENTS)

print('Running integration checks')
for claim in claims:
    print('\n' + '=' * 60)
    print('Claim:', claim)
    ev = er.retrieve_evidence(claim, index, chunks, k=5)
    print('Retrieved candidates:')
    for c in ev:
        print(' Rank {} | src={} | sim={} | best_sent_sim={} | bm25={}'.format(
            c.get('rank'), c.get('source_id'), c.get('similarity_score'), c.get('best_sentence_sim'), c.get('bm25_score', 0.0)
        ))
        print('  best_sentence:', c.get('best_sentence'))
        res = nv.verify_claim_evidence(
            claim,
            c.get('text',''),
            c.get('similarity_score',0.0),
            chunk_id=c.get('chunk_id',''),
            source_id=c.get('source_id',''),
            evidence=c,
        )
        print('  Verdict:', res['verdict'], 'Fused:', res['fused_score'])
