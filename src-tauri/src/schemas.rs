use ormlite::model::FromRow;
use serde::{Deserialize, Serialize};

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct EventDetails {
    #[serde(rename = "eventTypeId")]
    pub event_type_id: u32,
    pub name: String,
    pub color: String,
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    pub notes: String,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct Events {
    pub id: u32,
    pub notes: Option<String>,
    pub date: String,
    #[serde(rename = "eventType")]
    pub event_type: Option<u32>,
    pub name: Option<String>,
    pub color: Option<String>,
    #[serde(rename = "personId")]
    pub person_id: u32,
    #[serde(rename = "fullName")]
    pub full_name: String,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct EventDate {
    pub id: u32,
    #[serde(rename = "eventTypeId")]
    pub event_type_id: Option<u32>,
    pub name: Option<String>,
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "currentDate")]
    pub current_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    pub color: Option<String>,
    pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PersonEvent {
    pub id: u32,
    #[serde(rename = "fullName")]
    pub full_name: String,
    pub notes: String,
    pub events: Vec<EventDate>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AttendanceBookEvent {
    pub name: String,
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "endDate")]
    pub end_date: Option<String>,
    pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AttendanceBook {
    #[serde(rename = "fullName")]
    pub full_name: String,
    #[serde(rename = "selectedEvent")]
    pub selected_event: AttendanceBookEvent,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct PersonEventsHistory {
    pub id: u32,
    #[serde(rename = "currentDate")]
    pub current_date: String,
    pub notes: Option<String>,
    #[serde(rename = "eventTypeId")]
    pub event_type_id: u32,
    #[serde(rename = "eventName")]
    pub event_name: String,
    #[serde(rename = "eventColor")]
    pub event_color: String,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct HierarchyDetails {
    pub id: u32,
    #[serde(rename = "personId")]
    pub person_id: u32,
    #[serde(rename = "fullName")]
    pub full_name: String,
    pub position: u32,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct EventUpdate {
    #[serde(rename = "personId")]
    pub person_id: u32,
    #[serde(rename = "oldEventType")]
    pub old_event_type: Option<u32>,
    #[serde(rename = "eventType")]
    pub event_type: Option<u32>,
    #[serde(rename = "oldStartDate")]
    pub old_start_date: Option<String>,
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "oldEndDate")]
    pub old_end_date: Option<String>,
    #[serde(rename = "endDate")]
    pub end_date: Option<String>,
    #[serde(rename = "oldNotes")]
    pub old_notes: Option<String>,
    pub notes: Option<String>,
}

#[derive(FromRow, Serialize, Deserialize, Debug)]
pub struct PersonNumeration {
    pub id: u32,
    #[serde(rename = "fullName")]
    pub full_name: String,
    pub events: Vec<PersonEventsHistory>,
}
