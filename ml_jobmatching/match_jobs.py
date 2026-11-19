import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

def compute_match(user_skills, job_skills_list):
    all_docs = [user_skills] + job_skills_list  # user first, then all jobs

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_docs)

    user_vec = tfidf_matrix[0]
    job_vecs = tfidf_matrix[1:]

    similarities = cosine_similarity(user_vec, job_vecs).flatten()
    return similarities.tolist()

# Example
if __name__ == "__main__":
    user = "python sql machine learning"
    jobs = [
        "java spring sql",
        "python machine learning data science",
        "html css javascript"
    ]
    print(json.dumps(compute_match(user, jobs)))
