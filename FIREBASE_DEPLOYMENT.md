# Firebase Deployment Guide for StudySync

## Prerequisites

1. **Node.js and npm** - Already installed
2. **Firebase CLI** - Need to install
3. **Firebase Project** - Already configured (studysync-3435a)

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication. Use the same Google account that owns your Firebase project.

## Step 3: Initialize Firebase (if needed)

If you haven't initialized Firebase in this project before:

```bash
firebase init hosting
```

When prompted:
- Select your project: `studysync-3435a`
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Overwrite index.html: `No`

## Step 4: Build and Deploy

### Option 1: Build and Deploy in one command
```bash
npm run deploy
```

### Option 2: Build and Deploy separately
```bash
# Build the project
npm run build

# Deploy to Firebase
npm run deploy:hosting
```

## Step 5: Verify Deployment

After successful deployment, you'll see a URL like:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/studysync-3435a/overview
Hosting URL: https://studysync-3435a.web.app
```

## Important Notes

### Environment Variables
If your app uses environment variables, you'll need to configure them in Firebase:

1. Go to Firebase Console → Project Settings → Environment Configuration
2. Add your environment variables there

### Backend Services
This deployment is for the frontend only. Your backend services (video call server, speech2text, etc.) will need separate deployment:

- **Video Call Server**: Consider deploying to Heroku, Railway, or similar
- **Speech2Text Service**: Deploy to a cloud service that supports Python
- **PeerJS Server**: Deploy to a Node.js hosting service

### CORS Configuration
Make sure your backend services allow requests from your Firebase domain:
- `https://studysync-3435a.web.app`
- `https://studysync-3435a.firebaseapp.com`

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check that all dependencies are installed
   ```bash
   npm install
   ```

2. **Firebase CLI not found**: Reinstall Firebase CLI
   ```bash
   npm uninstall -g firebase-tools
   npm install -g firebase-tools
   ```

3. **Permission Errors**: Make sure you're logged in with the correct account
   ```bash
   firebase logout
   firebase login
   ```

4. **Project not found**: Verify your project ID in `.firebaserc`

## Continuous Deployment

For automatic deployments, consider setting up GitHub Actions:

1. Create `.github/workflows/firebase-deploy.yml`
2. Configure GitHub Secrets for Firebase token
3. Deploy automatically on push to main branch

## Security Rules

Don't forget to configure Firestore security rules in the Firebase Console to protect your data.

## Performance Optimization

The current configuration includes:
- Static asset caching (1 year for JS/CSS files)
- SPA routing support
- Proper build optimization via Vite

Your app should be fast and optimized for production! 