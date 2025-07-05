from flask_cors import CORS
from flask import Flask, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from summarize import extract_text_from_pdf, extract_text_from_docx, extract_text_from_image, summarize_text
from summary_store import add_summary, get_summaries

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'}

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/summarize', methods=['POST'])
def summarize_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    user_id = request.form.get('user_id')
    group_id = request.form.get('group_id')
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.pdf':
            text = extract_text_from_pdf(file_path)
        elif ext == '.docx':
            text = extract_text_from_docx(file_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
            text = extract_text_from_image(file_path)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        summary = summarize_text(text)
        add_summary(summary, user_id, group_id, filename)
        return jsonify({'summary': summary, 'filename': filename})
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/summaries', methods=['GET'])
def fetch_summaries():
    group_id = request.args.get('groupId')
    user_id = request.args.get('userId')
    summaries = get_summaries(group_id=group_id, user_id=user_id)
    return jsonify({'summaries': summaries})

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 