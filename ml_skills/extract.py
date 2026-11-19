import os
import textract
import spacy
from .utils import extract_skills

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

def extract_text(file_path):
    """
    Extracts raw text from a PDF or DOCX file using textract.
    """
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in ['.pdf', '.docx']:
            raise ValueError(f"Unsupported file type: {ext}")
        text = textract.process(file_path)
        return text.decode('utf-8')
    except Exception as e:
        print(f"[ERROR] Failed to extract text from {file_path}: {e}")
        return ""

def extract_skills_from_text(text):
    """
    Extracts skills from a block of text using spaCy and the predefined skill list.
    """
    doc = nlp(text)
    noun_chunks = list(doc.noun_chunks)
    skills = extract_skills(nlp, noun_chunks)
    return skills

# Optional: CLI testing
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python -m ml_skills.extract <resume_file>")
        exit()

    file_path = sys.argv[1]
    resume_text = extract_text(file_path)
    if resume_text:
        skills = extract_skills_from_text(resume_text)
        print({ "skills": skills })
    else:
        print({ "skills": [] })
