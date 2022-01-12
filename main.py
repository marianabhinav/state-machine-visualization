import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:8001",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

main_path = Path(__file__).resolve().parent
static_folder_path = Path('visualization/static')
public_folder_path = Path('visualization/public/.')

app.mount("/static", StaticFiles(directory=os.path.join(main_path, static_folder_path)), name="static")

template = Jinja2Templates(directory=os.path.join(main_path, public_folder_path))


@app.get('/')
def home(request: Request):
    return template.TemplateResponse('index.html', {"request": request})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
