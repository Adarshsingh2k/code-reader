from fastapi import FastAPI, File, UploadFile
from transformers import RobertaTokenizer, RobertaModel
from sqlalchemy import insert
from app.database import database, files_table
import os
import torch

app = FastAPI()

# CodeBERT model setup
tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
model = RobertaModel.from_pretrained("microsoft/codebert-base")

UPLOAD_FOLDER = "uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Connect to the database when the app starts and disconnect when it stops
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/upload/")
async def upload_code(file: UploadFile = File(...)):
    # Save the uploaded file
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Read the file content
    with open(file_location, "r") as code_file:
        code_snippet = code_file.read()

    # Tokenize and analyze the code with CodeBERT
    inputs = tokenizer(code_snippet, return_tensors="pt", truncation=True, padding="max_length")
    with torch.no_grad():
        outputs = model(**inputs)

    # Placeholder analysis result
    embeddings = outputs.last_hidden_state.mean(dim=1).tolist()
    print(embeddings)

    # Create a summary or analysis output (this is a placeholder)
    analysis_result = "Generated embeddings from the code. Further processing needed."


    # Store file metadata in the database
    query = insert(files_table).values(
        filename=file.filename,
        filepath=file_location,
        content_type=file.content_type,
        size=len(code_snippet),
        analysis=analysis_result,
    )
    await database.execute(query)

    return {
        "message": f"File '{file.filename}' uploaded successfully!",
        "analysis": analysis_result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
