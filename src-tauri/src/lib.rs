// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod parser;
use parser::Course;
use tauri::Manager;

#[tauri::command]
fn import_schedule(content: String) -> Result<Vec<Course>, String> {
    parser::parse_schedule_file(&content)
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|_app| {
            // 应用平台特定的窗口效果
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                let window = _app.get_webview_window("main").unwrap();

                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                        .expect("无法应用 macOS vibrancy 效果");
                }

                #[cfg(target_os = "windows")]
                {
                    use window_vibrancy::{apply_acrylic, apply_mica};
                    // 尝试 Mica (Windows 11)，失败则回退到 Acrylic (Windows 10)
                    if apply_mica(&window, Some(true)).is_err() {
                        apply_acrylic(&window, Some((18, 18, 18, 125)))
                            .expect("无法应用 Windows Acrylic 效果");
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![import_schedule, get_app_version])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
