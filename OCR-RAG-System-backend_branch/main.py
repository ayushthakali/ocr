from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.presentation.upload_routes import router as upload_router
from app.presentation.csv_routes import router as csv_router
from app.presentation.search_routes import router as search_router
from app.presentation.chat_routes import router as chat_router
from app.presentation.sheet_routes import router as sheet_router



from fastapi.middleware.cors import CORSMiddleware

from app.config.config import config

config.print_config()

app = FastAPI(title="OCR RAG System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount media folder to serve uploaded images
app.mount("/media", StaticFiles(directory="media"), name="media")

# Mount static folder to serve HTML, CSS, JS files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include your API routes
app.include_router(sheet_router)  
app.include_router(upload_router)
app.include_router(csv_router)
app.include_router(search_router)
app.include_router(chat_router)

@app.get("/")
def home():
    return {"message": "This is a home page"}