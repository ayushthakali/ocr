
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    
    # Environment
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    IS_PRODUCTION: bool = ENVIRONMENT == 'production'
    
    # Tesseract OCR
    TESSDATA_PREFIX: Optional[str] = os.getenv('TESSDATA_PREFIX')
    
    # Google Cloud & Firebase
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv(
        'GOOGLE_APPLICATION_CREDENTIALS',
        './app/config/google_service_account.json'
    )
    FIREBASE_CREDENTIALS: str = os.getenv(
        'FIREBASE_CREDENTIALS',
        './app/config/serviceAccountKey.json'
    )
    
    # Gemini AI
    GEMINI_KEY_PATH: str = os.getenv(
        'GEMINI_KEY_PATH',
        './app/config/gemini-key.json'
    )
    
    # Google Sheets
    GOOGLE_SHEETS_ID: str = os.getenv(
        'GOOGLE_SHEETS_ID',
        '1aQsdIOl38P8Rr1uUSWAEtbBHrV-EAaja9KNkGL1fPT8'
    )
    
    # Google OAuth (for per-user Google Sheets)
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
    GOOGLE_OAUTH_REDIRECT_URI: str = os.getenv(
        'GOOGLE_OAUTH_REDIRECT_URI',
        'http://localhost:8000/api/sheets/oauth/callback'
    )
    
    # Encryption (for storing OAuth tokens)
    ENCRYPTION_KEY: Optional[str] = os.getenv('ENCRYPTION_KEY')
    
    # Server
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', '8000'))
    
    # CORS
    ALLOWED_ORIGINS: list = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    
    @classmethod
    def validate(cls) -> None:
        """Validate that required configuration is present."""
        required_files = [
            ('GOOGLE_APPLICATION_CREDENTIALS', cls.GOOGLE_APPLICATION_CREDENTIALS),
            ('FIREBASE_CREDENTIALS', cls.FIREBASE_CREDENTIALS),
            ('GEMINI_KEY_PATH', cls.GEMINI_KEY_PATH),
        ]
        
        missing = []
        for name, path in required_files:
            if not Path(path).exists():
                missing.append(f"{name}: {path}")
        
        if missing:
            print("⚠️  Warning: The following credential files are missing:")
            for item in missing:
                print(f"   - {item}")
            print("\nThe application may not function correctly without these files.")
            print("Please ensure all credentials are in place before deployment.\n")
    
    @classmethod
    def print_config(cls) -> None:
        """Print current configuration (for debugging)."""
        print("=" * 60)
        print("OCR-RAG System Configuration")
        print("=" * 60)
        print(f"Environment: {cls.ENVIRONMENT}")
        print(f"Host: {cls.HOST}:{cls.PORT}")
        print(f"Tesseract Data: {cls.TESSDATA_PREFIX or 'Auto-detect'}")
        print(f"Google Sheets ID: {cls.GOOGLE_SHEETS_ID}")
        print(f"OAuth Configured: {bool(cls.GOOGLE_OAUTH_CLIENT_ID)}")
        print("=" * 60)

# Create a singleton instance
config = Config()

if __name__ != "__main__":
    config.validate()
