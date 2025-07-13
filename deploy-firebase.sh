#!/bin/bash

echo "========================================"
echo "StudySync Firebase Deployment Script"
echo "========================================"
echo

echo "Checking if Firebase CLI is installed..."
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo "Failed to install Firebase CLI"
        exit 1
    fi
fi

echo
echo "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo
echo "Deploying to Firebase..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "Deployment failed!"
    exit 1
fi

echo
echo "========================================"
echo "Deployment completed successfully!"
echo "========================================"
echo
echo "Your app is now live at:"
echo "https://studysync-3435a.web.app"
echo 