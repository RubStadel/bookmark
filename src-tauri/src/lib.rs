use tauri::Emitter;
use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir, PublicGeneralPurposeDir};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            edit_file,
            copy_to_public_dir,
            check_file_exists
        ])
        .plugin(tauri_plugin_fs::init())
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
    let file_path = dir_path.join("books.json");

    if !private_storage
        .exists(PrivateDir::Data, "books.json")
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

    let dir_path = private_storage.resolve_path(PrivateDir::Data).unwrap();
    let file_path = dir_path.join("books.json");

    // Write file
    std::fs::create_dir_all(file_path.parent().unwrap()).unwrap();
    std::fs::write(&file_path, contents).unwrap();

    // Read file
    // let file_content = std::fs::read_to_string(&file_path).unwrap();
    // app.emit("test", file_content).unwrap();

    Ok(true)
}

/// Copies the "books.json" file from the private data storage to the public documents directory.
///
/// New file is a .txt because I have no App on my phone that can display json files :( TODO: remove when it creates a .json
#[tauri::command]
fn copy_to_public_dir(app: tauri::AppHandle) -> tauri_plugin_android_fs::Result<bool> {
    let api = app.android_fs();
    let public_storage = api.public_storage();
    let private_storage = api.private_storage();

    let dir_path = private_storage.resolve_uri_with(PrivateDir::Data, "books.json")?;

    //// in /Documents/:
    let file_uri = public_storage.create_file_in_public_dir(
        PublicGeneralPurposeDir::Documents,
        "copy_test.txt",
        Some("text/plain"), // TODO: change to "applicaton/json" when done testing
    )?;

    //// in /Documents/bookmark/:
    // let file_uri = public_storage.create_file_in_public_app_dir(
    //     PublicGeneralPurposeDir::Documents,
    //     "copy_test.txt",
    //     Some("text/plain"),
    // )?;

    api.copy_via_kotlin(&dir_path, &file_uri)?;

    app.emit("test", "Successfully copied.").unwrap();

    Ok(true)
}

// TODO: remove (is unused, but might be used for testing in the future)
/// Checks if the "books.json" file exists.
#[tauri::command]
fn check_file_exists(app: tauri::AppHandle) -> bool {
    let api = app.android_fs();
    let private_storage = api.private_storage();

    // test and emit result
    // let test = private_storage.exists(PrivateDir::Data, "books.json")?;
    // app.emit("test", test).unwrap();

    private_storage
        .exists(PrivateDir::Data, "books.json")
        .unwrap()
}
