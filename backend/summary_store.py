import json
import os
from datetime import datetime
from threading import Lock

SUMMARY_FILE = 'summaries.json'
lock = Lock()

def _load_summaries():
    if not os.path.exists(SUMMARY_FILE):
        return []
    with open(SUMMARY_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save_summaries(summaries):
    with open(SUMMARY_FILE, 'w', encoding='utf-8') as f:
        json.dump(summaries, f, indent=2)

def add_summary(summary, user_id, group_id, filename):
    with lock:
        summaries = _load_summaries()
        summary_obj = {
            'id': len(summaries) + 1,
            'summary': summary,
            'user_id': user_id,
            'group_id': group_id,
            'filename': filename,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        summaries.append(summary_obj)
        _save_summaries(summaries)
        return summary_obj

def get_summaries(group_id=None, user_id=None, personal_only=False):
    summaries = _load_summaries()
    if group_id is not None:
        filtered = [s for s in summaries if s['group_id'] == group_id]
        return filtered
    if user_id is not None:
        if personal_only:
            filtered = [s for s in summaries if s['user_id'] == user_id and \
                       (s['group_id'] is None or s['group_id'] == '' or s['group_id'] == 'null')]
        else:
            filtered = [s for s in summaries if s['user_id'] == user_id]
        return filtered
    return summaries

def delete_summary(summary_id):
    with lock:
        summaries = _load_summaries()
        summaries = [s for s in summaries if s['id'] != summary_id]
        _save_summaries(summaries)
        return True