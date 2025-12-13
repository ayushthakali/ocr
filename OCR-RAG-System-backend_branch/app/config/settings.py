import firebase_admin
from firebase_admin import credentials, db

_firebase_app = None 

def init_firebase():
    global _firebase_app

    if _firebase_app is not None:
        return db  

    try:
        cred = credentials.Certificate("app/config/serviceAccountKey.json")
        _firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://ocr-system-b3084-default-rtdb.firebaseio.com/'
            
        })
        print("Firebase Realtime Database initialized successfully!")
        return db

    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise e









 