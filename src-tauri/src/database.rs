use ormlite::sqlite::SqliteConnection;
use ormlite::Connection;
use std::fs::File;
use tauri::State;
use tokio::sync::Mutex;

const  CREATE_TABLE_SQL: &str =
    "CREATE TABLE IF NOT EXISTS Personnel (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           full_name TEXT NOT NULL,
                                           notes TEXT,
                                           active INTEGER NOT NULL);

     CREATE TABLE IF NOT EXISTS EventType (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           name TEXT,
                                           color TEXT);

     CREATE TABLE IF NOT EXISTS Event (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       notes TEXT,
                                       start_date TEXT NOT NULL,
                                       current_date TEXT NOT NULL,
                                       end_date TEXT NOT NULL,
                                       event_type INTEGER REFERENCES EventType(id) ON DELETE SET NULL,
                                       person_id INTEGER REFERENCES Personnel(id) ON DELETE CASCADE);

    CREATE TABLE IF NOT EXISTS Hierarchy (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          position INTEGER NOT NULL,
                                          person_id INTEGER REFERENCES Personnel(id) ON DELETE CASCADE);

    CREATE TABLE IF NOT EXISTS Reminder (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            date TEXT NOT NULL,
                                            notes TEXT NOT NULL,
                                            is_finished INTEGER NOT NULL);

    CREATE INDEX IF NOT EXISTS event_idx ON Event (person_id,event_type);
    CREATE INDEX IF NOT EXISTS personnel_idx ON Personnel (active);";

pub struct Database(pub Mutex<Option<SqliteConnection>>);

#[tauri::command]
pub async fn load_db(value: &str, state: State<'_, Database>) -> Result<bool, ()> {
    let mut db = state.0.lock().await;
    let conn: Option<SqliteConnection> =
        ormlite::sqlite::SqliteConnection::connect(value).await.ok();
    if conn.is_some() {
        *db = Some(conn.unwrap());
    } else {
        return Ok(false);
    }
    return Ok(ormlite::query(CREATE_TABLE_SQL)
        .execute(&mut *db.as_mut().unwrap())
        .await
        .is_ok());
}

#[tauri::command]
pub async fn new_db(value: &str, state: State<'_, Database>) -> Result<bool, ()> {
    let file = File::create(value);
    if file.is_ok() {
        let mut db = state.0.lock().await;
        let conn: Option<SqliteConnection> =
            ormlite::sqlite::SqliteConnection::connect(value).await.ok();
        if conn.is_some() {
            *db = Some(conn.unwrap());
        } else {
            return Ok(false);
        }
        return Ok(ormlite::query(CREATE_TABLE_SQL)
            .execute(&mut *db.as_mut().unwrap())
            .await
            .is_ok());
    }
    Ok(false)
}
