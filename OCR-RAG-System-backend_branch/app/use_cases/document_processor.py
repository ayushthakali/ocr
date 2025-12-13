from pathlib import Path
from app.utils.key_generator import FileKeyGenerator
from app.infrastructure.firebase.firebase_service import FirebaseService

class DocumentProcessor:
    """Main coordinator: OCR -> Gemini Parser -> Save JSON in Firebase"""

    def __init__(self, ocr, parser):
        self.ocr = ocr
        self.parser = parser
        self.key_gen = FileKeyGenerator()
        self.firebase = FirebaseService() 

    async def process_image_async(self, image_path: str, user_id: str, company_id: str, image_url: str = None) -> dict:
        """
        Process image or PDF asynchronously: OCR → Parser → Firebase save

        Args:
            image_path: Path to image or PDF file
            user_id: Firebase UID of the user (for user-scoped storage)
            company_id: Company identifier
            image_url: Optional URL of the uploaded image

        Returns:
            Saved result from Firebase
        """
        # 1. Extract text asynchronously (supports both images and PDFs)
        print(f"📄 Extracting text from: {image_path}")
        if str(image_path).startswith("http"):
            ocr_text = await self.ocr.extract_text_from_url_async(image_path)
        else:
            # Use the new method that handles both images and PDFs
            ocr_text = await self.ocr.extract_text_from_file_async(Path(image_path))

        print(f"✅ Text extraction complete. Length: {len(ocr_text) if ocr_text else 0}")

        # Validate OCR text
        if not ocr_text or not ocr_text.strip():
            print("❌ No text extracted")
            raise ValueError(
                "No text could be extracted from the document. "
                "Please ensure the document contains readable text. "
                "For PDFs, make sure Poppler is installed."
            )

        # 2. Parse with Gemini asynchronously
        print("🤖 Sending to Gemini for parsing...")
        parsed_data = await self.parser.parse_async(ocr_text, image_url or image_path)
        print("✅ Gemini parsing complete")

        # 3. Generate unique document key
        parsed_data["document_key"] = self.key_gen.generate_key(
            parsed_data.get("document_type", "other")
        )

        # 4. Add image URL if provided
        if image_url:
            parsed_data["image_url"] = image_url

        # 5. Save to Firebase asynchronously with user and company-specific path
        print("💾 Saving to Firebase...")
        saved_result = await self.firebase.save_async(
            data=parsed_data,
            user_id=user_id,
            company_id=company_id
        )
        print(f"✅ Saved to Firebase with key: {saved_result.get('document_key')}")

        return saved_result


