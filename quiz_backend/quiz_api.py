from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from quiz_store import add_quiz, get_quizzes, get_quiz, update_quiz, add_submission, get_submissions, get_user_submission, delete_quiz
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://studysync-3435a.web.app"])

@app.route('/quiz/create', methods=['POST'])
def create_quiz():
    data = request.json
    quiz = {
        'group_id': data.get('group_id'),
        'title': data.get('title', 'Untitled Quiz'),
        'questions': data.get('questions', []),
        'timer': data.get('timer', 60),
        'status': 'created',
        'created_by': data.get('created_by'),
        'start_time': None
    }
    quiz = add_quiz(quiz)
    return jsonify({'success': True, 'quizId': quiz['id']})

@app.route('/quiz/list', methods=['GET'])
def list_quizzes():
    group_id = request.args.get('group_id')
    quizzes = get_quizzes(group_id)
    return jsonify({'quizzes': quizzes})

@app.route('/quiz/start', methods=['POST'])
def start_quiz():
    data = request.json
    quiz_id = data.get('quiz_id')
    quiz = get_quiz(quiz_id)
    if not quiz:
        return jsonify({'success': False, 'error': 'Quiz not found'}), 404
    if quiz['status'] == 'started':
        return jsonify({'success': False, 'error': 'Quiz already started'}), 400
    update_quiz(quiz_id, {'status': 'started', 'start_time': datetime.utcnow().isoformat() + 'Z'})
    return jsonify({'success': True})

@app.route('/quiz/submit', methods=['POST'])
def submit_answers():
    data = request.json
    quiz_id = data.get('quiz_id')
    user_id = data.get('user_id')
    answers = data.get('answers', [])
    quiz = get_quiz(quiz_id)
    if not quiz:
        return jsonify({'success': False, 'error': 'Quiz not found'}), 404
    if quiz['status'] != 'started':
        return jsonify({'success': False, 'error': 'Quiz not started'}), 400
    if get_user_submission(quiz_id, user_id):
        return jsonify({'success': False, 'error': 'Already submitted'}), 400
    # Calculate score
    score = 0
    for i, q in enumerate(quiz['questions']):
        if i < len(answers) and answers[i] == q['answer']:
            score += 1
    submission = {
        'quiz_id': quiz_id,
        'user_id': user_id,
        'answers': answers,
        'score': score,
        'submitted_at': datetime.utcnow().isoformat() + 'Z'
    }
    add_submission(submission)
    return jsonify({'success': True, 'score': score})

@app.route('/quiz/leaderboard', methods=['GET'])
def quiz_leaderboard():
    quiz_id = request.args.get('quiz_id', type=int)
    submissions = get_submissions(quiz_id)
    leaderboard = sorted([
        {'user_id': s['user_id'], 'score': s['score'], 'submitted_at': s['submitted_at']}
        for s in submissions
    ], key=lambda x: (-x['score'], x['submitted_at']))
    return jsonify({'leaderboard': leaderboard})

@app.route('/quiz/delete', methods=['POST'])
def delete_quiz_api():
    data = request.json
    quiz_id = data.get('quiz_id')
    if not quiz_id:
        return jsonify({'success': False, 'error': 'quiz_id required'}), 400
    deleted = delete_quiz(quiz_id)
    if deleted:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Quiz not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get("QUIZ_PORT", 5002))
    app.run(debug=True, host="0.0.0.0", port=port) 