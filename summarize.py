import os
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import docx
from transformers import pipeline

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_image(file_path):
    image = Image.open(file_path)
    return pytesseract.image_to_string(image)

def summarize_text(text, max_len=1300):
    if not text.strip():
        return "No text found for summarization."
    
    if len(text) > 1000:
        text = text[:1000] 
    
    summary = summarizer(text, max_length=130, min_length=30, do_sample=False)
    return summary[0]['summary_text']

def main():
    file_path = input("Enter the file path (.pdf, .docx, image): ").strip()

    if not os.path.exists(file_path):
        print("File not found.")
        return

    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif ext == ".docx":
        text = extract_text_from_docx(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        text = extract_text_from_image(file_path)
    else:
        print("Unsupported file format.")
        return

    print("\nExtracted Text:\n", text[:1000] + "..." if len(text) > 1000 else text)

    summary = summarize_text(text)
    print("\n--- Summary ---\n", summary)

if __name__ == "__main__":
    main()
