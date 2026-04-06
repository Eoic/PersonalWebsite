#!/usr/bin/env sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root."
  exit 1
fi

APP_ROOT=/opt/website
SERVICE_NAME=website
WEBSITE_USER=website
SYSTEMD_UNIT=/etc/systemd/system/website.service
CADDY_BIN=/usr/bin/caddy
CADDY_CONFIG=/etc/caddy/Caddyfile
CADDY_SITE_DIR=/etc/caddy/sites
CADDY_SITE_FILE="$CADDY_SITE_DIR/karolis-strazdas.lt.caddy"

if [ -x /usr/local/bin/uv ]; then
  UV_BIN=/usr/local/bin/uv
else
  UV_BIN="$(command -v uv || true)"
fi

id -u "$WEBSITE_USER" >/dev/null 2>&1 || {
  echo "The deploy host must have a $WEBSITE_USER user."
  exit 1
}

[ -n "$UV_BIN" ] || {
  echo "uv is required on the deploy host."
  exit 1
}

su -s /bin/sh -c "'$UV_BIN' --version >/dev/null" "$WEBSITE_USER" || {
  echo "uv must be installed in a system-wide location accessible to the $WEBSITE_USER user."
  exit 1
}

"$UV_BIN" python find --no-python-downloads '>=3.14' >/dev/null || {
  echo "Python 3.14+ is required on the deploy host."
  exit 1
}

cp "$APP_ROOT/website.service" "$SYSTEMD_UNIT"
install -d -o "$WEBSITE_USER" -g "$WEBSITE_USER" "$APP_ROOT"
install -d -o "$WEBSITE_USER" -g "$WEBSITE_USER" "$APP_ROOT/data"
chown -R "$WEBSITE_USER:$WEBSITE_USER" "$APP_ROOT/data"

su -s /bin/sh -c "cd '$APP_ROOT' && '$UV_BIN' sync --locked --no-python-downloads" "$WEBSITE_USER"
su -s /bin/sh -c "cd '$APP_ROOT' && '$UV_BIN' run python -m app.build_assets" "$WEBSITE_USER"

systemctl daemon-reload

if [ -x "$CADDY_BIN" ]; then
  install -d "$CADDY_SITE_DIR"
  install -m 644 "$APP_ROOT/deploy/caddy/Caddyfile" "$CADDY_CONFIG"
  install -m 644 "$APP_ROOT/deploy/caddy/sites/karolis-strazdas.lt.caddy" "$CADDY_SITE_FILE"
  "$CADDY_BIN" validate --config "$CADDY_CONFIG"
  systemctl enable caddy
fi

systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

if [ -x "$CADDY_BIN" ]; then
  systemctl reload caddy || systemctl restart caddy
fi
