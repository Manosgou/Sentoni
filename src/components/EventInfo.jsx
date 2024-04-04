import { Descriptions, Tag, Typography } from "antd";
import dayjs from "dayjs";
import fontColorContrast from "font-color-contrast";
import { memo } from "react";
const { Text } = Typography;
const EventInfo = memo(({ eventDetails }) => {
  const duration =
    dayjs(eventDetails.endDate, "DD/MM/YYYY").diff(
      dayjs(eventDetails.startDate, "DD/MM/YYYY"),
      "day",
    ) + 1;
  return (
    <Descriptions column={1}>
      <Descriptions.Item label="Είδος γεγονότος">
        <Tag
          color={eventDetails.color}
          style={{
            color: eventDetails.color
              ? fontColorContrast(eventDetails.color, 0.7)
              : null,
          }}
        >
          {eventDetails.eventTypeId ? eventDetails.name : "ΠΑΡΩΝ"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Έναρξη γεγονότος">
        {eventDetails.startDate}
      </Descriptions.Item>
      <Descriptions.Item label="Λήξη γεγονότος">
        {eventDetails.endDate}
      </Descriptions.Item>
      <Descriptions.Item label="Επιστροφή">
        <Text>
          {dayjs(eventDetails.endDate, "DD/MM/YYYY")
            .add(1, "day")
            .format("DD/MM/YYYY")}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Διάρκεια">
        <Text>
          {duration} {duration > 1 ? "Ημέρες" : "Ημέρα"}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Σημειώσεις">
        {eventDetails.notes ? (
          <Text copyable={{ tooltips: ["Αντιγραφή", "Επιτυχής αντιγραφή"] }}>
            {eventDetails.notes}
          </Text>
        ) : (
          <Text style={{ color: "#d9d9d9" }}>Δεν υπάρχουν παρατηρήσεις</Text>
        )}
      </Descriptions.Item>
    </Descriptions>
  );
});

export default EventInfo;
