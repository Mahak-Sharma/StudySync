#!/bin/bash

echo "🎯 Starting StudySync - Frontend + Summarization Backend"
echo "============================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed or not in PATH"
    echo "Please install Python from https://python.org/"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install npm dependencies"
        exit 1
    fi
fi

echo "🚀 Starting all services..."
node start-dev.js 