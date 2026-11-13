import os
import io
import ipaddress
import socket
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

MAX_URL_PAYLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ("text/html", "application/xhtml+xml", "text/plain")


def _is_safe_url(url: str) -> tuple[bool, str]:
    """Validate that the URL uses HTTP/HTTPS and does not target private/reserved IP ranges."""
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False, f"Unsupported scheme '{parsed.scheme}'. Only http and https are permitted."
        hostname = parsed.hostname
        if not hostname:
            return False, "URL missing valid hostname."

        # Reject loopback literals immediately
        if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
            return False, f"Access to loopback target '{hostname}' is prohibited."

        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip = ipaddress.ip_address(ip_str)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False, f"Access to restricted or private IP address {ip_str} is prohibited."
        return True, ""
    except Exception as e:
        return False, f"Invalid URL or hostname resolution failure: {str(e)}"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes using PyPDF2 or pypdf."""
    try:
        try:
            import PyPDF2 as pdf_lib
        except ImportError:
            import pypdf as pdf_lib

        reader = pdf_lib.PdfReader(io.BytesIO(file_bytes))
        text_pages = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_pages.append(extracted.strip())
        return "\n".join(text_pages)
    except Exception as e:
        raise ValueError(f"Error parsing PDF file: {str(e)}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from Word .docx file bytes using python-docx."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        return "\n".join(full_text)
    except Exception as e:
        raise ValueError(f"Error parsing DOCX file: {str(e)}")


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from plain text file bytes."""
    try:
        return file_bytes.decode('utf-8', errors='ignore')
    except Exception as e:
        raise ValueError(f"Error parsing TXT file: {str(e)}")


def extract_text_from_url(url: str, max_bytes: int = MAX_URL_PAYLOAD_BYTES) -> str:
    """Scrapes text content safely from article or web page URL with SSRF and size protection."""
    safe, reason = _is_safe_url(url)
    if not safe:
        raise ValueError(f"URL validation failed: {reason}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        with requests.get(url, headers=headers, timeout=10, stream=True) as resp:
            resp.raise_for_status()

            # Verify Content-Type
            content_type = resp.headers.get("Content-Type", "").lower()
            if content_type and not any(allowed in content_type for allowed in ALLOWED_MIME_TYPES):
                raise ValueError(f"Unsupported Content-Type '{content_type}'. Expected HTML or plain text.")

            # Check reported Content-Length
            content_length = resp.headers.get("Content-Length")
            if content_length and int(content_length) > max_bytes:
                raise ValueError(f"Content-Length {content_length} exceeds limit of {max_bytes} bytes.")

            downloaded = io.BytesIO()
            total_bytes = 0
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise ValueError(f"Response size exceeded limit of {max_bytes} bytes.")
                    downloaded.write(chunk)

            raw_text = downloaded.getvalue().decode(resp.encoding or "utf-8", errors="ignore")

        soup = BeautifulSoup(raw_text, 'html.parser')

        # Remove scripts, styles, header, footer, nav
        for elem in soup(["script", "style", "header", "footer", "nav", "aside", "form"]):
            elem.extract()

        paragraphs = soup.find_all(['p', 'h1', 'h2', 'h3', 'li'])
        text_lines = [p.get_text().strip() for p in paragraphs if p.get_text().strip()]

        if not text_lines:
            text_lines = [soup.get_text().strip()]

        return "\n".join(line for line in text_lines if line)
    except Exception as e:
        raise ValueError(f"Failed to fetch content from URL '{url}': {str(e)}")
