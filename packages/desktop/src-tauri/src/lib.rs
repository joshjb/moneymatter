pub mod commands;
pub mod config;
pub mod menu;
pub mod tray;

use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_desktop_config,
            commands::save_desktop_config,
            commands::test_server_connection,
            commands::open_in_browser,
            commands::get_system_info,
        ])
        .setup(|app| {
            // Setup macOS Application Menu
            let menu = menu::build_menu(app.handle())?;
            app.set_menu(menu)?;

            // Setup macOS System Tray / Status Item
            if let Err(e) = tray::setup_tray(app.handle()) {
                eprintln!("Warning: failed to setup tray icon: {}", e);
            }

            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "settings" | "switch_server" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("open-server-settings", ());
                }
            }
            "reload" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.reload()");
                }
            }
            "bring_to_front" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                }
            }
            "open_docs" => {
                let _ = open::that("https://docs.moneymatter.app");
            }
            "open_github" => {
                let _ = open::that("https://github.com/letehaha/moneymatter");
            }
            "report_issue" => {
                let _ = open::that("https://github.com/letehaha/moneymatter/issues");
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running MoneyMatter desktop application");
}
