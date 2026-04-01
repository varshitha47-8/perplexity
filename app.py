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

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Simple RAG: Inject document text if requested and available
        prompt = user_message
        if use_context and current_doc_text:
            prompt = f"Using the following document context, answer the user's question.\n\nDOCUMENT CONTEXT:\n{current_doc_text}\n\nUSER QUESTION: {user_message}"

        # Create chat session with history
        # Note: Gemini 2.5 Flash usage via google-genai SDK
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
