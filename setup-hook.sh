#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Run this ONCE on the AWS server to install the auto-update hook:
#   bash setup-hook.sh
#
# After that, every  git pull  will automatically bump the
# service worker cache version — no manual steps needed.
# ─────────────────────────────────────────────────────────────

HOOK_FILE=".git/hooks/post-merge"

cat > "$HOOK_FILE" << 'HOOK'
#!/bin/bash
# post-merge hook — runs automatically after every successful git pull
# Bumps the BUILD_DATE in service-worker.js so the SW cache busts

SW="service-worker.js"
if [ ! -f "$SW" ]; then exit 0; fi

# New version = timestamp + short commit hash
NEW_VERSION=$(date +%Y%m%d%H%M)-$(git rev-parse --short HEAD)

# Replace the BUILD_DATE line in-place
sed -i "s/const BUILD_DATE = '[^']*';/const BUILD_DATE = '${NEW_VERSION}';/" "$SW"

echo "✅ Service worker cache version bumped to: $NEW_VERSION"
HOOK

chmod +x "$HOOK_FILE"
echo "✅ post-merge hook installed at $HOOK_FILE"
echo "   Every 'git pull' will now auto-bump the SW cache version."
