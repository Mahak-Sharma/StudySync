import json
import os
from threading import Lock
from datetime import datetime

QUIZ_FILE = 'quizzes.json'
lock = Lock()

def _load_data():
    if not os.path.exists(QUIZ_FILE):
        return {'quizzes': [], 'submissions': []}
    with open(QUIZ_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save_data(data):
    with open(QUIZ_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def add_quiz(quiz):
    with lock:
        data = _load_data()
        quiz['id'] = len(data['quizzes']) + 1
        data['quizzes'].append(quiz)
        _save_data(data)
        return quiz

def get_quizzes(group_id=None):
    data = _load_data()
    if group_id:
        return [q for q in data['quizzes'] if q['group_id'] == group_id]
    return data['quizzes']

def get_quiz(quiz_id):
    data = _load_data()
    for q in data['quizzes']:
        if q['id'] == quiz_id:
            return q
    return None

def update_quiz(quiz_id, updates):
    with lock:
        data = _load_data()
        for q in data['quizzes']:
            if q['id'] == quiz_id:
                q.update(updates)
                _save_data(data)
                return q
    return None

def add_submission(submission):
    with lock:
        data = _load_data()
        data['submissions'].append(submission)
        _save_data(data)
        return submission

def get_submissions(quiz_id=None):
    data = _load_data()
    if quiz_id:
        return [s for s in data['submissions'] if s['quiz_id'] == quiz_id]
    return data['submissions']

def get_user_submission(quiz_id, user_id):
    data = _load_data()
    for s in data['submissions']:
        if s['quiz_id'] == quiz_id and s['user_id'] == user_id:
            return s
    return None

def delete_quiz(quiz_id):
    with lock:
        data = _load_data()
        quiz_id = int(quiz_id)
        quizzes_before = len(data['quizzes'])
        data['quizzes'] = [q for q in data['quizzes'] if q['id'] != quiz_id]
        data['submissions'] = [s for s in data['submissions'] if s['quiz_id'] != quiz_id]
        _save_data(data)
        return len(data['quizzes']) < quizzes_before 