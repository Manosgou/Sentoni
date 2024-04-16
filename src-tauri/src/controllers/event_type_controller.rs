use crate::models::EventType;
use crate::Database;
use serde_json::json;
use std::fs::File;
use tauri::State;

#[tauri::command]
pub async fn create_event_type(
    event_type: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let event_type: Option<EventType> = serde_json::from_value(event_type).ok();
    if event_type.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    Ok(event_type.unwrap().create_event_type(conn).await)
}

#[tauri::command]
pub async fn get_all_event_types_paginated(
    page: u32,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let event_types_counter: Option<u32> = EventType::count_event_types(conn).await;
    let event_types: Option<Vec<EventType>> =
        EventType::get_all_event_types_paginated(page, conn).await;
    if event_types_counter.is_some() && event_types.is_some() {
        return Ok(
            json!({"eventTypesCounter":event_types_counter.unwrap(),"eventTypes":event_types.unwrap()}),
        );
    }
    Ok(json!({"error":"Αδυναμία φόρτωσης ειδών γεγονότων"}))
}

#[tauri::command]
pub async fn get_all_event_types(state: State<'_, Database>) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let event_types: Option<Vec<EventType>> = EventType::get_all_event_types(conn).await;
    if event_types.is_some() {
        return Ok(json!(event_types.unwrap()));
    }
    Ok(json!({"error":"Αδυναμία φόρτωσης ειδών γεγονότων"}))
}

#[tauri::command]
pub async fn delete_event_type(
    event_type: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let event_type: Option<EventType> = serde_json::from_value(event_type).ok();
    if event_type.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    Ok(event_type.unwrap().delete_event_type(conn).await)
}

#[tauri::command]
pub async fn update_event_type(
    event_type: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let event_type: Option<EventType> = serde_json::from_value(event_type).ok();
    if event_type.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    Ok(event_type.unwrap().update_event_type(conn).await)
}

#[tauri::command]
pub async fn export_event_types(path: String, state: State<'_, Database>) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let event_types = EventType::get_all_event_types(conn).await;
    if event_types.is_none() {
        return Ok(false);
    }
    let event_types = event_types.unwrap();
    let writer = csv::WriterBuilder::new().has_headers(true).from_path(path);
    if !writer.is_ok() {
        return Ok(false);
    }
    let mut writer = writer.unwrap();
    for event_type in event_types.iter() {
        let written = writer
            .serialize(EventType {
                id: None,
                name: event_type.name.clone(),
                color: event_type.color.clone(),
            })
            .is_ok();
        if !written {
            return Ok(false);
        }
    }
    Ok(writer.flush().is_ok())
}

#[tauri::command]
pub async fn import_multiple_event_types(
    csv_path: String,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let csv_file: Option<File> = File::open(csv_path).ok();

    if csv_file.is_none() {
        return Ok(false);
    }
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_file.unwrap());

    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    for result in rdr.deserialize() {
        let event_type: Option<EventType> = result.ok();
        if event_type.is_some() {
            let event_type = event_type.unwrap();
            let created_event_type = event_type.create_event_type(conn).await;
            if !created_event_type {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }
    }
    Ok(true)
}
