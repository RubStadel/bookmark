use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir, PublicGeneralPurposeDir};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            edit_file,
            import_json,
            copy_to_public_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Checks if the "books.json" file exists.
///
/// If yes, returns its contents to the frontend.
/// If not, creates the file and adds the basic property structure.
#[tauri::command]
fn read_file(app: tauri::AppHandle) -> String {
    let api = app.android_fs();
    let private_storage = api.private_storage();

    let dir_path = private_storage.resolve_path(PrivateDir::Data).unwrap();
    let file_path = dir_path.join("resources/books.json");

    if !private_storage
        .exists(PrivateDir::Data, "resources/books.json")
        .unwrap()
    {
        // create file and add properties
        let content = r##"{"books": [], "datalists": {"authors": [], "languages": [], "genres": [], "seriesDatalist": [], "countries": []}, "darkTheme": true}"##;
        std::fs::create_dir_all(file_path.parent().unwrap()).unwrap();
        std::fs::write(&file_path, content).unwrap();
    }

    std::fs::read_to_string(&file_path).unwrap()
}

/// Overwrite the "books.json" file with the content received from the frontend.
#[tauri::command]
fn edit_file(app: tauri::AppHandle, contents: &[u8]) -> tauri_plugin_android_fs::Result<bool> {
    let api = app.android_fs();
    let private_storage = api.private_storage();

    private_storage.write(PrivateDir::Data, "resources/books.json", contents)?;

    Ok(true)
}

/// Copies the "books.json" file from the private data storage to the public documents directory as "bookmark_exported.json".
#[tauri::command]
fn copy_to_public_dir(app: tauri::AppHandle) -> tauri_plugin_android_fs::Result<bool> {
    let api = app.android_fs();
    let public_storage = api.public_storage();
    let private_storage = api.private_storage();

    let dir_path = private_storage.resolve_uri_with(PrivateDir::Data, "resources/books.json")?;

    //// in /Documents/:
    let file_uri = public_storage.create_file_in_public_dir(
        PublicGeneralPurposeDir::Documents,
        "bookmark_exported.json",
        Some("application/json"),
    )?;

    api.copy_via_kotlin(&dir_path, &file_uri)?;

    Ok(true)
}

/// Opens a file picker dialog to let the user select a single JSON file.
/// The contents of this file are returned to the frontend.
#[tauri::command]
fn import_json(app: tauri::AppHandle) -> String {
    let api = app.android_fs();
    let initial_location = api
        .resolve_initial_location(PublicGeneralPurposeDir::Download, false)
        .unwrap();

    let selected_files = api
        .show_open_file_dialog(Some(&initial_location), &["application/json"], false)
        .unwrap();

    if selected_files.is_empty() {
        String::from("")
    } else {
        api.read_to_string(&selected_files[0]).unwrap()
    }
}
