import textract
import os

# List of skills — you can load from a CSV instead if needed
DEFAULT_SKILLS = {
    # Core Programming
    "python", "java", "c++", "c", "sql",

    # Frontend
    "html", "css", "javascript", "typescript", "react", "next.js",
    "vue", "vue.js", "angular", "svelte", "jquery", "bootstrap",
    "tailwind css", "material ui", "redux", "zustand", "framer motion",
    "vite", "webpack", "parcel", "sass", "less", "pug", "ejs", "handlebars",

    # Backend
    "node.js", "express.js", "django", "flask", "fastapi", "php", "laravel",
    "ruby on rails", "spring boot", "asp.net", "koa", "hapi", "nest.js", "adonis.js",

    # Databases
    "mongodb", "mysql", "postgresql", "sqlite", "mariadb", "firebase",
    "redis", "supabase", "prisma", "mongoose",

    # APIs & Protocols
    "rest api", "graphql", "websockets", "json", "soap", "grpc",
    "axios", "fetch api", "openapi", "postman",

    # Auth & Security
    "jwt", "oauth", "bcrypt", "passport.js", "auth0", "csrf", "cors", "helmet.js",

    # Testing
    "jest", "mocha", "chai", "cypress", "playwright", "selenium", "enzyme", "vitest",

    # DevOps / Deployment
    "docker", "kubernetes", "nginx", "aws", "azure", "gcp", "vercel", "netlify",
    "heroku", "render", "digitalocean", "jenkins", "github actions", "travis ci", "circleci",

    # Tools / Misc
    "git", "github", "gitlab", "bitbucket", "vscode", "swagger", "npm", "yarn", "pnpm",

    # AI/ML
    "machine learning", "deep learning", "data science", "data analysis",

    # Soft Skills
    "communication", "leadership", "problem solving", "teamwork", "debugging",
    "documentation", "code review", "agile", "scrum"
}



def extract_text(file_path, extension=None):
    """
    Extracts raw text from a PDF or DOCX/DOC file using textract.
    """
    try:
        if extension is None:
            _, extension = os.path.splitext(file_path)

        extension = extension.lower()
        if extension not in ['.pdf', '.docx', '.doc']:
            raise ValueError(f"Unsupported file extension: {extension}")

        text = textract.process(file_path)
        return text.decode('utf-8')
    except Exception as e:
        print(f"[ERROR] Failed to extract text from {file_path}: {e}")
        return ""


def extract_skills(nlp, noun_chunks, skills_file=None):
    """
    Extracts matching skills from noun chunks using a skill set.
    """
    skills_set = DEFAULT_SKILLS.copy()

    # Optional: Load additional skills from CSV
    if skills_file and os.path.exists(skills_file):
        try:
            with open(skills_file, 'r', encoding='utf-8') as f:
                for line in f:
                    skills_set.add(line.strip().lower())
        except Exception as e:
            print(f"[WARNING] Couldn't load skills from file: {e}")

    extracted = set()

    for chunk in noun_chunks:
        text = chunk.text.strip().lower()
        if text in skills_set:
            extracted.add(text)

    return list(extracted)
