use crate::models::{Event, Personnel};
use crate::schemas::{EventDate, EventDetails, EventUpdate, PersonEvent, PersonEventsHistory};
use crate::Database;
use chrono::{Duration, NaiveDate};
use jsonm::packer::{PackOptions, Packer};
use open;
use ormlite::Model;
use rust_xlsxwriter::*;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn init_date_events(event_date: String, state: State<'_, Database>) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let active_personnel = Personnel::get_active_personnel(conn).await;
    if active_personnel.is_none() {
        return Ok(false);
    }
    for person in active_personnel.unwrap() {
        let event: Option<Event> =
            Event::get_event(person.id.unwrap(), event_date.as_str(), conn).await;
        if event.is_none() {
            let created_event: Option<Event> = Event {
                id: None,
                person_id: person.id.unwrap(),
                start_date: event_date.to_string(),
                current_date: event_date.to_string(),
                end_date: event_date.to_string(),
                event_type: None,
                notes: None,
            }
            .create_event(conn)
            .await;
            if created_event.is_none() {
                return Ok(false);
            }
        }
    }
    Ok(true)
}

#[tauri::command]
pub async fn get_date_events(
    page: u32,
    limit: u32,
    event_date: &str,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut packer = Packer::new();
    let options = PackOptions::new();
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let activet_personnel_counter: Option<u32> = Personnel::count_active_personnel(conn).await;
    let active_personnel: Option<Vec<Personnel>> =
        Personnel::get_active_personnel_paginated(page, limit, conn).await;
    if active_personnel.is_none() || activet_personnel_counter.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης προσωπικού"}));
    }
    let mut person_events: Vec<PersonEvent> = vec![];
    for person in active_personnel.unwrap().iter() {
        let events: Option<Vec<EventDate>> = ormlite::query_as(
            "SELECT
                Event.id,
                EventType.id AS event_type_id,
                EventType.name,
                STRFTIME('%d/%m/%Y',Event.start_date) AS start_date,
                STRFTIME('%d/%m/%Y',Event.current_date) AS current_date,
                STRFTIME('%d/%m/%Y',Event.end_date) AS end_date,
                EventType.color,
                Event.notes
            FROM
                EVENT
                LEFT JOIN EventType ON EVENT.event_type = EventType.id
            WHERE
                EVENT.current_date = ?
                AND Event.person_id = ?",
        )
        .bind(event_date)
        .bind(person.id)
        .fetch_all(&mut *conn)
        .await
        .ok();

        if events.is_some() {
            person_events.push(PersonEvent {
                id: person.id.unwrap(),
                full_name: person.full_name.to_string(),
                notes: person.notes.to_string(),
                events: events.unwrap(),
            });
        } else {
            return Ok(json!({"error":"Αδυναμία φόρτωσης γεγονότων προσωπικού"}));
        }
    }
    return Ok(
        match packer.pack(
            &json!({"activePersonnel":activet_personnel_counter.unwrap(),"events":person_events}),
            &options,
        ) {
            Ok(events) => events,
            Err(_) => json!({"error":"Αδυναμία φόρτωσης γεγονότων προσωπικού"}),
        },
    );
}

#[tauri::command]
pub async fn fetch_person_events_history(
    person_id: u32,
    start_date: String,
    end_date: String,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut packer = Packer::new();
    let options = PackOptions::new();
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let events_history: Option<Vec<PersonEventsHistory>> = ormlite::query_as(
        "SELECT
            Event.id,
            STRFTIME('%d/%m/%Y',Event.current_date) AS current_date,
            Event.notes,
            EventType.id AS event_type_id,
            EventType.name AS event_name,
            EventType.color AS event_color
          FROM
            Event
            LEFT JOIN EventType ON EventType.id = Event.event_type
          WHERE
            Event.person_id = ?
            AND Event.current_date BETWEEN ? AND ?
          ORDER BY
            Event.current_date;",
    )
    .bind(person_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(conn)
    .await
    .ok();

    if events_history.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωησης ιστορικού γεγονότων προσωπικού"}));
    }

    return Ok(match packer.pack(&json!(events_history), &options) {
        Ok(events) => events,
        Err(_) => json!({"error":"Αδυναμία φόρτωησης ιστορικού γεγονότων προσωπικού"}),
    });
}

#[tauri::command]
pub async fn fetch_monthly_person_events(
    start_date: &str,
    end_date: &str,
    events: &str,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut packer = Packer::new();
    let options = PackOptions::new();
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let active_personnel: Option<Vec<Personnel>> = Personnel::get_active_personnel(conn).await;
    if active_personnel.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης προσωπικού"}));
    }
    let mut person_events: Vec<PersonEvent> = vec![];

    for person in active_personnel.unwrap().iter() {
        let person_event: Option<Vec<EventDate>> = ormlite::query_as(
            format!(
                "SELECT
                    Event.id,
                    EventType.id AS event_type_id,
                    EventType.name,
                    STRFTIME('%d/%m/%Y',Event.start_date) AS start_date,
                    STRFTIME('%d/%m/%Y',Event.current_date) AS current_date,
                    STRFTIME('%d/%m/%Y',Event.end_date) AS end_date,
                    EventType.color,
                    Event.notes
                FROM
                    Event
                    LEFT JOIN EventType ON EventType.id = Event.event_type
                WHERE
                    Event.person_id = ?
                    AND Event.current_date BETWEEN ? AND ?
                    AND EventType.id IN ({})
                ORDER BY
                    Event.current_date;",
                events
            )
            .as_str(),
        )
        .bind(person.id)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&mut *conn)
        .await
        .ok();

        if person_event.is_some() {
            let person_event = person_event.unwrap();
            person_events.push(PersonEvent {
                id: person.id.unwrap(),
                full_name: person.full_name.clone(),
                notes: person.notes.clone(),
                events: person_event,
            });
        } else {
            return Ok(json!({"error":"Αδυναμία φόρτωσης μηνιαίων γεγονότων προσωπικού"}));
        }
    }
    return Ok(match packer.pack(&json!(person_events), &options) {
        Ok(events) => events,
        Err(_) => json!({"error":"Αδυναμία φόρτωσης μηνιαίων γεγονότων προσωπικού"}),
    });
}

#[tauri::command]
pub async fn create_empty_event(
    p_id: u32,
    event_date: &str,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let count_events: Option<u32> = Event::count_events(p_id, event_date.to_string(), conn).await;
    if count_events.is_none() {
        return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
    }
    if count_events.unwrap() >= 5 {
        return Ok(json!({"max":"Μέγιστος αριθμός γεγονότων"}));
    }
    let created_empty_event = Event {
        id: None,
        person_id: p_id,
        start_date: event_date.to_string(),
        current_date: event_date.to_string(),
        end_date: event_date.to_string(),
        event_type: None,
        notes: None,
    }
    .create_event(conn)
    .await;
    if created_empty_event.is_some() {
        return Ok(json!({"created":"Επιτυχής δημιουργία γεγονότος"}));
    }
    return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
}

#[tauri::command]
pub async fn create_event(
    event: serde_json::Value,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let event: Option<Event> = serde_json::from_value(event).ok();
    if event.is_none() {
        return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
    }
    let event = event.unwrap();

    let events_counter: Option<u32> =
        Event::count_events(event.person_id, event.current_date.clone(), conn).await;
    if events_counter.is_none() {
        return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
    }
    if events_counter.unwrap() >= 5 {
        return Ok(json!({"max":"Μέγιστος αριθμός γεγονότων"}));
    }

    let event_type_exists = Event::select()
        .where_("Event.person_id=? AND Event.event_type=? AND Event.current_date=?")
        .bind(event.person_id)
        .bind(event.event_type.unwrap())
        .bind(event.current_date.clone())
        .fetch_one(&mut *conn)
        .await
        .is_ok();
    if event_type_exists {
        return Ok(json!({"exists":"To γεγονός υπάρχει ήδη για το παρών πρόσωπο"}));
    }
    let start_date: Option<NaiveDate> =
        NaiveDate::parse_from_str(&event.start_date, "%Y-%m-%d").ok();
    let end_date: Option<NaiveDate> = NaiveDate::parse_from_str(&event.end_date, "%Y-%m-%d").ok();
    if start_date.is_none() && end_date.is_none() {
        return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
    }
    let start_date = start_date.unwrap();
    let end_date = end_date.unwrap();
    let mut start = start_date;
    let mut dates: Vec<String> = vec![];
    while start <= end_date {
        dates.push(start.format("%Y-%m-%d").to_string());
        start += Duration::try_days(1).unwrap();
    }

    let person_id = event.person_id;
    let notes = event.notes;
    let event_type = event.event_type;
    let start_date = event.start_date;
    let end_date = event.end_date;

    for date in dates.iter() {
        let event_exists = Event::event_exists(person_id, date.clone(), &mut *conn).await;
        if event_exists.is_some() {
            let updated = Event {
                id: Some(event_exists.unwrap() as u32),
                person_id: person_id,
                start_date: start_date.to_string(),
                current_date: date.to_string(),
                end_date: end_date.to_string(),
                event_type: event_type.clone(),
                notes: notes.clone(),
            }
            .update_all_fields(&mut *conn)
            .await
            .is_ok();
            if !updated {
                return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
            }
        } else {
            let created = Event {
                id: None,
                person_id: person_id,
                start_date: start_date.clone(),
                current_date: date.to_string(),
                end_date: end_date.clone(),
                event_type: event_type.clone(),
                notes: notes.clone(),
            }
            .create_event(conn)
            .await;
            if created.is_none() {
                return Ok(json!({"error":"Παρουσιάστηκε σφάλμα"}));
            }
        }
    }

    return Ok(json!({"created":"Επιτυχής δημιουργία γεγονότος"}));
}

#[tauri::command]
pub async fn update_event(
    event_update: serde_json::Value,
    state: State<'_, Database>,
) -> Result<bool, ()> {
    let event_update: Option<EventUpdate> = serde_json::from_value(event_update).ok();
    if event_update.is_none() {
        return Ok(false);
    }
    let event_update = event_update.unwrap();
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let old_start_date: Option<NaiveDate> =
        NaiveDate::parse_from_str(&event_update.old_start_date.unwrap(), "%Y-%m-%d").ok();
    let old_end_date: Option<NaiveDate> =
        NaiveDate::parse_from_str(&event_update.old_end_date.unwrap(), "%Y-%m-%d").ok();
    if old_start_date.is_none() || old_end_date.is_none() {
        return Ok(false);
    }
    let old_start_date = old_start_date.unwrap();
    let old_end_date = old_end_date.unwrap();
    let events: Option<Vec<Event>> = Event::select()
        .where_("person_id=? AND event_type=? AND start_date=? AND end_date=? ")
        .bind(event_update.person_id)
        .bind(event_update.old_event_type)
        .bind(old_start_date.format("%Y-%m-%d").to_string())
        .bind(old_end_date.format("%Y-%m-%d").to_string())
        .fetch_all(&mut *conn)
        .await
        .ok();
    if events.is_none() {
        return Ok(false);
    }
    let events = events.unwrap();
    for event in events.iter() {
        let deleted = event.clone().delete_event(&mut *conn).await;
        if !deleted {
            return Ok(false);
        }
    }

    let start = if event_update.start_date.is_some() {
        event_update.start_date.unwrap()
    } else {
        old_start_date.to_string()
    };
    let new_start_date: Option<NaiveDate> = NaiveDate::parse_from_str(&start, "%Y-%m-%d").ok();

    let end = if event_update.end_date.is_some() {
        event_update.end_date.unwrap()
    } else {
        old_end_date.to_string()
    };
    let new_end_date: Option<NaiveDate> = NaiveDate::parse_from_str(&end, "%Y-%m-%d").ok();

    if new_start_date.is_none() || new_end_date.is_none() {
        return Ok(false);
    }
    let mut init = new_start_date.unwrap();
    let new_end_date = new_end_date.unwrap();
    let new_start_date = new_start_date.unwrap();
    let mut dates: Vec<String> = vec![];
    while init <= new_end_date {
        dates.push(init.format("%Y-%m-%d").to_string());
        init += Duration::try_days(1).unwrap();
    }
    for date in dates.iter() {
        let event_exists = Event::event_exists(event_update.person_id, date.clone(), conn).await;
        if event_exists.is_some() {
            let updated = Event {
                id: Some(event_exists.unwrap() as u32),
                person_id: event_update.person_id,
                start_date: new_start_date.to_string(),
                current_date: date.to_string(),
                end_date: new_end_date.to_string(),
                event_type: if event_update.event_type.is_some() {
                    event_update.event_type
                } else {
                    event_update.old_event_type
                },
                notes: if event_update.notes.is_some() {
                    event_update.notes.clone()
                } else {
                    event_update.old_notes.clone()
                },
            }
            .update_all_fields(&mut *conn)
            .await
            .is_ok();
            if !updated {
                return Ok(false);
            }
        } else {
            let created = Event {
                id: None,
                person_id: event_update.person_id,
                start_date: new_start_date.to_string(),
                current_date: date.to_string(),
                end_date: new_end_date.to_string(),
                event_type: if event_update.event_type.is_some() {
                    event_update.event_type
                } else {
                    event_update.old_event_type
                },
                notes: if event_update.notes.is_some() {
                    event_update.notes.clone()
                } else {
                    event_update.old_notes.clone()
                },
            }
            .create_event(conn)
            .await;
            if created.is_none() {
                return Ok(false);
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub async fn get_event_details(
    id: u32,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης της βάσης δεδομένων"}));
    }
    let conn = conn.as_mut().unwrap();
    let event_details: Option<EventDetails> = Event::get_event_details_by_id(id, conn).await;
    if event_details.is_some() {
        return Ok(json!(event_details));
    }
    return Ok(json!({"error":"Αδυναμία φόρτωσης πληροφορίων γεγονότος"}));
}

#[tauri::command]
pub async fn delete_event_by_id(id: u32, state: State<'_, Database>) -> Result<bool, ()> {
    let mut conn = state.0.lock().await;
    if conn.is_none() {
        return Ok(false);
    }
    let conn = conn.as_mut().unwrap();
    let event: Option<Event> = Event::select()
        .where_("id=?")
        .bind(id)
        .fetch_one(&mut *conn)
        .await
        .ok();
    if event.is_none() {
        return Ok(false);
    }
    let event = event.unwrap();
    let person_id = event.person_id;
    let event_type = event.event_type;
    let start_date: Option<NaiveDate> =
        NaiveDate::parse_from_str(&event.start_date, "%Y-%m-%d").ok();
    let end_date: Option<NaiveDate> = NaiveDate::parse_from_str(&event.end_date, "%Y-%m-%d").ok();

    if start_date.is_none() || end_date.is_none() {
        return Ok(false);
    }
    let start_date = start_date.unwrap();
    let end_date = end_date.unwrap();

    let current_day_counter: Option<u32> =
        Event::count_events(person_id, event.current_date.to_string(), conn).await;
    if current_day_counter.is_none() {
        return Ok(false);
    }
    if (current_day_counter.unwrap() >= 2) && (event_type == None) {
        let deleted = event.delete_event(conn).await;
        if !deleted {
            return Ok(false);
        }
    } else {
        let events: Option<Vec<Event>> = Event::select()
            .where_("person_id=? AND event_type=? AND start_date=? AND end_date=? ")
            .bind(person_id)
            .bind(event_type)
            .bind(start_date.format("%Y-%m-%d").to_string())
            .bind(end_date.format("%Y-%m-%d").to_string())
            .fetch_all(&mut *conn)
            .await
            .ok();
        if events.is_none() {
            return Ok(false);
        }
        let mut events = events.unwrap();
        for event in events.iter_mut() {
            let deleted = event.clone().delete_event(&mut *conn).await;
            if !deleted {
                return Ok(false);
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn export_person_events_history(
    full_name: String,
    events: serde_json::Value,
    path: String,
) -> Result<bool, bool> {
    let events_history: Option<Vec<PersonEventsHistory>> = serde_json::from_value(events).ok();

    if events_history.is_none() {
        return Err(false);
    }
    let events_history = events_history.unwrap();

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let hedader_format = Format::new()
        .set_align(FormatAlign::Center)
        .set_bold()
        .set_font_size(18)
        .set_border(FormatBorder::Thin);

    worksheet
        .merge_range(0, 0, 0, 3, "ΙΣΤΟΡΙΚΟ ΓΕΓΟΝΟΤΩΝ", &hedader_format)
        .map_err(|_| false)?;
    worksheet
        .merge_range(1, 0, 1, 3, &full_name, &hedader_format)
        .map_err(|_| false)?;

    let columns_headers_format = Format::new()
        .set_border(FormatBorder::Thin)
        .set_bold()
        .set_font_size(16)
        .set_align(FormatAlign::Center);
    worksheet
        .write_with_format(2, 0, "Α/Α", &columns_headers_format)
        .map_err(|_| false)?;

    worksheet.set_column_width(0, 5).map_err(|_| false)?;
    worksheet
        .write_with_format(2, 1, "Ημερομηνία", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(1, 15).map_err(|_| false)?;
    worksheet
        .write_with_format(2, 2, "Κατάσταση", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(2, 30).map_err(|_| false)?;
    worksheet
        .write_with_format(2, 3, "Παρατηρήσεις", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(3, 50).map_err(|_| false)?;

    let border_format = Format::new()
        .set_font_size(14)
        .set_border(FormatBorder::Thin);
    let no_notes_format = Format::new()
        .set_font_size(14)
        .set_border(FormatBorder::Thin)
        .set_font_color(Color::RGB(0xE4E4E4));

    for (index, item) in events_history.iter().enumerate() {
        let index = index as u32;
        worksheet.set_row_height(index, 25).map_err(|_| false)?;
        worksheet
            .write_with_format(index + 3, 0, index + 1, &border_format)
            .map_err(|_| false)?;
        worksheet
            .write_with_format(index + 3, 1, &item.current_date, &border_format)
            .map_err(|_| false)?;
        let event_name = if item.event_name.is_empty() {
            "ΠΑΡΩΝ".to_string()
        } else {
            item.event_name.clone()
        };
        worksheet
            .write_with_format(index + 3, 2, event_name, &border_format)
            .map_err(|_| false)?;
        if item.notes.is_none() || item.notes.clone().unwrap().is_empty() {
            worksheet
                .write_with_format(
                    index + 3,
                    3,
                    "(Δεν υπάρχουν παρατηρήσεις)",
                    &no_notes_format,
                )
                .map_err(|_| false)?;
        } else {
            worksheet
                .write_with_format(index + 3, 3, item.notes.clone().unwrap(), &border_format)
                .map_err(|_| false)?;
        }
    }
    let saved = workbook.save(&path.as_str()).is_ok();
    if saved {
        let _ = open::that(&path.as_str());
        return Ok(true);
    }
    Err(false)
}
