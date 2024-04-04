use crate::models::Hierarchy;
use crate::schemas::HierarchyDetails;
use ormlite::model::*;
use ormlite::sqlite::SqliteConnection;

impl Hierarchy {
    pub async fn create_hierarchy(person_id: u32, conn: &mut SqliteConnection) -> bool {
        ormlite::query(
            "INSERT INTO
                      Hierarchy (person_id, position)
                  VALUES
                      (
                          ?,
                          (
                              SELECT
                                  COUNT(*) AS position
                              FROM
                                  Hierarchy
                          )
                      );",
        )
        .bind(person_id)
        .execute(conn)
        .await
        .is_ok()
    }
    pub async fn get_all_hierarchy(conn: &mut SqliteConnection) -> Option<Vec<HierarchyDetails>> {
        ormlite::query_as(
            "SELECT
                Hierarchy.id,
                Hierarchy.person_id,
                Personnel.full_name,
                Hierarchy.position
            FROM
                Hierarchy
                LEFT JOIN Personnel ON Hierarchy.person_id = Personnel.id
            WHERE
                Personnel.active = 1
            ORDER BY
                Hierarchy.position;",
        )
        .fetch_all(conn)
        .await
        .ok()
    }

    pub async fn update_hierarchy(self, conn: &mut SqliteConnection) -> bool {
        self.update_all_fields(conn).await.is_ok()
    }
}
