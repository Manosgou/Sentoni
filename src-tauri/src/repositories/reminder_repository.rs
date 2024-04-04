use crate::models::Reminder;
use ormlite::model::{HasModelBuilder, ModelBuilder};
use ormlite::sqlite::SqliteConnection;
use ormlite::Model;

impl Reminder {
    pub async fn create_reminder(&self, conn: &mut SqliteConnection) -> bool {
        return match &self.clone().insert(conn).await {
            Ok(_) => true,
            Err(_) => false,
        };
    }

    pub async fn delete_reminder(&self, conn: &mut SqliteConnection) -> bool {
        return match &self.clone().delete(conn).await {
            Ok(_) => true,
            Err(_) => false,
        };
    }

    pub async fn update_reminder(&self, conn: &mut SqliteConnection) -> bool {
        return match &self.clone().update_all_fields(conn).await {
            Ok(_) => true,
            Err(_) => false,
        };
    }

    pub async fn get_reminder_by_id(id: u32, conn: &mut SqliteConnection) -> Option<Reminder> {
        return Reminder::select()
            .where_("id=?")
            .bind(id)
            .fetch_one(conn)
            .await
            .ok();
    }

    pub async fn update_reminder_status(
        reminder: Reminder,
        status: u32,
        conn: &mut SqliteConnection,
    ) -> bool {
        reminder
            .update_partial()
            .is_finished(status)
            .update(conn)
            .await
            .is_ok()
    }

    pub async fn update_reminder_date(
        reminder: Reminder,
        date: String,
        conn: &mut SqliteConnection,
    ) -> bool {
        reminder
            .update_partial()
            .date(date)
            .update(conn)
            .await
            .is_ok()
    }

    pub async fn count_reminders(date: &String, conn: &mut SqliteConnection) -> Option<u32> {
        let counter = ormlite::query_as("SELECT COUNT(*) FROM Reminder WHERE Reminder.date=?")
            .bind(date)
            .fetch_all(conn)
            .await
            .ok();
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

    pub async fn get_all_reminders(
        date: String,
        conn: &mut SqliteConnection,
    ) -> Option<Vec<Reminder>> {
        Reminder::select()
            .where_("date= ?")
            .bind(date)
            .fetch_all(conn)
            .await
            .ok()
    }
}
