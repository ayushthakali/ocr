import os
import platform
from PIL import Image, UnidentifiedImageError
import pytesseract
from pathlib import Path
from io import BytesIO
import requests
import easyocr
import numpy as np
import cv2
from pdf2image import convert_from_path

# Configure Tesseract based on environment
def configure_tesseract():
    """
    Configure Tesseract OCR based on the deployment environment.
    Supports Windows (development) and Linux/Docker (production).
    """
    # Check if TESSDATA_PREFIX is set via environment variable
    tessdata_prefix = os.getenv('TESSDATA_PREFIX')
    
    if tessdata_prefix:
        # Use environment variable (Docker/production)
        os.environ['TESSDATA_PREFIX'] = tessdata_prefix
        print(f"✅ Using Tesseract data from environment: {tessdata_prefix}")
        return
    
    # Auto-detect for Windows development
    if platform.system() == 'Windows':
        possible_paths = [
            r'C:\Program Files\Tesseract-OCR\tessdata',
            r'C:\Program Files (x86)\Tesseract-OCR\tessdata',
            os.path.join(os.getenv('LOCALAPPDATA', ''), r'Tesseract-OCR\tessdata')
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                os.environ['TESSDATA_PREFIX'] = path
                print(f"✅ Found Tesseract data at: {path}")
                return
        
        print("⚠️  Could not find Tesseract data directory automatically.")
        print("   Please set TESSDATA_PREFIX environment variable or install Tesseract.")
    else:
        # On Linux/Docker, assume Tesseract is in system PATH
        print("✅ Using system Tesseract (Linux/Docker)")

# Configure on module import
configure_tesseract()

class OCRService():
    """
    A reusable OCR service class that extracts text from images, PDFs, or folders.
    It supports both file paths and URLs.
    """
    def __init__(self, languages: str = 'eng'):
        self.languages = languages
        # EasyOCR uses 2-letter codes (en), Tesseract uses 3-letter (eng)
        easyocr_langs = [l.replace('eng', 'en') for l in languages.split('+')]
        self.easyocr_reader = easyocr.Reader(easyocr_langs)

    def preprocess_with_opencv(self, img: Image.Image) -> np.ndarray:
        """
        Preprocess a PIL image using OpenCV: grayscale, median blur, adaptive threshold
        """
        img = np.array(img.convert('RGB'))  # Convert PIL to OpenCV format
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        gray = cv2.medianBlur(gray, 3)
        gray = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        return gray
    
    def extract_text_from_url(self, image_url: str) -> str:
        """
        Extract text from an image URL with preprocessing and fallback OCR.
        """
        try:
            response = requests.get(image_url)
            response.raise_for_status()  # Raise exception for bad status codes

            img = Image.open(BytesIO(response.content))
            preprocessed_img = self.preprocess_with_opencv(img)

            # Tesseract OCR with custom config
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(preprocessed_img, lang=self.languages, config=custom_config).strip()

            # Fallback to EasyOCR if Tesseract fails
            if not text:
                text_list = self.easyocr_reader.readtext(BytesIO(response.content), detail=0)
                text = "\n".join(text_list).strip()

            return text if text else ""

        except requests.exceptions.RequestException:
            print(f"❌ Failed to download image: {image_url}")
            return ""
        except UnidentifiedImageError:
            print(f"❌ Cannot identify image file from URL: {image_url}")
            return ""
        except Exception as e:
            print(f"❌ Error processing image URL: {e}")
            return ""

    def extract_text_from_image(self, image_path: Path) -> str:
        """
        Extracts text from a single image (local file).
        Returns an empty string if extraction fails.
        """
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img).strip()

            return text if text else ""

        except FileNotFoundError:
            print(f"❌ File not found: {image_path}")
            return ""
        except UnidentifiedImageError:
            print(f"❌ Cannot identify image file: {image_path}")
            return ""
        except Exception as e:
            print(f"❌ Error processing {image_path}: {e}")
            return ""
    
    def preprocess_for_document(self, img: Image.Image) -> np.ndarray:
        """
        Specialized preprocessing for digital documents (PDFs, scans).
        Preserves fine details like decimal points and table lines.
        """
        img_np = np.array(img.convert('RGB'))
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        
        # for clean digital PDFs, simple grayscale is often best.
        # But we can apply a very light threshold content is faint.
        # Here we use simple binary thresholding to crisp up text without blurring decimals.
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh

    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """
        Extracts text from a PDF file by converting pages to images.
        Handles multi-page PDFs and combines text from all pages.
        Optimized for Bank Statements (High DPI, tabular data).
        """
        try:
            print(f"📄 Converting PDF to images: {pdf_path}")
            # Convert PDF to images with Higher DPI for better number recognition
            images = convert_from_path(str(pdf_path), dpi=400)
            
            all_text = []
            for i, img in enumerate(images):
                print(f"📄 Processing PDF page {i + 1}/{len(images)}...")
                
                # Use specialized preprocessing for documents
                preprocessed_img = self.preprocess_for_document(img)
                
                # Extract text using Tesseract
                # --psm 6: Assume a single uniform block of text (good for tables/statements)
                custom_config = r'--oem 3 --psm 6'
                text = pytesseract.image_to_string(
                    preprocessed_img, 
                    lang=self.languages, 
                    config=custom_config
                ).strip()
                
                # Fallback to EasyOCR if Tesseract fails significantly
                if not text or len(text) < 50:
                    print("   ⚠️ Tesseract yield low/no text, trying EasyOCR fallback...")
                    img_array = np.array(img)
                    text_list = self.easyocr_reader.readtext(img_array, detail=0)
                    text = "\n".join(text_list).strip()
                
                if text:
                    all_text.append(f"--- Page {i + 1} ---\n{text}")
            
            combined_text = "\n\n".join(all_text)
            
            if not combined_text:
                print(f"⚠️ No text extracted from PDF: {pdf_path}")
            
            return combined_text if combined_text else ""
        
        except FileNotFoundError:
            print(f"❌ PDF file not found: {pdf_path}")
            return ""
        except Exception as e:
            error_msg = str(e)
            if "poppler" in error_msg.lower() or "Unable to get page count" in error_msg:
                print(f"❌ Poppler is not installed or not in PATH. Please install Poppler to process PDFs.")
                print(f"   Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases/")
                print(f"   Extract and add the 'bin' folder to your system PATH")
            else:
                print(f"❌ Error processing PDF {pdf_path}: {e}")
            return ""
    
    def extract_text_from_file(self, file_path: Path) -> str:
        """
        Extracts text from either an image or PDF file.
        Automatically detects file type based on extension.
        """
        file_ext = file_path.suffix.lower()
        
        if file_ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
            return self.extract_text_from_image(file_path)
        else:
            print(f"❌ Unsupported file type: {file_ext}")
            return ""
    
    async def extract_text_from_pdf_async(self, pdf_path: Path) -> str:
        """
        Extracts text from a PDF file asynchronously.
        Runs PDF processing in thread pool to avoid blocking.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.extract_text_from_pdf, pdf_path)
    
    async def extract_text_from_file_async(self, file_path: Path) -> str:
        """
        Extracts text from either an image or PDF file asynchronously.
        Automatically detects file type based on extension.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.extract_text_from_file, file_path)
    
    async def extract_text_from_image_async(self, image_path: Path) -> str:
        """
        Extracts text from a single image (local file) asynchronously.
        Runs OCR in thread pool to avoid blocking.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.extract_text_from_image, image_path)
    
    async def extract_text_from_url_async(self, image_url: str) -> str:
        """
        Extract text from an image URL asynchronously.
        Runs OCR in thread pool to avoid blocking.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.extract_text_from_url, image_url)