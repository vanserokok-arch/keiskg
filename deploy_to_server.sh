#!/usr/bin/env bash
set -euo pipefail

# Deploy helper script — run locally. It will:
#  - create archive (if missing)
#  - scp archive to remote /root/
#  - backup three files on the server
#  - extract archive into WEBROOT (replace files)
#  - set ownership and permissions
#  - test nginx config and reload services
#  - run a curl POST test against telegram endpoint and print result
#  - print md5sums for local/remote styles.css for quick verification

# Defaults (edit or override as env vars)
SSH_USER=${SSH_USER:-root}
HOST=${HOST:-213.171.12.99}
WEBROOT=${WEBROOT:-/var/www/keis-legalgroup}
ARCHIVE=${ARCHIVE:-keis_patch_20251231_1.tgz}
REMOTE_ARCHIVE=/root/${ARCHIVE}
BACKUP_DIR=/root/keis_backups
LOCAL_PROJECT_DIR=$(pwd)
HTTP_TEST_URL=${HTTP_TEST_URL:-https://keis-legalgroup.ru/fraud/api/telegram.php}
WEB_OWNER=${WEB_OWNER:-www-data}
PHP_FPM_SERVICES=(php8.1-fpm php8.0-fpm php8.2-fpm php7.4-fpm php-fpm)

echo "Deploy script starting"
echo "SSH: ${SSH_USER}@${HOST}"
echo "WEBROOT: ${WEBROOT}"

action_confirm() {
  read -rp "About to deploy local changes to ${SSH_USER}@${HOST}:${WEBROOT}. Continue? [y/N] " yn
  case "$yn" in
    [Yy]*) return 0;;
    *) echo "Aborted by user."; exit 1;;
  esac
}

action_confirm

# 1) ensure archive exists locally, otherwise create it from known files
if [[ ! -f "${ARCHIVE}" ]]; then
  echo "Archive ${ARCHIVE} not found locally — creating from known files..."
  tar -czf "${ARCHIVE}" fraud/styles.css fraud/script.js fraud/api/telegram.php
  echo "Archive created: ${ARCHIVE}"
else
  echo "Archive present: ${ARCHIVE}"
fi

# compute local md5 for styles.css
LOCAL_MD5=$(md5sum "$LOCAL_PROJECT_DIR/fraud/styles.css" | awk '{print $1}') || true

echo "Copying archive to remote: ${SSH_USER}@${HOST}:${REMOTE_ARCHIVE}"
scp -q "${ARCHIVE}" "${SSH_USER}@${HOST}:/root/" || { echo "scp failed"; exit 2; }

echo "Running remote deployment steps over SSH..."
ssh "${SSH_USER}@${HOST}" bash -s <<EOF
set -euo pipefail
WEBROOT=${WEBROOT}
ARCHIVE=${REMOTE_ARCHIVE}
BACKUP_DIR=${BACKUP_DIR}
WEB_OWNER=${WEB_OWNER}

mkdir -p "\$BACKUP_DIR"
# Backup existing files (if present)
echo "Creating backup of existing files to \\$BACKUP_DIR"
# Only add files which exist to the tar to avoid errors
FILES_TO_BACKUP=("\$WEBROOT/fraud/styles.css" "\$WEBROOT/fraud/script.js" "\$WEBROOT/fraud/api/telegram.php")
TMP_BACKUP_LIST=
for f in "\${FILES_TO_BACKUP[@]}"; do
  if [[ -e "\$f" ]]; then
    TMP_BACKUP_LIST+=" \"\$f\""
  fi
done
if [[ -n "\$TMP_BACKUP_LIST" ]]; then
  eval "tar -czf \"\$BACKUP_DIR/keis_before_\$(date +%Y%m%d_%H%M%S).tgz\" $TMP_BACKUP_LIST"
  echo "Backup created"
else
  echo "No existing target files found to backup"
fi

# Extract archive into webroot
if [[ -f "\$ARCHIVE" ]]; then
  echo "Extracting archive into \$WEBROOT"
  tar -xzf "\$ARCHIVE" -C "\$WEBROOT"
else
  echo "Archive not found at \$ARCHIVE"; exit 3
fi

# Ensure ownership and permissions
chown ${WEB_OWNER}:${WEB_OWNER} "\$WEBROOT/fraud/styles.css" "\$WEBROOT/fraud/script.js" "\$WEBROOT/fraud/api/telegram.php" || true
chmod 644 "\$WEBROOT/fraud/styles.css" "\$WEBROOT/fraud/script.js" || true
chmod 640 "\$WEBROOT/fraud/api/telegram.php" || true

# Fix git safe directory if needed (optional)
if [[ -d "\$WEBROOT/.git" ]]; then
  git config --global --add safe.directory "\$WEBROOT" || true
fi

# Test nginx config and reload
if nginx -t; then
  systemctl reload nginx || systemctl restart nginx || true
else
  echo "nginx config test failed — aborting before reload"; nginx -t; exit 4
fi

# Try to reload php-fpm service if present
for svc in ${PHP_FPM_SERVICES[@]:-php8.1-fpm}; do
  if systemctl list-units --full -all | grep -q "^\s*\$svc\.service"; then
    echo "Reloading \$svc"
    systemctl reload "\$svc" || true
  fi
done

# Print a small verification curl of the endpoint (server-side)
echo "Remote endpoint test (server-side):"
curl -sS -X POST -F "name=DeployCheck" -F "phone=+70000000000" -F "message=Deploy verification" https://${HOST}/fraud/api/telegram.php || true

# Show md5 of remote css
if [[ -f "\$WEBROOT/fraud/styles.css" ]]; then
  md5sum "\$WEBROOT/fraud/styles.css"
fi

# Show last lines of nginx error log if exists
if [[ -f /var/log/nginx/error.log ]]; then
  echo "-- nginx error.log tail --"
  tail -n 50 /var/log/nginx/error.log || true
fi

EOF

# After remote steps, show local vs remote md5 (remote md5 printed above)
echo "Local styles.css md5: ${LOCAL_MD5}"

echo "Remote deployment finished. If the remote curl returned {\"ok\":true} then the telegram endpoint worked."

echo "Done."
