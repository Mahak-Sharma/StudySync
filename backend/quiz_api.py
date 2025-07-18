from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://studysync-3435a.web.app"])

@app.route('/quiz/create', methods=['POST'])
def create_quiz():
    # TODO: Implement quiz creation logic
    return jsonify({'success': True, 'quizId': 'placeholder'})

@app.route('/quiz/list', methods=['GET'])
def list_quizzes():
    # TODO: Implement fetch quizzes for a group
    return jsonify({'quizzes': []})

@app.route('/quiz/start', methods=['POST'])
def start_quiz():
    # TODO: Implement quiz start logic
    return jsonify({'success': True})

@app.route('/quiz/submit', methods=['POST'])
def submit_answers():
    # TODO: Implement answer submission
    return jsonify({'success': True})

@app.route('/quiz/leaderboard', methods=['GET'])
def quiz_leaderboard():
    # TODO: Implement leaderboard fetch
    return jsonify({'leaderboard': []})

if __name__ == '__main__':
    port = int(os.environ.get("QUIZ_PORT", 5002))
    app.run(debug=True, host="0.0.0.0", port=port) 