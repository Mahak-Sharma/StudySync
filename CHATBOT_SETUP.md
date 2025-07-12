# Chatbot Setup Guide

## Overview
The StudySync chatbot uses Google's Generative AI (Gemini) to provide intelligent responses to user queries. The chatbot can help with study-related questions, explain platform features, and provide general assistance.

## Setup Instructions

### 1. Get a Google Generative AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the API Key

Create a `.env` file in the root directory of your project and add:

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the API key you copied from Google AI Studio.

### 3. Restart the Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

### With API Key (Full Functionality)
- Intelligent responses using Google's Gemini AI
- Context-aware conversations
- Study-related assistance
- Platform feature explanations

### Without API Key (Fallback Mode)
- Basic keyword-based responses
- Greetings and farewells
- Study-related information
- Platform feature descriptions

## Troubleshooting

### Chatbot Not Responding
- Check if your API key is correctly set in the `.env` file
- Ensure the environment variable name is `VITE_GEMINI_API_KEY`
- Restart the development server after adding the API key

### API Errors
- Verify your API key is valid and has sufficient quota
- Check your internet connection
- The chatbot will automatically fall back to basic responses if the API is unavailable

### Environment Variable Not Working
- Make sure the `.env` file is in the root directory
- Ensure the variable name starts with `VITE_` (required for Vite)
- Restart the development server

## Security Notes

- Never commit your API key to version control
- The `.env` file should be in your `.gitignore`
- API keys have usage limits and costs associated with them
- Consider implementing rate limiting for production use 