from flask import Flask
from app.routes.voice_routes import voice_bp
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config['UPLOAD_FOLDER'] = 'uploads/voice'

    app.register_blueprint(voice_bp, url_prefix='/api/voice')
    CORS(app)

    @app.route('/api/health')
    def health():
        return 'OK', 200
<<<<<<< HEAD
=======
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'speech2text'}, 200
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827

    return app
