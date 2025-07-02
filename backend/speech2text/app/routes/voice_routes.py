from flask import Blueprint, request, jsonify
import whisper
import os
from werkzeug.utils import secure_filename
import logging

voice_bp = Blueprint('voice', __name__)
model = whisper.load_model("base")  # or "tiny" if slow

UPLOAD_FOLDER = 'uploads/voice'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@voice_bp.route('/upload_audio', methods=['POST'])
def upload_audio():
    try:
        if 'file' not in request.files:
            logger.error('No file part in request')
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            logger.error('No file selected')
            return jsonify({'error': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            logger.info(f'File saved to {filepath}')

            result = model.transcribe(filepath)
            logger.info(f'Transcription result: {result["text"]}')
            return jsonify({'transcription': result['text']})

        logger.error('Invalid file type')
        return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        logger.exception('Error during audio upload or transcription')
        return jsonify({'error': str(e)}), 500
