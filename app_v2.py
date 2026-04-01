import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv
import PyPDF2
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Global store for current document text (simplified RAG)
current_doc_text = ""
current_doc_name = ""

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    global current_doc_text, current_doc_name
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Extract text from PDF
            text = ""
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            
            current_doc_text = text
            current_doc_name = filename
            return jsonify({
                "message": f"Successfully uploaded {filename}",
                "filename": filename,
                "text_length": len(text)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Invalid file type. Only PDFs are allowed."}), 400

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        history = data.get('history', [])
        use_context = data.get('use_context', False)
        focus = data.get('focus', 'all')
        model_id = data.get('model', 'gemini-1.5-flash')

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Adjust system prompt based on focus
        system_prompt = "You are a helpful AI assistant."
        if focus == 'academic':
            system_prompt = "You are an Academic Assistant. Provide highly technical, accurate responses. Focus on peer-reviewed styles and structured data."
        elif focus == 'writing':
            system_prompt = "You are a Writing Assistant. Focus on creative flow, grammar, and style. Avoid listing facts unless asked; prioritize elegant prose."
        elif focus == 'social':
            system_prompt = "You are a Social Trends Assistant. Provide perspectives that reflect community discussions (e.g., Reddit, X). Be informal but informative."

        full_prompt = f"{system_prompt}\n\nUSER QUESTION: {user_message}"
        
        if use_context and current_doc_text:
            full_prompt = f"{system_prompt}\n\nUsing the following document context, answer the user's question.\n\nDOCUMENT CONTEXT:\n{current_doc_text}\n\nUSER QUESTION: {user_message}"

        # Improved logic: Try multiple available models to bypass quota limits
        models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-3.1-flash-live-preview"]
        if "pro" in model_id.lower():
            models_to_try = ["gemini-1.5-pro"] + models_to_try
            
        success = False
        last_error = ""
        for m in models_to_try:
            try:
                print(f"Attempting to use model: {m}")
                response = client.models.generate_content(
                    model=m,
                    contents=full_prompt
                )
                success = True
                break
            except Exception as e:
                last_error = str(e)
                print(f"Model {m} failed: {last_error}")
                continue

        if not success:
            return jsonify({"error": f"All models failed. Last error: {last_error}"}), 500

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
