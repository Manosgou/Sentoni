use crate::models::Personnel;
use ormlite::model::*;
use ormlite::sqlite::SqliteConnection;

impl Personnel {
    pub async fn create_person(self, conn: &mut SqliteConnection) -> Option<Personnel> {
        self.insert(conn).await.ok()
    }

    pub async fn get_all_personnel_paginated(
        page: u32,
        limit: u32,
        conn: &mut SqliteConnection,
    ) -> Option<Vec<Personnel>> {
        ormlite::query_as(
            "SELECT
                    Personnel.id,
                    Personnel.full_name,
                    Personnel.notes,
                    Personnel.active
                  FROM
                    Personnel
                    LEFT JOIN Hierarchy ON Personnel.id = Hierarchy.person_id
                  ORDER BY
                    Hierarchy.position
                    LIMIT ? OFFSET ? ;",
        )
        .bind(limit)
        .bind(page * 20)
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn get_active_personnel_paginated(
        page: u32,
        limit: u32,
        conn: &mut SqliteConnection,
    ) -> Option<Vec<Personnel>> {
        ormlite::query_as(
            "SELECT
                    Personnel.id,
                    Personnel.full_name,
                    Personnel.notes,
                    Personnel.active
                FROM
                    Personnel
                    LEFT JOIN Hierarchy ON Personnel.id = Hierarchy.person_id
                WHERE
                    Personnel.active = 1
                ORDER BY
                    Hierarchy.position
                LIMIT ? OFFSET ? ;",
        )
        .bind(limit)
        .bind(page * 20)
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn get_active_personnel(conn: &mut SqliteConnection) -> Option<Vec<Personnel>> {
        ormlite::query_as(
            "SELECT
                    Personnel.id,
                    Personnel.full_name,
                    Personnel.notes,
                    Personnel.active
                FROM
                    Personnel
                    LEFT JOIN Hierarchy ON Personnel.id = Hierarchy.person_id
                WHERE
                    Personnel.active = 1
                ORDER BY
                    Hierarchy.position;",
        )
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn get_all_personnel(conn: &mut SqliteConnection) -> Option<Vec<Personnel>> {
        ormlite::query_as(
            "SELECT
                    Personnel.id,
                    Personnel.full_name,
                    Personnel.notes,
                    Personnel.active
                FROM
                    Personnel
                    LEFT JOIN Hierarchy ON Personnel.id = Hierarchy.person_id
                ORDER BY
                    Hierarchy.position;",
        )
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn delete_person(self, conn: &mut SqliteConnection) -> bool {
        self.delete(conn).await.is_ok()
    }

    pub async fn update_person(self, conn: &mut SqliteConnection) -> bool {
        self.update_all_fields(conn).await.is_ok()
    }

    pub async fn count_personnel(conn: &mut SqliteConnection) -> u32 {
        let query = ormlite::query_as(
            "SELECT
                    COUNT(*)
                FROM
                    Personnel;",
        )
        .fetch_all(conn)
        .await
        .ok();
        if query.is_none() {
            return 0;
        }

        query
            .unwrap()
            .into_iter()
            .map(|row: (u32,)| row.0)
            .collect::<Vec<u32>>()[0]
    }

    pub async fn count_active_personnel(conn: &mut SqliteConnection) -> Option<u32> {
        let query = ormlite::query_as(
            "SELECT
                    COUNT(*)
                FROM
                    Personnel
                WHERE
                    active = 1;",
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
