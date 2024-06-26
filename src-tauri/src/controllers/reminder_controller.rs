use crate::models::Reminder;
use crate::Database;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn create_reminder(
    reminder: serde_json::Value,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let reminder: Option<Reminder> = serde_json::from_value(reminder).ok();
    if reminder.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης υπενθύμισης"}));
    }
    let reminder = reminder.unwrap();

    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let counter: Option<u32> = Reminder::count_reminders(&reminder.date, conn).await;
    if counter.is_none() {
        return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
    }
    if counter.unwrap() >= 10 {
        return Ok(json!({"max":"Μέγιστος αριθμός υπενθυμίσεων"}));
    }
    let created = reminder.create_reminder(conn).await;
    if created {
        return Ok(json!({"created":"Επιτυχής δημιουργία υπενθυμισης"}));
    }
    return Ok(json!({"error":"Παρουσιάστηκε σφάλμα κατά την δημιουργία της υπενθύμισης"}));
}

#[tauri::command]
pub async fn update_reminder_status(
    reminder_id: u32,
    status: u32,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let reminder: Option<Reminder> = Reminder::get_reminder_by_id(reminder_id, conn).await;
    if reminder.is_none() {
        return Ok(false);
    }
    let reminder = reminder.unwrap();
    Ok(Reminder::update_reminder_status(reminder, status, conn).await)
}

#[tauri::command]
pub async fn reschedule_reminder(
    reminder_id: u32,
    new_date: String,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let reminder: Option<Reminder> = Reminder::get_reminder_by_id(reminder_id, conn).await;
    if reminder.is_none() {
        return Ok(false);
    }
    let reminder = reminder.unwrap();
    Ok(Reminder::update_reminder_date(reminder, new_date, conn).await)
}

#[tauri::command]
pub async fn delete_reminder(
    reminder: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let reminder: Option<Reminder> = serde_json::from_value(reminder).ok();
    if reminder.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    Ok(reminder.unwrap().delete_reminder(conn).await)
}

#[tauri::command]
pub async fn update_reminder(
    reminder: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let reminder: Option<Reminder> = serde_json::from_value(reminder).ok();
    if reminder.is_none() {
        return Ok(false);
    }
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    Ok(reminder.unwrap().update_reminder(conn).await)
}

#[tauri::command]
pub async fn get_all_reminders(
    date: String,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let reminders = Reminder::get_all_reminders(date, conn).await;
    if reminders.is_some() {
        return Ok(json!(reminders));
    }
    Ok(json!({"error":"Αδυναμία φόρτωσης υπενθυμίσεων"}))
}
