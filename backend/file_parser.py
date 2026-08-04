import os
import io
import requests
from bs4 import BeautifulSoup

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

def extract_text_from_url(url: str) -> str:
    """Scrapes text content from article or web page URL."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Remove scripts, styles, header, footer, nav
        for elem in soup(["script", "style", "header", "footer", "nav", "aside", "form"]):
            elem.extract()
            
        paragraphs = soup.find_all(['p', 'h1', 'h2', 'h3', 'li'])
        text_lines = [p.get_text().strip() for p in paragraphs if p.get_text().strip()]
        
        if not text_lines:
            text_lines = [soup.get_text()]
            
        return "\n".join(text_lines)
    except Exception as e:
        raise ValueError(f"Failed to fetch content from URL '{url}': {str(e)}")
