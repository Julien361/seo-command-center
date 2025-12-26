#!/bin/bash
cd "$(dirname "$0")/.."

# Auto-increment patch version
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
NEW_VERSION="$major.$minor.$((patch + 1))"

echo "📦 Publication v$NEW_VERSION"

# Update package.json
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Build and publish to GitHub Releases
echo "🔨 Build de l'application..."
npm run release

# Commit and push
echo "📤 Commit et push..."
git add .
git commit -m "v$NEW_VERSION - Auto-update"
git tag -f "v$NEW_VERSION"
git push && git push --tags -f

# Publish the draft release (electron-builder creates drafts by default)
echo "🚀 Publication de la release..."
gh release edit "v$NEW_VERSION" --draft=false --latest

echo "✅ Version $NEW_VERSION publiée avec auto-update !"
echo "📍 Les utilisateurs recevront automatiquement la mise à jour."
