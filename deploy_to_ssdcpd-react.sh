#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to ssdcpd-react..."

# 1. Configuration swap
echo "📝 Switching Firebase configuration to ssdcpd-react..."
cat .firebaserc_for_ssdcpd-react > .firebaserc
cat firebase_for_ssdcpd-react.json > firebase.json

# 2. Build (Optional but recommended)
echo "📦 Building the project..."
npm run build

# 3. Deploy
echo "☁️ Deploying to Firebase Hosting (ssdcpd-react)..."
firebase deploy --only hosting:ssdcpd-react

echo "✅ Deployment complete! Check https://ssdcpd-react.web.app/"
