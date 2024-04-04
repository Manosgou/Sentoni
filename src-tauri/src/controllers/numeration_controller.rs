use crate::models::Personnel;
use crate::schemas::{PersonEventsHistory, PersonNumeration};
use crate::Database;
use jsonm::packer::{PackOptions, Packer};
use open;
use rust_xlsxwriter::*;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn get_personnel_numeration(
    start_date: &str,
    end_date: &str,
    events: &str,
    state: State<'_, Database>,
) -> Result<serde_json::Value, ()> {
    let mut packer = Packer::new();
    let options = PackOptions::new();
    let mut conn = state.0.lock().await;
    let active_personnel = Personnel::get_active_personnel(&mut *conn).await;
    if active_personnel.is_none() {
        return Ok(json!({"error":"Αδυναμία φόρτωσης προσωπικού"}));
    }
    let mut person_events: Vec<PersonNumeration> = vec![];
    for person in active_personnel.unwrap().iter() {
        let events: Option<Vec<PersonEventsHistory>> = ormlite::query_as(
            format!(
                "SELECT
               Event.id,
               STRFTIME('%d/%m/%Y', Event.current_date) AS current_date,
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
                    AND Event.event_type IN ({})
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

        if events.is_some() {
            person_events.push(PersonNumeration {
                id: person.id.unwrap(),
                full_name: person.full_name.clone(),
                events: events.unwrap(),
            });
        } else {
            return Ok(json!({"error":"Αδυναμία φόρτωσης γεγονότων προσωπικού"}));
        }
    }
    return Ok(match packer.pack(&json!(person_events), &options) {
        Ok(events) => events,
        Err(_) => json!({"error":"Αδυναμία καταμέτρησης γεγονότων προσωπικού"}),
    });
}

#[tauri::command]
pub fn export_numeration(
    header: Option<String>,
    date_range: &str,
    stats: serde_json::Value,
    path: String,
) -> Result<bool, bool> {
    let stats: Option<Vec<PersonNumeration>> = serde_json::from_value(stats).ok();
    if stats.is_none() {
        return Err(false);
    }
    let stats = stats.unwrap();

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let header_format = Format::new()
        .set_align(FormatAlign::Center)
        .set_bold()
        .set_font_size(18)
        .set_border(FormatBorder::Thin);

    let numeration_header = if header.is_none() {
        "ΚΑΤΑΜΕΤΡΗΣΗ".to_string()
    } else {
        header.unwrap()
    };

    worksheet
        .merge_range(0, 0, 0, 3, &numeration_header, &header_format)
        .map_err(|_| false)?;
    worksheet
        .merge_range(1, 0, 1, 3, date_range, &header_format)
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
        .write_with_format(2, 1, "Ονοματεπώνυμο", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(1, 50).unwrap();
    worksheet
        .write_with_format(2, 2, "Γεγονότα", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(2, 30).map_err(|_| false)?;
    worksheet
        .write_with_format(2, 3, "Πλήθος", &columns_headers_format)
        .map_err(|_| false)?;
    worksheet.set_column_width(3, 10).map_err(|_| false)?;
    let bordered_cell_format = Format::new()
        .set_font_size(14)
        .set_align(FormatAlign::VerticalCenter)
        .set_border(FormatBorder::Thin);

    let mut line = 3;
    for (index, item) in stats.iter().enumerate() {
        let events_counter = if item.events.len() == 0 {
            1
        } else {
            item.events.len() as u32
        };

        if events_counter == 1 {
            worksheet
                .write_with_format(
                    line,
                    0,
                    (index + 1).to_string().as_str(),
                    &bordered_cell_format,
                )
                .map_err(|_| false)?;
            worksheet
                .write_with_format(line, 1, &item.full_name, &bordered_cell_format)
                .map_err(|_| false)?;
            worksheet
                .write_with_format(
                    line,
                    3,
                    &item.events.len().to_string(),
                    &bordered_cell_format,
                )
                .map_err(|_| false)?;
        } else {
            worksheet
                .merge_range(
                    line,
                    0,
                    line + events_counter - 1,
                    0,
                    (index + 1).to_string().as_str(),
                    &bordered_cell_format,
                )
                .map_err(|_| false)?;
            worksheet
                .merge_range(
                    line,
                    1,
                    line + events_counter - 1,
                    1,
                    &item.full_name,
                    &bordered_cell_format,
                )
                .map_err(|_| false)?;

            worksheet
                .merge_range(
                    line,
                    3,
                    line + events_counter - 1,
                    3,
                    &item.events.len().to_string(),
                    &bordered_cell_format,
                )
                .map_err(|_| false)?;
        }
        if item.events.is_empty() {
            worksheet
                .write_with_format(line, 2, "Δεν υπάρχουν γεγονότα", &bordered_cell_format)
                .map_err(|_| false)?;
        } else {
            let mut events_line = line;
            for event in item.events.iter() {
                worksheet
                    .write_with_format(
                        events_line,
                        2,
                        format!("{}:{}", event.event_name, event.current_date),
                        &bordered_cell_format,
                    )
                    .map_err(|_| false)?;
                events_line += 1;
            }
        }
        worksheet
            .merge_range(line - 1, 0, line - 1, 3, "", &bordered_cell_format)
            .map_err(|_| false)?;
        line += events_counter + 1;
    }
    let saved = workbook.save(&path.as_str()).is_ok();
    if saved {
        let _ = open::that(&path.as_str());
        return Ok(true);
    }
    Err(false)
}
