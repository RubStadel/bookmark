use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_window, emit_book_details])
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn create_window(app: tauri::AppHandle, config: usize) {
    // new window according to config (defined in tauri.conf.json)
    let _webview_window = tauri::WebviewWindowBuilder::from_config(
        &app,
        &app.config().app.windows.get(config).unwrap().clone(),
    )
    .unwrap()
    .build()
    .unwrap();
}

#[tauri::command]
async fn emit_book_details(app: tauri::AppHandle, title: String) {
    app.emit_to("bookDetails", "bookDetails", title).unwrap();
}
