import { Flex, Typography, Space } from "antd";
import dayjs from "dayjs";
import { memo, useEffect, useState } from "react";
import { LinearGradient } from "react-text-gradients";
import { TypeAnimation } from "react-type-animation";
const { Title, Text } = Typography;

const DateDisplay = memo(({ curDate, presentDate }) => {
  const [isEffectDisplayed, setIsEffectDisplayed] = useState(false);
  const months = {
    0: "Ιανουαρίου",
    1: "Φεβρουαρίου",
    2: "Μαρτίου",
    3: "Απριλίου",
    4: "Μαΐου",
    5: "Ιουνίου",
    6: "Ιουλίου",
    7: "Αυγούστου",
    8: "Σεπτεμβρίου",
    9: "Οκτωβρίου",
    10: "Νοεμβρίου",
    11: "Δεκεμβρίου",
  };

  const days = {
    1: "Δευτέρας",
    2: "Τρίτης",
    3: "Τετάρτης",
    4: "Πέμπτης",
    5: "Παρασκευής",
    6: "Σαββάτου",
    0: "Κυριακής",
  };

  const isWeekEnd = (date) => {
    return (
      dayjs(date, "DD/MM/YYYY").get("day") === 6 ||
      dayjs(date, "DD/MM/YYYY").get("day") === 0
    );
  };
  useEffect(() => {
    let effect = sessionStorage.getItem("isEffectDisplayed");
    if (effect) {
      setIsEffectDisplayed(effect);
    }
  });
  return (
    <Flex vertical gap={0}>
      <Title style={{ margin: "2px", padding: "2px" }}>
        <LinearGradient
          gradient={
            isWeekEnd(curDate)
              ? ["to left", "#434343,#8c8c8c"]
              : ["to right", "#108ee9 ,#87d068"]
          }
        >
          {isEffectDisplayed ? (
            <span>
              Σεντόνι: {days[dayjs(curDate, "DD/MM/YYYY").day()]}{" "}
              {dayjs(curDate, "DD/MM/YYYY").date()}{" "}
              {months[dayjs(curDate, "DD/MM/YYYY").month()]}{" "}
              {dayjs(curDate, "DD/MM/YYYY").year()}
            </span>
          ) : (
            <TypeAnimation
              sequence={[
                "Σεντόνι ημερήσιων γεγονότων",
                500,
                `Σεντόνι: ${days[dayjs(curDate, "DD/MM/YYYY").day()]} ${dayjs(curDate, "DD/MM/YYYY").date()} ${months[dayjs(curDate, "DD/MM/YYYY").month()]} ${dayjs(curDate, "DD/MM/YYYY").year()}`,
                () => {
                  sessionStorage.setItem("isEffectDisplayed", true);
                },
              ]}
              cursor={true}
              repeat={0}
            />
          )}
        </LinearGradient>
      </Title>
      {!dayjs(curDate, "DD/MM/YYYY").isToday() ? (
        <Space>
          <Text style={{ color: "#d9d9d9" }} strong>
            Σημερινό σεντόνι:
          </Text>
          <Text
            onClick={() => presentDate()}
            underline
            style={{ color: "#d9d9d9" }}
          >
            {days[dayjs().day()]} {dayjs().date()} {months[dayjs().month()]}{" "}
            {dayjs().year()}
          </Text>
        </Space>
      ) : null}
    </Flex>
  );
});

export default DateDisplay;
