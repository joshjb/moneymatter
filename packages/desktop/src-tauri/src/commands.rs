use crate::config::{load_config, save_config, DesktopConfig};
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStatus {
    pub ok: bool,
    pub status_code: u16,
    pub latency_ms: u64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub app_version: String,
}

#[tauri::command]
pub fn get_desktop_config() -> Result<DesktopConfig, String> {
    Ok(load_config())
}

#[tauri::command]
pub fn save_desktop_config(config: DesktopConfig) -> Result<(), String> {
    save_config(&config)
}

#[tauri::command]
pub async fn test_server_connection(mut url: String) -> Result<ConnectionStatus, String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        url = format!("https://{}", url);
    }
    let trimmed = url.trim_end_matches('/');

    let test_url = if trimmed.ends_with("/api/v1") {
        format!("{}/health", trimmed)
    } else {
        format!("{}/api/v1/health", trimmed)
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let start = Instant::now();

    // First try the health check endpoint
    let res = client.get(&test_url).send().await;

    let latency_ms = start.elapsed().as_millis() as u64;

    match res {
        Ok(response) => {
            let status = response.status().as_u16();
            let is_success = response.status().is_success() || status == 401; // 401 means server is alive and responding
            Ok(ConnectionStatus {
                ok: is_success,
                status_code: status,
                latency_ms,
                error: None,
            })
        }
        Err(err) => {
            // Fallback: try root URL
            let root_start = Instant::now();
            match client.get(trimmed).send().await {
                Ok(fallback_res) => {
                    let status = fallback_res.status().as_u16();
                    let root_latency = root_start.elapsed().as_millis() as u64;
                    Ok(ConnectionStatus {
                        ok: true,
                        status_code: status,
                        latency_ms: root_latency,
                        error: None,
                    })
                }
                Err(_) => Ok(ConnectionStatus {
                    ok: false,
                    status_code: 0,
                    latency_ms,
                    error: Some(err.to_string()),
                }),
            }
        }
    }
}

#[tauri::command]
pub fn open_in_browser(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| format!("Failed to open browser: {}", e))
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
