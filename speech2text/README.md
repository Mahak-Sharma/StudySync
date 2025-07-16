# Speech2Text API

A simple Flask-based API for converting speech (audio files) to text using OpenAI Whisper.

## Setup

1. **Clone the repository and navigate to the project directory.**
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

```bash
python run.py
```

The server will start at `http://127.0.0.1:5000` by default.

## Health Check

To verify the server is running, visit:
```
GET http://127.0.0.1:5000/api/health
```

## Speech-to-Text Endpoint

- **URL:** `POST http://127.0.0.1:5000/api/voice/upload_audio`
- **Form field:** `file` (audio file: .mp3, .wav, .m4a)

### Example using Postman
1. Set method to `POST`.
2. Enter the URL: `http://127.0.0.1:5000/api/voice/upload_audio`
3. In the "Body" tab, select "form-data".
4. Add a key named `file`, set its type to "File", and upload your audio file.
5. Click "Send".

**Response:**
```
{
  "transcription": "your transcribed text here"
}
```

## Notes
- Supported audio formats: mp3, wav, m4a
- All uploaded files are saved to `uploads/voice/`
- Errors and transcriptions are logged for debugging 