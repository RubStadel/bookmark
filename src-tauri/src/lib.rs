use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir, PublicGeneralPurposeDir};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            edit_file,
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
        println!("Didn't exist!");
    }

    std::fs::read_to_string(&file_path).unwrap()
}

/// Overwrite the "books.json" file with the content received from the frontend.
#[tauri::command]
fn edit_file(app: tauri::AppHandle, contents: &[u8]) -> tauri_plugin_android_fs::Result<bool> {
    let api = app.android_fs();
    let private_storage = api.private_storage();

    // Write file
    private_storage.write(PrivateDir::Data, "resources/books.json", contents)?;

    // Read file // TODO: remove when testing is finished
    let dir_path = private_storage.resolve_path(PrivateDir::Data)?;
    let file_path = dir_path.join("resources/books.json");

    let file_content = std::fs::read_to_string(&file_path)?;
    println!("{:?}", file_content);

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

    let dir_path = private_storage.resolve_uri_with(PrivateDir::Data, "resources/books.json")?;

    //// in /Documents/:
    let file_uri = public_storage.create_file_in_public_dir(
        PublicGeneralPurposeDir::Documents,
        "exported.txt",
        Some("text/plain"), // TODO: change to "applicaton/json" when done testing
    )?;

    api.copy_via_kotlin(&dir_path, &file_uri)?;

    println!("Successfully copied."); // FIXME: remove all println

    Ok(true)
}
