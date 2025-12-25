#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to ssdcpd..."

# 1. Configuration swap
echo "📝 Switching Firebase configuration to ssdcpd..."
cat .firebaserc_for_ssdcpd > .firebaserc
cat firebase_for_ssdcpd.json > firebase.json

# 2. Build
echo "📦 Building the project..."
npm run build

# 3. Deploy
echo "☁️ Deploying to Firebase Hosting (ssdcpd)..."
firebase deploy --only hosting:ssdcpd

echo "✅ Deployment complete! Check https://ssdcpd.web.app/"
