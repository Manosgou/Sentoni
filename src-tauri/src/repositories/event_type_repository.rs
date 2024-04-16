use crate::models::EventType;
use ormlite::sqlite::SqliteConnection;
use ormlite::Model;

impl EventType {
    pub async fn create_event_type(self, conn: &mut SqliteConnection) -> bool {
        self.insert(conn).await.is_ok()
    }

    pub async fn get_all_event_types_paginated(
        page: u32,
        conn: &mut SqliteConnection,
    ) -> Option<Vec<EventType>> {
        ormlite::query_as(
            "SELECT
                    *
                FROM
                    EventType
                LIMIT
                    20 OFFSET ?;",
        )
        .bind(page * 20)
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn get_all_event_types(conn: &mut SqliteConnection) -> Option<Vec<EventType>> {
        EventType::select().fetch_all(conn).await.ok()
    }

    pub async fn delete_event_type(self, conn: &mut SqliteConnection) -> bool {
        self.delete(conn).await.is_ok()
    }

    pub async fn update_event_type(self, conn: &mut SqliteConnection) -> bool {
        self.update_all_fields(conn).await.is_ok()
    }

    pub async fn count_event_types(conn: &mut SqliteConnection) -> Option<u32> {
        let query = ormlite::query_as(
            "SELECT
            COUNT(*)
        FROM
            EventType;",
        )
        .fetch_all(conn)
        .await
        .ok();
        if query.is_some() {
            return Some(
                query
                    .unwrap()
                    .into_iter()
                    .map(|row: (u32,)| row.0)
                    .collect::<Vec<u32>>()[0],
            );
        }
        None
    }
}
