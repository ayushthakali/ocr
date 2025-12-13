"""
Google OAuth Service for handling OAuth 2.0 flow.
Manages token generation, exchange, refresh, and encryption.
"""
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from cryptography.fernet import Fernet
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import base64


class GoogleOAuthService:
    """Handles Google OAuth 2.0 authentication flow"""
    
    # OAuth scopes required for Google Sheets and Drive
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
    ]
    
    def __init__(self):
        """Initialize OAuth service with credentials from environment"""
        self.client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_OAUTH_REDIRECT_URI', 'http://localhost:8000/api/sheets/oauth/callback')
        
        # Encryption key for storing tokens
        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            # Generate a key if not provided (for development only)
            encryption_key = Fernet.generate_key().decode()
            print(f"⚠️ Generated encryption key: {encryption_key}")
            print("⚠️ Add this to your .env file as ENCRYPTION_KEY")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        
        if not self.client_id or not self.client_secret:
            print("⚠️ Google OAuth credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env")
    
    def get_authorization_url(self, state: str = None) -> str:
        """
        Generate OAuth authorization URL for user to visit.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            Authorization URL string
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("OAuth credentials not configured")
        
        # Create OAuth flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        # Generate authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',  # Request refresh token
            include_granted_scopes='true',
            prompt='consent',  # Force consent screen to get refresh token
            state=state
        )
        
        return auth_url
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, any]:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            code: Authorization code from OAuth callback
            
        Returns:
            Dictionary with tokens and expiry information
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("OAuth credentials not configured")
        
        # Create OAuth flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        # Exchange code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Calculate token expiry
        expiry = datetime.utcnow() + timedelta(seconds=credentials.expiry.timestamp() - datetime.utcnow().timestamp() if credentials.expiry else 3600)
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_expiry': expiry,
            'scopes': credentials.scopes
        }
    
    def refresh_access_token(self, refresh_token: str) -> Tuple[str, datetime]:
        """
        Refresh an expired access token using refresh token.
        
        Args:
            refresh_token: The refresh token
            
        Returns:
            Tuple of (new_access_token, new_expiry)
        """
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.SCOPES
        )
        
        # Refresh the token
        from google.auth.transport.requests import Request
        credentials.refresh(Request())
        
        # Calculate new expiry
        expiry = datetime.utcnow() + timedelta(seconds=3600)  # Tokens typically valid for 1 hour
        
        return credentials.token, expiry
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt a token for storage"""
        if not token:
            return None
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a stored token"""
        if not encrypted_token:
            return None
        return self.cipher.decrypt(encrypted_token.encode()).decode()
    
    def get_user_spreadsheets(self, access_token: str) -> list:
        """
        Get list of user's Google Sheets spreadsheets.
        
        Args:
            access_token: Valid OAuth access token
            
        Returns:
            List of spreadsheet dictionaries with id and name
        """
        credentials = Credentials(token=access_token)
        service = build('drive', 'v3', credentials=credentials)
        
        # Query for Google Sheets files
        results = service.files().list(
            q="mimeType='application/vnd.google-apps.spreadsheet'",
            pageSize=50,
            fields="files(id, name, createdTime)"
        ).execute()
        
        files = results.get('files', [])
        return [{'id': f['id'], 'name': f['name'], 'created': f.get('createdTime')} for f in files]
    
    def create_spreadsheet(self, access_token: str, title: str) -> Dict[str, str]:
        """
        Create a new Google Sheets spreadsheet for the user.
        
        Args:
            access_token: Valid OAuth access token
            title: Name for the new spreadsheet
            
        Returns:
            Dictionary with spreadsheet_id and spreadsheet_url
        """
        credentials = Credentials(token=access_token)
        service = build('sheets', 'v4', credentials=credentials)
        
        # Create spreadsheet with initial sheets
        spreadsheet_body = {
            'properties': {
                'title': title
            },
            'sheets': [
                {'properties': {'title': 'Purchase'}},
                {'properties': {'title': 'Sales'}},
                {'properties': {'title': 'Other'}}
            ]
        }
        
        spreadsheet = service.spreadsheets().create(body=spreadsheet_body).execute()
        
        # Add headers to each sheet
        requests = []
        for sheet_name in ['Purchase', 'Sales', 'Other']:
            requests.append({
                'appendCells': {
                    'sheetId': next(s['properties']['sheetId'] for s in spreadsheet['sheets'] if s['properties']['title'] == sheet_name),
                    'rows': [{
                        'values': [
                            {'userEnteredValue': {'stringValue': 'Date'}},
                            {'userEnteredValue': {'stringValue': 'Type'}},
                            {'userEnteredValue': {'stringValue': 'Description'}},
                            {'userEnteredValue': {'stringValue': 'Total Amount'}},
                            {'userEnteredValue': {'stringValue': 'Document Key'}}
                        ]
                    }],
                    'fields': 'userEnteredValue'
                }
            })
        
        # Apply header formatting
        if requests:
            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet['spreadsheetId'],
                body={'requests': requests}
            ).execute()
        
        return {
            'spreadsheet_id': spreadsheet['spreadsheetId'],
            'spreadsheet_url': spreadsheet['spreadsheetUrl'],
            'spreadsheet_name': title
        } 

    
