//! Small, fast static file server for the portfolio site.
//!
//!   cargo run --release -- [--root DIR] [--host ADDR] [--port N] [--quiet]
//!
//! Serves the site folder with gzip/brotli compression, Last-Modified revalidation (304s),
//! byte ranges (for the large photos), sensible cache headers and a few security headers.
//! Dotfiles (.git, .env, ...) and the server's own folder are never served.

use std::{net::SocketAddr, path::PathBuf, process, time::Instant};

use axum::{
    extract::Request,
    handler::HandlerWithoutStateExt,
    http::{header, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    Router,
};
use tower_http::{compression::CompressionLayer, services::ServeDir};

struct Config {
    root: PathBuf,
    host: String,
    port: u16,
    quiet: bool,
}

const USAGE: &str = "usage: snf-server [--root DIR] [--host ADDR] [--port N] [--quiet]

  --root DIR    folder to serve (default: current folder)
  --host ADDR   address to listen on (default: 0.0.0.0, all interfaces)
  --port N      port (default: 8000)
  --quiet       don't log requests";

fn parse_args() -> Result<Config, String> {
    let mut cfg = Config { root: PathBuf::from("."), host: "0.0.0.0".into(), port: 8000, quiet: false };
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = |name: &str| args.next().ok_or_else(|| format!("{name} needs a value"));
        match arg.as_str() {
            "--root" | "-r" => cfg.root = PathBuf::from(value("--root")?),
            "--host" => cfg.host = value("--host")?,
            "--port" | "-p" => cfg.port = value("--port")?.parse().map_err(|_| "--port must be a number from 0 to 65535".to_string())?,
            "--quiet" | "-q" => cfg.quiet = true,
            "--help" | "-h" => {
                println!("{USAGE}");
                process::exit(0);
            }
            other => return Err(format!("unknown option '{other}'")),
        }
    }
    Ok(cfg)
}

#[tokio::main]
async fn main() {
    let cfg = parse_args().unwrap_or_else(|e| {
        eprintln!("error: {e}\n\n{USAGE}");
        process::exit(2);
    });
    let root = cfg.root.canonicalize().unwrap_or_else(|e| {
        eprintln!("error: can't open {}: {e}", cfg.root.display());
        process::exit(1);
    });
    if !root.join("index.html").is_file() {
        eprintln!("warning: no index.html in {}", root.display());
    }

    let files = ServeDir::new(&root)
        .append_index_html_on_directories(true)
        .not_found_service(not_found.into_service());

    let mut app = Router::new()
        .fallback_service(files)
        .layer(middleware::from_fn(response_headers))
        .layer(CompressionLayer::new()) // gzip/brotli for text; images and tiny files are left alone
        .layer(middleware::from_fn(guard));
    if !cfg.quiet {
        app = app.layer(middleware::from_fn(log));
    }

    let addr: SocketAddr = format!("{}:{}", cfg.host, cfg.port).parse().unwrap_or_else(|_| {
        eprintln!("error: '{}:{}' isn't a valid address", cfg.host, cfg.port);
        process::exit(2);
    });
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap_or_else(|e| {
        eprintln!("error: can't listen on {addr}: {e}");
        process::exit(1);
    });
    let shown = if cfg.host == "0.0.0.0" { format!("localhost:{}", cfg.port) } else { addr.to_string() };
    println!("serving {} on http://{shown}  (ctrl+c to stop)", root.display());

    axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await.unwrap_or_else(|e| {
        eprintln!("error: {e}");
        process::exit(1);
    });
}

/// Never serve dotfiles/dot-folders (.git, .env, .DS_Store, ...) or the server's own folder.
async fn guard(req: Request, next: Next) -> Response {
    let hidden = req.uri().path().split('/').enumerate().any(|(i, seg)| {
        let seg = seg.to_ascii_lowercase();
        seg.starts_with('.') || seg.starts_with("%2e") || (i == 1 && seg == "server")
    });
    if hidden {
        return not_found().await.into_response();
    }
    next.run(req).await
}

/// Cache and security headers, chosen by file type.
async fn response_headers(req: Request, next: Next) -> Response {
    let path = req.uri().path().to_ascii_lowercase();
    let versioned = req.uri().query().is_some_and(|q| q.split('&').any(|p| p.starts_with("v=")));
    let mut res = next.run(req).await;

    let h = res.headers_mut();
    h.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    h.insert(header::REFERRER_POLICY, HeaderValue::from_static("strict-origin-when-cross-origin"));
    h.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("SAMEORIGIN"));

    if res.status().is_success() || res.status() == StatusCode::NOT_MODIFIED {
        let ext = path.rsplit_once('.').map(|(_, e)| e).unwrap_or("");
        let cache = if versioned {
            // style.css?v=..., main.js?v=...: the URL changes whenever the file does
            "public, max-age=31536000, immutable"
        } else {
            match ext {
                "jpg" | "jpeg" | "png" | "gif" | "webp" | "avif" | "ico" | "woff" | "woff2" => "public, max-age=86400",
                // pages, data and unversioned scripts: always check for a newer version (cheap 304s)
                _ => "no-cache",
            }
        };
        res.headers_mut().insert(header::CACHE_CONTROL, HeaderValue::from_static(cache));
    }
    res
}

async fn log(req: Request, next: Next) -> Response {
    let (method, uri, start) = (req.method().clone(), req.uri().clone(), Instant::now());
    let res = next.run(req).await;
    if method != Method::HEAD {
        println!("{} {} {} {:.1}ms", res.status().as_u16(), method, uri, start.elapsed().as_secs_f64() * 1000.0);
    }
    res
}

async fn not_found() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
        "404: no such file or directory\n",
    )
}

async fn shutdown_signal() {
    let ctrl_c = async { tokio::signal::ctrl_c().await.ok() };
    #[cfg(unix)]
    let term = async {
        if let Ok(mut s) = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            s.recv().await;
        }
    };
    #[cfg(not(unix))]
    let term = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = term => {} }
    println!("\nshutting down");
}
