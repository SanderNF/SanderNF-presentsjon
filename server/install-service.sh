#!/usr/bin/env bash
# Install snf-server as a systemd service that starts on boot (Linux).
#
#   ./server/install-service.sh [--port N] [--host ADDR] [--root DIR] [--name NAME] [--dry-run]
#   ./server/install-service.sh --uninstall [--name NAME]
#
# Run it as your normal user: it builds the release binary with your Rust toolchain, then
# re-runs itself with sudo to install. The service runs as you (not root), so it can read
# the site files in your home folder. Run it again after changes to update and restart.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

NAME="snf-server"
PORT=8000
HOST="0.0.0.0"
ROOT="$REPO_DIR"
UNINSTALL=0
DRY_RUN=0
SKIP_BUILD=0

usage() {
  sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
  cat <<EOF

options:
  --port N        port to serve on (default: $PORT)
  --host ADDR     address to listen on (default: $HOST = all interfaces)
  --root DIR      folder to serve (default: the repo, $REPO_DIR)
  --name NAME     service name (default: $NAME)
  --dry-run       print the systemd unit and exit, change nothing
  --uninstall     stop, disable and remove the service and its binary
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="${2:?--port needs a value}"; shift 2 ;;
    --host) HOST="${2:?--host needs a value}"; shift 2 ;;
    --root) ROOT="${2:?--root needs a value}"; shift 2 ;;
    --name) NAME="${2:?--name needs a value}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;; # used internally when re-running with sudo
    -h|--help) usage; exit 0 ;;
    *) echo "error: unknown option '$1'" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || { echo "error: --port must be 1-65535" >&2; exit 2; }
[[ "$NAME" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "error: --name may only use letters, digits, '.', '_' and '-'" >&2; exit 2; }
ROOT="$(cd "$ROOT" 2>/dev/null && pwd)" || { echo "error: --root folder doesn't exist" >&2; exit 2; }

UNIT_PATH="/etc/systemd/system/$NAME.service"
BIN_PATH="/usr/local/bin/$NAME"
BUILT_BIN="$SCRIPT_DIR/target/release/snf-server"

# the account the service runs as: whoever ran the script (before sudo)
RUN_USER="${SUDO_USER:-$(id -un)}"
RUN_GROUP="$(id -gn "$RUN_USER")"

unit_file() {
  local caps=""
  # ports below 1024 normally need root; grant just that one capability instead
  if (( PORT < 1024 )); then
    caps=$'AmbientCapabilities=CAP_NET_BIND_SERVICE\nCapabilityBoundingSet=CAP_NET_BIND_SERVICE'
  else
    caps="CapabilityBoundingSet="
  fi
  cat <<EOF
[Unit]
Description=snf-server: portfolio site ($ROOT)
Documentation=file://${REPO_DIR// /%20}/README.md
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
ExecStart=$BIN_PATH --root "$ROOT" --host $HOST --port $PORT
Restart=on-failure
RestartSec=2

# hardening: the server only needs to read the site folder and open a port
$caps
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadOnlyPaths="$ROOT"
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
ProtectClock=true
ProtectHostname=true
RestrictAddressFamilies=AF_INET AF_INET6
RestrictNamespaces=true
RestrictRealtime=true
LockPersonality=true
MemoryDenyWriteExecute=true
SystemCallArchitectures=native

[Install]
WantedBy=multi-user.target
EOF
}

if (( DRY_RUN )); then
  echo "# would install $BIN_PATH and $UNIT_PATH (running as $RUN_USER:$RUN_GROUP)"
  unit_file
  exit 0
fi

command -v systemctl >/dev/null || { echo "error: systemd (systemctl) not found. this script is for Linux with systemd" >&2; exit 1; }

# ---------- uninstall ----------
if (( UNINSTALL )); then
  if (( EUID != 0 )); then exec sudo "$0" --uninstall --name "$NAME"; fi
  systemctl disable --now "$NAME.service" 2>/dev/null || true
  rm -f "$UNIT_PATH" "$BIN_PATH"
  systemctl daemon-reload
  echo "removed $NAME (service, unit file and binary)"
  exit 0
fi

# ---------- build (as the normal user), then re-run with sudo ----------
if (( EUID != 0 )); then
  if (( ! SKIP_BUILD )); then
    command -v cargo >/dev/null || { echo "error: cargo not found. install Rust from https://rustup.rs first" >&2; exit 1; }
    echo "building release binary…"
    cargo build --release --manifest-path "$SCRIPT_DIR/Cargo.toml"
  fi
  exec sudo "$0" --skip-build --port "$PORT" --host "$HOST" --root "$ROOT" --name "$NAME"
fi

[[ -x "$BUILT_BIN" ]] || { echo "error: $BUILT_BIN not found. run this script as your normal user (not with sudo) so it can build first" >&2; exit 1; }
[[ "$RUN_USER" != "root" ]] || echo "warning: the service will run as root. run the script as a normal user to avoid that" >&2

# ---------- install ----------
install -m 0755 "$BUILT_BIN" "$BIN_PATH"
unit_file > "$UNIT_PATH"
chmod 0644 "$UNIT_PATH"
systemctl daemon-reload
systemctl enable "$NAME.service" >/dev/null
systemctl restart "$NAME.service"

sleep 1
if systemctl is-active --quiet "$NAME.service"; then
  echo "✓ $NAME is running and will start on boot"
  echo "  site:     http://$( [[ "$HOST" == "0.0.0.0" ]] && echo localhost || echo "$HOST" ):$PORT  (serving $ROOT as $RUN_USER)"
  echo "  logs:     journalctl -u $NAME -f"
  echo "  status:   systemctl status $NAME"
  echo "  restart:  sudo systemctl restart $NAME"
  echo "  remove:   $0 --uninstall"
else
  echo "✗ $NAME failed to start. last log lines:" >&2
  journalctl -u "$NAME" -n 20 --no-pager >&2 || true
  exit 1
fi
