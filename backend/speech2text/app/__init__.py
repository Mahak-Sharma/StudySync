<<<<<<< HEAD
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

    return app
=======
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

    return app
>>>>>>> d21649ea8d82389029dd0da6682638e411c6433a
