"""
Centralized constants for model names, thresholds, and default configuration values across backend modules.
"""

# Model Names
DEFAULT_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_NLI_MODEL: str = "cross-encoder/nli-deberta-v3-base"
DEFAULT_EXPLANATION_MODEL: str = "gpt-3.5-turbo"

# Threshold Values
DEFAULT_SIMILARITY_THRESHOLD: float = 0.5
DEFAULT_NLI_ENTAILMENT_THRESHOLD: float = 0.7
DEFAULT_CONTRADICTION_THRESHOLD: float = 0.7

# Retrieval & Processing Defaults
DEFAULT_TOP_K_EVIDENCE: int = 5
DEFAULT_CHUNK_SIZE: int = 500
DEFAULT_CHUNK_OVERLAP: int = 50
