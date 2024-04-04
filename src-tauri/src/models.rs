use ormlite::model::Model;
use serde::{Deserialize, Serialize};

#[derive(Model, Serialize, Deserialize, Clone, Debug)]
#[ormlite(table = "Personnel")]
pub struct Personnel {
    pub id: Option<u32>,
    #[serde(rename = "fullName")]
    pub full_name: String,
    pub notes: String,
    pub active: u32,
}

#[derive(Model, Serialize, Deserialize, Clone, Debug)]
#[ormlite(table = "EventType")]
pub struct EventType {
    pub id: Option<u32>,
    pub name: String,
    pub color: String,
}

#[derive(Model, Serialize, Deserialize, Clone, Debug)]
#[ormlite(table = "Event")]
pub struct Event {
    pub id: Option<u32>,
    #[serde(rename = "personId")]
    pub person_id: u32,
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "currentDate")]
    pub current_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    #[serde(rename = "eventType")]
    pub event_type: Option<u32>,
    pub notes: Option<String>,
}

#[derive(Model, Serialize, Deserialize, Clone, Copy, Debug)]
#[ormlite(table = "Hierarchy")]
pub struct Hierarchy {
    pub id: Option<u32>,
    pub position: u32,
    #[serde(rename = "personId")]
    pub person_id: u32,
}

#[derive(Model, Serialize, Deserialize, Clone, Debug)]
#[ormlite(table = "Reminder")]
pub struct Reminder {
    pub id: Option<u32>,
    pub date: String,
    pub notes: String,
    #[serde(rename = "isFinished")]
    pub is_finished: u32,
}
