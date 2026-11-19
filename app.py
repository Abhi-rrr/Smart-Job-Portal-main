from flask import Flask, request, jsonify
import os
from ml_skills.extract import extract_text, extract_skills_from_text
from flask_cors import CORS


app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return "Resume Skill Extractor API is running."

@app.route('/api/extract', methods=['POST'])
def extract_resume_skills():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file uploaded'}), 400

    resume = request.files['resume']
    
    # Save resume to a temporary location
    temp_path = os.path.join('ml_skills', 'temp_' + resume.filename)
    resume.save(temp_path)

    try:
        # Extract text and skills
        text = extract_text(temp_path)
        skills = extract_skills_from_text(text)
        return jsonify({'skills': skills})
    except Exception as e:
        return jsonify({'error': f'Failed to process resume: {str(e)}'}), 500
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(debug=True)
   