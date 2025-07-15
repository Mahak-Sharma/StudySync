import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Load service account key from environment variable
service_account_info = json.loads(os.environ["FIREBASE_PRIVATE_KEY_ID"])
cred = credentials.Certificate(service_account_info)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

def add_summary(summary, user_id, group_id, filename):
    summary_obj = {
        'summary': summary,
        'user_id': user_id,
        'group_id': group_id,
        'filename': filename,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    db.collection('summaries').add(summary_obj)
    return summary_obj

def get_summaries(group_id=None, user_id=None, personal_only=False):
    summaries_ref = db.collection('summaries')
    query = summaries_ref
    if group_id:
        query = query.where('group_id', '==', group_id)
    if user_id:
        query = query.where('user_id', '==', user_id)
    docs = query.stream()
    summaries = [doc.to_dict() | {'id': doc.id} for doc in docs]
    if personal_only:
        summaries = [s for s in summaries if not s.get('group_id') or s.get('group_id') in [None, '', 'null']]
    return summaries

def delete_summary(summary_id):
    db.collection('summaries').document(summary_id).delete()
    return True