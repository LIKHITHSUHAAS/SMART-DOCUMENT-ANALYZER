import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

def parse_document(file_path: str, filename: str) -> list[dict]:
    """
    Parses a document (PDF or Image) and returns a list of dictionaries
    containing text chunks and metadata (e.g., source and page_number).
    """
    ext = os.path.splitext(filename)[1].lower()
    chunks = []
    
    if ext == '.pdf':
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text").strip()
                if text:
                    chunks.append({
                        "text": text,
                        "metadata": {
                            "source": filename,
                            "page": page_num + 1
                        }
                    })
                else:
                    # Fallback to OCR if page has no text but might have images
                    # Extract images on the page
                    image_list = page.get_images(full=True)
                    page_text = ""
                    for img_info in image_list:
                        xref = img_info[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        img = Image.open(io.BytesIO(image_bytes))
                        ocr_text = pytesseract.image_to_string(img).strip()
                        if ocr_text:
                            page_text += ocr_text + "\n"
                    if page_text.strip():
                        chunks.append({
                            "text": page_text.strip(),
                            "metadata": {
                                "source": f"{filename} (Scanned)",
                                "page": page_num + 1
                            }
                        })
                        
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            
    elif ext in ['.png', '.jpg', '.jpeg']:
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img).strip()
            if text:
                chunks.append({
                    "text": text,
                    "metadata": {
                        "source": filename,
                        "page": 1
                    }
                })
        except Exception as e:
            print(f"Error parsing image: {e}")
            
    return chunks
