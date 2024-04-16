use crate::models::Event;
use crate::schemas::EventDetails;
use ormlite::sqlite::SqliteConnection;
use ormlite::Model;

impl Event {
    pub async fn create_event(self, conn: &mut SqliteConnection) -> Option<Event> {
        self.insert(conn).await.ok()
    }

    pub async fn get_event(p_id: u32, date: &str, conn: &mut SqliteConnection) -> Option<Event> {
        Event::select()
            .where_("Event.person_id= ? AND Event.current_date=?")
            .bind(p_id)
            .bind(date)
            .fetch_one(conn)
            .await
            .ok()
    }

    pub async fn get_event_details_by_id(
        id: u32,
        conn: &mut SqliteConnection,
    ) -> Option<EventDetails> {
        ormlite::query_as(
            "SELECT
                    EventType.id AS event_type_id,
                    EventType.name,
                    EventType.color,
                    STRFTIME('%d/%m/%Y',Event.start_date) AS start_date,
                    STRFTIME('%d/%m/%Y',Event.end_date) AS end_date,
                    Event.notes
                FROM
                    Event
                    LEFT JOIN EventType ON EventType.id = Event.event_type
                WHERE
                    Event.id = ?",
        )
        .bind(id)
        .fetch_one(conn)
        .await
        .ok()
    }

    pub async fn event_exists(p_id: u32, date: String, conn: &mut SqliteConnection) -> Option<i32> {
        let event: Result<Event, ormlite::Error> = Event::select()
            .where_("Event.person_id=? AND Event.event_type IS NULL AND Event.current_date=?")
            .bind(p_id)
            .bind(date)
            .fetch_one(conn)
            .await;
        return match event {
            Ok(event) => Some(event.id.unwrap() as i32),
            Err(_) => None,
        };
    }

    pub async fn delete_event(self, conn: &mut SqliteConnection) -> bool {
        self.delete(conn).await.is_ok()
    }

    pub async fn count_events(
        p_id: u32,
        current_date: String,
        conn: &mut SqliteConnection,
    ) -> Option<u32> {
        let counter = ormlite::query_as("SELECT COUNT(EVENT.person_id) FROM EVENT WHERE EVENT.current_date=? AND EVENT.person_id=?")
        .bind(current_date).bind(p_id).fetch_all(conn).await.ok();
        if counter.is_some() {
            return Some(
                counter
                    .unwrap()
                    .into_iter()
                    .map(|row: (u32,)| row.0)
                    .collect::<Vec<u32>>()[0],
            );
        }
        None
    }
}
