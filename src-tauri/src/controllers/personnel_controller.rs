use crate::models::{Hierarchy, Personnel};
use crate::Database;
use serde_json::json;
use std::fs::File;
use tauri::State;

#[tauri::command]
pub async fn create_person(
    person: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let person: Option<Personnel> = serde_json::from_value(person).ok();
    if person.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    let person = person.unwrap().create_person(&mut *conn).await;
    if person.is_some() {
        return Ok(Hierarchy::create_hierarchy(person.unwrap().id.unwrap(), &mut *conn).await);
    }
    Ok(false)
}

#[tauri::command]
pub async fn import_multiple_persons(
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
    for result in rdr.deserialize() {
        let person: Option<Personnel> = result.ok();
        if person.is_some() {
            let person = person.unwrap();
            let created_person = person.create_person(&mut *conn).await;
            if created_person.is_some() {
                Hierarchy::create_hierarchy(created_person.unwrap().id.unwrap(), &mut *conn).await;
            }
        } else {
            return Ok(false);
        }
    }
    Ok(true)
}

#[tauri::command]
pub async fn get_all_personnel_paginated(
    page: u32,
    limit: u32,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    let personnel_counter = Personnel::count_personnel(&mut *conn).await;
    let personnel = Personnel::get_all_personnel_paginated(page, limit, &mut *conn).await;
    if personnel.is_some() {
        return Ok(json!({"personnelCounter":personnel_counter,"personnel":personnel}));
    }
    return Ok(json!({"error":"Αδυναμία φόρτωσης προσωπικού"}));
}

#[tauri::command]
pub async fn delete_person(
    person: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let person: Option<Personnel> = serde_json::from_value(person).ok();
    if person.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    Ok(person.unwrap().delete_person(&mut *conn).await)
}

#[tauri::command]
pub async fn update_person(
    person: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let person: Option<Personnel> = serde_json::from_value(person).ok();
    if person.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    Ok(person.unwrap().update_person(&mut *conn).await)
}

#[tauri::command]
pub async fn export_personnel(path: String, state: State<'_, Database>) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    let personnel = Personnel::get_all_personnel(&mut *conn).await;
    if personnel.is_none() {
        return Ok(false);
    }
    let personnel = personnel.unwrap();
    let writer = csv::WriterBuilder::new().has_headers(true).from_path(path);
    if !writer.is_ok() {
        return Ok(false);
    }
    let mut writer = writer.unwrap();
    for person in personnel.iter() {
        let written = writer
            .serialize(Personnel {
                id: None,
                full_name: person.full_name.clone(),
                notes: person.notes.clone(),
                active: person.active.clone(),
            })
            .is_ok();
        if !written {
            return Ok(false);
        }
    }
    Ok(writer.flush().is_ok())
}
