use crate::models::Personnel;
use crate::schemas::{AttendanceBook, EventDate, PersonEvent};
use crate::Database;
use jsonm::packer::{PackOptions, Packer};
use open;
use rust_xlsxwriter::*;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn fetch_attendance_book_details(
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
    let active_personnel: Option<Vec<Personnel>> = Personnel::get_active_personnel(conn).await;
    if active_personnel.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης προσωπικού"}));
    }
    let mut person_events: Vec<PersonEvent> = vec![];

    for person in active_personnel.unwrap().iter() {
        let person_event: Option<Vec<EventDate>> = ormlite::query_as(
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
            LEFT JOIN Hierarchy ON Event.person_id = Hierarchy.person_id
          WHERE
            EVENT.current_date = ?
            AND Event.person_id = ?
            AND EventType.id !=0
          ORDER BY
            Hierarchy.position;",
        )
        .bind(event_date)
        .bind(person.id)
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
            return Ok(json!({"error":"Αδυναμία φόρτωσης γεγονότων προσωπικού"}));
        }
    }
    return Ok(match packer.pack(&json!(person_events), &options) {
        Ok(events) => events,
        Err(_) => json!({"error":"Αδυναμία φόρτωσης γεγονότων παρουσιολογίου"}),
    });
}

#[tauri::command]
pub fn generate_attendance_book(
    header: Option<String>,
    attendace_book: serde_json::Value,
    date: String,
    path: String,
) -> Result<bool, bool> {
    let attendace_book: Option<Vec<AttendanceBook>> = serde_json::from_value(attendace_book).ok();
    if attendace_book.is_none() {
        return Err(false);
    }

    let attendace_book = attendace_book.unwrap();
    let attendance_book_header: String = if header.is_none() {
        "ΠΑΡΟΥΣΙΟΛΟΓΙΟ".to_string()
    } else {
        header.unwrap()
    };
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet
        .merge_range(
            0,
            0,
            0,
            4,
            format!("{attendance_book_header} - {date}").as_str(),
            &Format::new()
                .set_align(FormatAlign::Center)
                .set_bold()
                .set_font_size(18)
                .set_border(FormatBorder::Thin),
        )
        .map_err(|_| false)?;

    let columns_headers_format = Format::new()
        .set_border(FormatBorder::Thin)
        .set_bold()
        .set_font_size(16)
        .set_align(FormatAlign::Center);
    worksheet
        .write_with_format(1, 0, "Α/Α", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(0, 5).map_err(|_| false)?;
    worksheet
        .write_with_format(1, 1, "Ονοματεπώνυμο", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(1, 50).map_err(|_| false)?;
    worksheet
        .write_with_format(1, 2, "Κατάσταση", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(2, 30).map_err(|_| false)?;
    worksheet
        .write_with_format(1, 3, "Έναρξη - Λήξη", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(3, 40).map_err(|_| false)?;
    worksheet
        .write_with_format(1, 4, "Παρατηρήσεις", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(4, 25).map_err(|_| false)?;

    let align_center_format = Format::new()
        .set_font_size(14)
        .set_align(FormatAlign::Center)
        .set_border(FormatBorder::Thin);

    let align_left_format = Format::new()
        .set_font_size(14)
        .set_align(FormatAlign::Left)
        .set_border(FormatBorder::Thin);

    let bold_format = Format::new()
        .set_font_size(14)
        .set_bold()
        .set_align(FormatAlign::Center)
        .set_border(FormatBorder::Thin);

    let present_format = Format::new()
        .set_font_size(14)
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::VerticalCenter)
        .set_align(FormatAlign::Center)
        .set_font_color(Color::RGB(0xE4E4E4));
    for (index, item) in attendace_book.iter().enumerate() {
        let index = index as u32;
        worksheet.set_row_height(index + 2, 25).map_err(|_| false)?;
        worksheet
            .write_with_format(index + 2, 0, index + 1, &align_center_format)
            .map_err(|_| false)?;
        worksheet
            .write_with_format(index + 2, 1, &item.full_name, &align_left_format)
            .map_err(|_| false)?;
        worksheet
            .write_with_format(index + 2, 2, &item.selected_event.name, &bold_format)
            .map_err(|_| false)?;
        match item.selected_event.name.as_str() {
            "ΠΑΡΩΝ" => {
                worksheet
                    .write_with_format(index + 2, 3, "Ώρα Εισόδου", &present_format)
                    .map_err(|_| false)?;
                worksheet
                    .write_with_format(index + 2, 4, "ΥΠΟΓΡΑΦΗ", &present_format)
                    .map_err(|_| false)?;
            }
            _ => {
                worksheet
                    .write_with_format(
                        index + 2,
                        3,
                        format!(
                            "ΑΠΟ {} | ΕΩΣ {}",
                            item.selected_event.start_date.clone().unwrap(),
                            item.selected_event.end_date.clone().unwrap()
                        ),
                        &align_center_format,
                    )
                    .map_err(|_| false)?;
                worksheet
                    .write_with_format(
                        index + 2,
                        4,
                        item.selected_event.notes.as_ref(),
                        &align_center_format,
                    )
                    .map_err(|_| false)?;
            }
        }
    }
    let saved = workbook.save(&path.as_str()).is_ok();
    if saved {
        let _ = open::that(&path.as_str());
        return Ok(true);
    }
    Err(false)
}
