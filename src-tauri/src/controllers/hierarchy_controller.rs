use crate::models::Hierarchy;
use crate::Database;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn fetch_hierarchy(state: State<'_, Database>) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let hierarchy = Hierarchy::get_all_hierarchy(conn).await;
    if hierarchy.is_some() {
        return Ok(json!(hierarchy));
    }
    Ok(json!({"error":"Αδυναμία φόρτωσης ιεραρχίας"}))
}

#[tauri::command]
pub async fn update_hierarchy(
    updated_hierarchy: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let hierachy: Option<Vec<Hierarchy>> = serde_json::from_value(updated_hierarchy).ok();
    if hierachy.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    for item in hierachy.unwrap().iter() {
        let updated = item.update_hierarchy(conn).await;
        if !updated {
            return Ok(false);
        }
    }
    Ok(true)
}
