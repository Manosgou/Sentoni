// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod controllers;
mod database;
mod models;
mod repositories;
mod schemas;

use tokio::sync::Mutex;

use crate::database::{load_db, new_db, Database};

use crate::controllers::event_controller::{
    create_empty_event, create_event, delete_event_by_id, export_person_events_history,
    fetch_monthly_person_events, fetch_person_events_history, get_date_events, get_event_details,
    init_date_events, update_event,
};
use crate::controllers::event_type_controller::{
    create_event_type, delete_event_type, export_event_types, get_all_event_types,
    get_all_event_types_paginated, import_multiple_event_types, update_event_type,
};
use crate::controllers::hierarchy_controller::{fetch_hierarchy, update_hierarchy};
use crate::controllers::personnel_controller::{
    create_person, delete_person, export_personnel, get_all_personnel_paginated,
    import_multiple_persons, update_person,
};

use crate::controllers::reminder_controller::{
    create_reminder, delete_reminder, get_all_reminders, reschedule_reminder, update_reminder,
    update_reminder_status,
};

use crate::controllers::numeration_controller::{export_numeration, get_personnel_numeration};

use crate::controllers::attendance_book_controller::{
    fetch_attendance_book_details, generate_attendance_book,
};

fn main() {
    let app_state: Database = Database(Mutex::new(None));
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            import_multiple_event_types,
            export_event_types,
            export_personnel,
            export_numeration,
            get_personnel_numeration,
            update_event,
            reschedule_reminder,
            update_reminder_status,
            update_reminder,
            delete_reminder,
            get_all_reminders,
            create_reminder,
            init_date_events,
            get_date_events,
            get_all_event_types,
            fetch_monthly_person_events,
            update_hierarchy,
            fetch_hierarchy,
            export_person_events_history,
            import_multiple_persons,
            fetch_person_events_history,
            generate_attendance_book,
            fetch_attendance_book_details,
            load_db,
            new_db,
            create_person,
            get_event_details,
            get_all_personnel_paginated,
            delete_person,
            update_person,
            create_event_type,
            get_all_event_types_paginated,
            delete_event_type,
            update_event_type,
            create_empty_event,
            delete_event_by_id,
            create_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
