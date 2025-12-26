#!/bin/bash
cd "$(dirname "$0")/.."

# Auto-increment patch version
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
NEW_VERSION="$major.$minor.$((patch + 1))"

# Update package.json
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Commit, tag and push
git add .
git commit -m "v$NEW_VERSION - Auto-update"
git tag "v$NEW_VERSION"
git push && git push --tags

echo "✅ Version $NEW_VERSION publiée !"
