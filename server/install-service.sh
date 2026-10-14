#!/usr/bin/env bash
# Install snf-server as a systemd service that starts on boot (Linux).
#
#   ./server/install-service.sh [--port N] [--host ADDR] [--root DIR] [--user NAME] [--name NAME] [--dry-run]
#   ./server/install-service.sh --uninstall [--name NAME]
#
# Works as a normal user (asks for sudo when needed), with sudo, or as root.
# It builds the release binary, installs it to /usr/local/bin and enables the service.
# The service never runs as root by default: it runs as the user who ran the script, or as a
# dedicated "snf-server" system user when run directly as root. Run again to update + restart.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

NAME="snf-server"
PORT=8000
HOST="0.0.0.0"
ROOT="$REPO_DIR"
SERVICE_USER=""      # --user; empty = pick automatically (see below)
SYSTEM_USER="snf-server"
UNINSTALL=0
DRY_RUN=0
BUILT_BY_CALLER=0    # set internally when a non-root run already built and re-ran itself with sudo

usage() {
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
  cat <<EOF

options:
  --port N        port to serve on (default: $PORT)
  --host ADDR     address to listen on (default: $HOST = all interfaces)
  --root DIR      folder to serve (default: the repo, $REPO_DIR)
  --user NAME     account the service runs as (default: you, or "$SYSTEM_USER" when run as root)
  --name NAME     service name (default: $NAME)
  --dry-run       print the systemd unit and exit, change nothing
  --uninstall     stop, disable and remove the service and its binary
EOF
}

die() { echo "error: $*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="${2:?--port needs a value}"; shift 2 ;;
    --host) HOST="${2:?--host needs a value}"; shift 2 ;;
    --root) ROOT="${2:?--root needs a value}"; shift 2 ;;
    --user) SERVICE_USER="${2:?--user needs a value}"; shift 2 ;;
    --name) NAME="${2:?--name needs a value}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    --built) BUILT_BY_CALLER=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "error: unknown option '$1'" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || { echo "error: --port must be 1-65535" >&2; exit 2; }
[[ "$NAME" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "error: --name may only use letters, digits, '.', '_' and '-'" >&2; exit 2; }
[[ -z "$SERVICE_USER" || "$SERVICE_USER" =~ ^[a-z_][a-z0-9_.-]*$ ]] || { echo "error: --user isn't a valid user name" >&2; exit 2; }
ROOT="$(cd "$ROOT" 2>/dev/null && pwd)" || { echo "error: --root folder doesn't exist" >&2; exit 2; }

UNIT_PATH="/etc/systemd/system/$NAME.service"
BIN_PATH="/usr/local/bin/$NAME"
BUILT_BIN="$SCRIPT_DIR/target/release/snf-server"
MANIFEST="$SCRIPT_DIR/Cargo.toml"
# --locked builds the exact dependency versions in Cargo.lock, which support Rust 1.75+
BUILD_HELP="build failed. snf-server needs Rust 1.75 or newer (check: cargo --version). Update with rustup (https://rustup.rs), or your distro's rust/cargo packages"

# the person behind this run: the sudo caller if there is one, otherwise whoever is running it
CALLER="${SUDO_USER:-$(id -un)}"
[[ "$CALLER" == "root" ]] && CALLER=""

# account the service runs as: --user, else the caller, else a dedicated system user (never root by default)
if [[ -z "$SERVICE_USER" ]]; then
  SERVICE_USER="${CALLER:-$SYSTEM_USER}"
fi

unit_file() {
  local group caps
  group="$(id -gn "$SERVICE_USER" 2>/dev/null || echo "$SERVICE_USER")"
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
User=$SERVICE_USER
Group=$group
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
  echo "# would install $BIN_PATH and $UNIT_PATH (service runs as $SERVICE_USER)"
  unit_file
  exit 0
fi

command -v systemctl >/dev/null || die "systemd (systemctl) not found. this script is for Linux with systemd"

# ---------- uninstall ----------
if (( UNINSTALL )); then
  if (( EUID != 0 )); then exec sudo "$0" --uninstall --name "$NAME"; fi
  systemctl disable --now "$NAME.service" 2>/dev/null || true
  rm -f "$UNIT_PATH" "$BIN_PATH"
  systemctl daemon-reload
  echo "removed $NAME (service, unit file and binary)"
  if id "$SYSTEM_USER" &>/dev/null; then echo "the '$SYSTEM_USER' system user is still there; remove it with: userdel $SYSTEM_USER"; fi
  exit 0
fi

# ---------- not root: build as yourself, then re-run with sudo ----------
if (( EUID != 0 )); then
  command -v cargo >/dev/null || die "cargo not found. install Rust from https://rustup.rs first"
  echo "building release binary…"
  cargo build --release --locked --manifest-path "$MANIFEST" || die "$BUILD_HELP"
  command -v sudo >/dev/null || die "sudo not found. run this script as root instead"
  exec sudo "$0" --built --port "$PORT" --host "$HOST" --root "$ROOT" --user "$SERVICE_USER" --name "$NAME"
fi

# ---------- root from here on ----------
# build, unless a non-root run of this script just did
if (( ! BUILT_BY_CALLER )); then
  if [[ -n "$CALLER" ]] && id "$CALLER" &>/dev/null; then
    # sudo ./install-service.sh: build as the real user with their own Rust toolchain (login shell for ~/.cargo/bin)
    echo "building release binary as $CALLER…"
    runuser -u "$CALLER" -- bash -lc "cargo build --release --locked --manifest-path $(printf %q "$MANIFEST")" \
      || die "$BUILD_HELP"
  elif command -v cargo >/dev/null || [[ -x /root/.cargo/bin/cargo ]]; then
    echo "building release binary as root…"
    "$(command -v cargo || echo /root/.cargo/bin/cargo)" build --release --locked --manifest-path "$MANIFEST" || die "$BUILD_HELP"
  elif [[ -x "$BUILT_BIN" ]]; then
    echo "note: cargo not found, installing the binary that's already built at $BUILT_BIN"
  else
    die "cargo not found and nothing is built yet. install Rust (https://rustup.rs) or build first with: cargo build --release --manifest-path $MANIFEST"
  fi
fi
[[ -x "$BUILT_BIN" ]] || die "$BUILT_BIN not found after building"

# the service account: create the dedicated system user if that's the one we're using
if ! id "$SERVICE_USER" &>/dev/null; then
  [[ "$SERVICE_USER" == "$SYSTEM_USER" ]] || die "user '$SERVICE_USER' doesn't exist"
  nologin="$(command -v nologin || echo /usr/sbin/nologin)"
  useradd --system --no-create-home --home-dir /nonexistent --shell "$nologin" "$SYSTEM_USER" \
    || die "couldn't create the '$SYSTEM_USER' system user"
  echo "created system user '$SYSTEM_USER' to run the service"
fi
[[ "$SERVICE_USER" != "root" ]] || echo "warning: the service will run as root because you asked for --user root" >&2

# the service account must be able to read the site (e.g. a site under /root isn't readable by others)
if [[ "$SERVICE_USER" != "root" ]] && ! runuser -u "$SERVICE_USER" -- test -r "$ROOT/index.html"; then
  cat >&2 <<EOF
error: user '$SERVICE_USER' can't read $ROOT/index.html
fix one of these and run the script again:
  - move the site somewhere readable, e.g. /srv/portfolio, and pass --root /srv/portfolio
  - let others read it:   chmod o+rX "$ROOT" and its parent folders, and chmod -R o+rX "$ROOT"
  - run it as an account that can read it:  --user <name>
EOF
  exit 1
fi

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
  echo "  site:     http://$( [[ "$HOST" == "0.0.0.0" ]] && echo localhost || echo "$HOST" ):$PORT  (serving $ROOT as $SERVICE_USER)"
  echo "  logs:     journalctl -u $NAME -f"
  echo "  status:   systemctl status $NAME"
  echo "  restart:  systemctl restart $NAME"
  echo "  remove:   $0 --uninstall"
else
  echo "✗ $NAME failed to start. last log lines:" >&2
  journalctl -u "$NAME" -n 20 --no-pager >&2 || true
  exit 1
fi
