from flask import Flask, request, jsonify
from flask_cors import CORS

import pickle
import sys

print("Starting predict_api.py...")

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

try:
    print("Loading model...")
    model = pickle.load(open('models/rf_classifier_categorization.pkl', 'rb'))
    print("Model loaded.")

    print("Loading vectorizer...")
    vectorizer = pickle.load(open('models/tfidf_vectorizer_categorization.pkl', 'rb'))
    print("Vectorizer loaded.")

except Exception as e:
    print(f"Error while loading pickle files: {e}")
    sys.exit(1)

@app.route('/', methods=['GET'])
def home():
    return "ML Prediction API is running!"

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    vectorized = vectorizer.transform([text])
    prediction = model.predict(vectorized)[0]

    return jsonify({'category': prediction})

if __name__ == '__main__':
    print("About to run Flask app")
    app.run(port=5000, debug=True)
