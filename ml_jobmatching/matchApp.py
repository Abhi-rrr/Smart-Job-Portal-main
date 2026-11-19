from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return '✅ Flask Job Matching API is Running on Port 5001!'

@app.route('/match', methods=['POST'])
def match_endpoint():
    try:
        data = request.get_json()
        print("🔍 Received data:", data)
        
        user_skills = data.get("userSkills", "")
        job_skills_list = data.get("jobSkillsList", [])
        
        if not user_skills or not job_skills_list:
            return jsonify({"error": "userSkills and jobSkillsList are required"}), 400
        
        # Create corpus for TF-IDF
        corpus = job_skills_list + [user_skills]
        
        # Handle empty strings
        corpus = [text if text else "no requirements" for text in corpus]
        
        vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        vectors = vectorizer.fit_transform(corpus)
        
        # User vector is the last one
        user_vector = vectors[-1]
        job_vectors = vectors[:-1]
        
        # Calculate cosine similarity
        scores = cosine_similarity(user_vector, job_vectors)[0]
        
        print("✅ Match scores calculated:", scores.tolist())
        
        return jsonify({"matchScores": scores.tolist()})
        
    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": "Server error", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)  # Changed to 0.0.0.0