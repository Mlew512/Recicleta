#!/bin/bash

# This script removes legacyBehavior from Link usage and replaces <Link><a>...</a></Link> with <Link>...</Link>
# It also searches for custom type overrides for next/link and comments them out.

echo "Fixing Link usage in .tsx files..."

# Remove legacyBehavior from Link usage
find . -type f -name "*.tsx" -print0 | xargs -0 sed -i 's/legacyBehavior//g'

# Replace <Link href="..."><a ...>\(.*\)<\/a><\/Link> with <Link href="...">\1</Link>
find . -type f -name "*.tsx" -print0 | xargs -0 sed -i -E 's/<Link href="([^"]+)"[ ]*>([[:space:]]*)<a([^>]*)>([[:space:]]*)(.*)([[:space:]]*)<\/a>([[:space:]]*)<\/Link>/<Link href="\1">\5<\/Link>/g'

echo "Searching for custom type overrides for next/link..."

# Comment out any custom type overrides for next/link in types directory
find ./types -type f -name "*.ts" -print0 | xargs -0 sed -i '/declare module .next\/link./ s/^/\/\/ /'

echo "Done. Please review your code and run 'npm run build' again."