use tauri::{
  menu::{Menu, MenuItem},
  tray::{TrayIconBuilder, TrayIconEvent},
  AppHandle, Manager,
};

#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Eidos Language OS Desktop!", name)
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .invoke_handler(tauri::generate_handler![greet])
    .setup(|app| {
      let quit_i = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
      let show_i = MenuItem::with_id(app, "show", "Eidos Language'i Göster", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

      let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "quit" => {
            app.exit(0);
          }
          "show" => {
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click { .. } = event {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        })
        .build(app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running Eidos Language OS application");
}
