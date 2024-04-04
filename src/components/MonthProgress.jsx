import { Progress, Space, Typography } from "antd";
import dayjs from "dayjs";
import { memo } from "react";
const { Text } = Typography;

const MonthProgress = memo(({ curDate }) => {
  const months = {
    0: "Ιανουάριος",
    1: "Φεβρουάριος",
    2: "Μάρτιος",
    3: "Απρίλιος",
    4: "Μάιος",
    5: "Ιούνιος",
    6: "Ιούλιος",
    7: "Αύγουστος",
    8: "Σεπτέμβριος",
    9: "Οκτώβριος",
    10: "Νοέμβριος",
    11: "Δεκέμβριος",
  };
  const getDate = () => {
    return dayjs(curDate, "DD/MM/YYYY").date();
  };

  const getDaysInMonth = () => {
    return dayjs(curDate, "DD/MM/YYYY").daysInMonth();
  };
  const monthPercent = () => {
    return ((getDate() - 1) / (getDaysInMonth() - 1)) * 100;
  };

  const isWeekEnd = (date) => {
    return (
      dayjs(date, "DD/MM/YYYY").get("day") === 6 ||
      dayjs(date, "DD/MM/YYYY").get("day") === 0
    );
  };
  return (
    <Space size={"middle"} align="baseline">
      <Text type={monthPercent() === 100 ? "success" : null}>
        {months[dayjs(curDate, "DD/MM/YYYY").month()]}{" "}
        {dayjs(curDate, "DD/MM/YYYY").year()}
      </Text>
      <Progress
        style={{ width: 550 }}
        percent={monthPercent()}
        format={(percent) => (
          <Text
            type={percent === 100 ? "success" : null}
          >{`Ημέρα: ${getDate()}/${getDaysInMonth()} ~ (${Math.round(percent)}%)`}</Text>
        )}
        strokeColor={
          isWeekEnd(curDate)
            ? { from: "#8c8c8c", to: "#bfbfbf" }
            : { from: "#108ee9", to: "#87d068" }
        }
        status={monthPercent() === 100 ? "active" : null}
      />
    </Space>
  );
});

export default MonthProgress;
