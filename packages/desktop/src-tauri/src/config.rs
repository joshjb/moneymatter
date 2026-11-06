use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopConfig {
    pub server_url: String,
    pub auto_connect: bool,
    pub theme: String,
    pub remember_server: bool,
}

impl Default for DesktopConfig {
    fn default() -> Self {
        Self {
            server_url: "https://moneymatter.app".to_string(),
            auto_connect: true,
            theme: "system".to_string(),
            remember_server: true,
        }
    }
}

pub fn get_config_dir() -> PathBuf {
    if let Some(mut dir) = dirs::data_dir() {
        dir.push("app.moneymatter.desktop");
        dir
    } else {
        PathBuf::from(".moneymatter")
    }
}

pub fn get_config_file_path() -> PathBuf {
    let mut path = get_config_dir();
    path.push("config.json");
    path
}

pub fn load_config() -> DesktopConfig {
    let path = get_config_file_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str::<DesktopConfig>(&content) {
                return config;
            }
        }
    }
    DesktopConfig::default()
}

pub fn save_config(config: &DesktopConfig) -> Result<(), String> {
    let dir = get_config_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config dir: {}", e))?;
    }
    let path = get_config_file_path();
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write config file: {}", e))?;
    Ok(())
}
