"""
VeriGround — Unit tests for file_parser.py
=========================================
Tests document parsers and URL extraction safety gates (SSRF, size limits, headers).
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from file_parser import (
    extract_text_from_txt,
    extract_text_from_url,
    _is_safe_url,
)


class TestFileParser(unittest.TestCase):

    def test_extract_text_from_txt(self):
        sample = "Line 1: Grounding AI claims.\nLine 2: Multi-step verification."
        result = extract_text_from_txt(sample.encode("utf-8"))
        self.assertEqual(result, sample)

    def test_ssrf_protection_loopback(self):
        urls = [
            "http://localhost:5000/api",
            "http://127.0.0.1:8080/secret",
            "http://169.254.169.254/latest/meta-data/",
        ]
        for u in urls:
            safe, msg = _is_safe_url(u)
            self.assertFalse(safe, f"Expected {u} to be rejected as SSRF target")
            with self.assertRaises(ValueError):
                extract_text_from_url(u)

    def test_unsupported_scheme_rejection(self):
        unsupported = [
            "ftp://files.example.com/data.txt",
            "file:///etc/passwd",
            "gopher://example.com",
        ]
        for u in unsupported:
            safe, _ = _is_safe_url(u)
            self.assertFalse(safe)
            with self.assertRaises(ValueError):
                extract_text_from_url(u)

    @patch("file_parser.requests.get")
    @patch("file_parser._is_safe_url", return_value=(True, ""))
    def test_safe_html_parsing(self, mock_safe, mock_get):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.headers = {"Content-Type": "text/html; charset=utf-8"}
        mock_response.encoding = "utf-8"
        html_payload = b"<html><head><title>Test</title></head><body><h1>Report</h1><p>Verified claim paragraph.</p></body></html>"
        mock_response.iter_content.return_value = [html_payload]
        mock_response.__enter__.return_value = mock_response

        mock_get.return_value = mock_response

        text = extract_text_from_url("https://example.com/news/article")
        self.assertIn("Report", text)
        self.assertIn("Verified claim paragraph.", text)

    @patch("file_parser.requests.get")
    @patch("file_parser._is_safe_url", return_value=(True, ""))
    def test_oversized_payload_rejection(self, mock_safe, mock_get):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.headers = {"Content-Type": "text/html", "Content-Length": str(10 * 1024 * 1024)}
        mock_response.__enter__.return_value = mock_response
        mock_get.return_value = mock_response

        with self.assertRaises(ValueError) as ctx:
            extract_text_from_url("https://example.com/huge.html", max_bytes=1024)
        self.assertIn("exceeds limit", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
