from flask_cors import CORS
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
from summarize import extract_text_from_pdf, extract_text_from_docx, extract_text_from_image, extract_text_from_txt, summarize_text
from summary_store import add_summary, get_summaries, delete_summary

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'}

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://studysync-3435a.web.app"])

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
        ext = os.path.splitext(filename)[1].lower()
        
        try:
            # Process file in memory without saving to disk
            if ext == '.pdf':
                text = extract_text_from_pdf(file)
            elif ext == '.docx':
                text = extract_text_from_docx(file)
            elif ext == '.txt':
                text = extract_text_from_txt(file)
            elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
                text = extract_text_from_image(file)
            else:
                return jsonify({'error': 'Unsupported file format'}), 400
            
            # Generate summary
            summary = summarize_text(text)
            
            # Save summary to database (not the file)
            add_summary(summary, user_id, group_id, filename)
            
            return jsonify({
                'summary': summary, 
                'filename': filename,
                'message': 'File processed successfully without saving to disk'
            })
            
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
    else:
        return jsonify({'error': 'File type not allowed. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG, BMP, TIFF'}), 400

@app.route('/summaries', methods=['GET'])
def fetch_summaries():
    group_id = request.args.get('groupId')
    user_id = request.args.get('userId')
    personal_only = request.args.get('personalOnly', 'false').lower() == 'true'
    
    summaries = get_summaries(group_id=group_id, user_id=user_id, personal_only=personal_only)
    return jsonify({'summaries': summaries})

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Placeholder for file download - in a real app, you'd serve the actual file"""
    return jsonify({
        'message': 'File download endpoint',
        'filename': filename,
        'note': 'In a production app, this would serve the actual file from storage'
    }), 200

@app.route('/summaries/<int:summary_id>', methods=['DELETE'])
def delete_summary_endpoint(summary_id):
    try:
        delete_summary(summary_id)
        return jsonify({'message': 'Summary deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Error deleting summary: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=False, host="0.0.0.0", port=port)
