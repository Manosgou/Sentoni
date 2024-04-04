import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DoubleLeftOutlined,
  VerticalAlignBottomOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  DatePicker,
  Divider,
  Flex,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  notification,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import fontColorContrast from "font-color-contrast";
import jsonm from "jsonm";
import _ from "lodash";
import { lazy, memo, useEffect, useMemo, useState } from "react";
import { InView } from "react-intersection-observer";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
dayjs.extend(isToday);
const { Title, Text } = Typography;

const EventInfo = lazy(() => import("../components/EventInfo"));

const { Search } = Input;

const MonthlyEvents = () => {
  const { state } = useLocation();
  const { curDate, eventTypes } = state;
  const [columns, setColumns] = useState([]);
  const [events, setEvents] = useState();
  const [month, setMonth] = useState(dayjs(curDate, "DD/MM/YYYY"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [personSearch, setPersonSearch] = useState("");
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const unpacker = new jsonm.Unpacker();
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  const [selectedEventTypeOptions, setSelectedEventTypeOptions] =
    useState(eventTypes);

  const monthToDays = (month) => {
    let dates = [];
    let monthLen = month.daysInMonth();
    for (let day = 1; day <= monthLen; day++) {
      dates.push(month.date(day).format("DD/MM/YYYY"));
    }
    return dates;
  };

  const fetchPersonEventHistory = async (stratDate, endDate) => {
    await invoke("fetch_monthly_person_events", {
      startDate: dayjs(stratDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      endDate: dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      events: selectedEventTypeOptions.join(","),
    }).then((res) => {
      if (res && !res["error"]) {
        let unpacked = unpacker.unpack(res);
        setEvents(unpacked);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };

  const FullNameCell = memo(({ fullName, inViewport, forwardedRef }) => {
    return (
      <InView triggerOnce>
        {({ inView, ref, entry }) => (
          <div ref={ref}>
            {inView ? <Text style={{ fontSize: 13 }}>{fullName}</Text> : null}
          </div>
        )}
      </InView>
    );
  });

  const cl = [
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      width: 150,
      fixed: "left",
      filteredValue: [personSearch] || null,
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      onFilter: (value, record) => record.fullName.includes(value),
      render: (_, record) => {
        return {
          props: {
            style: {
              borderColor: "#bfbfbf",
            },
          },
          children: <FullNameCell fullName={record.fullName} />,
        };
      },
    },
    ...columns,
  ];

  const showDetails = async (person, eventDetails) => {
    if (person && eventDetails) {
      notificationApi.info({
        message: `${person} \n ${eventDetails.currentDate}`,
        description: <EventInfo eventDetails={eventDetails} />,
      });
    }
  };

  const EventCell = memo(({ record, date }) => {
    return (
      <InView triggerOnce>
        {({ inView, ref, entry }) => (
          <div ref={ref}>
            {inView ? (
              <Space
                direction="vertical"
                size="middle"
                style={{
                  display: "flex",
                }}
              >
                {record.events.map((event) => {
                  if (event.currentDate === date) {
                    return (
                      <Tag
                        key={event.id}
                        color={event.color}
                        onClick={() => showDetails(record.fullName, event)}
                        style={{
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        <Text
                          ellipsis={true}
                          style={{
                            color: event.color
                              ? fontColorContrast(event.color, 0.7)
                              : null,
                            fontSize: 12,
                          }}
                        >
                          {" "}
                          {event.eventTypeId ? event.name : "ΠΑΡΩΝ"}
                        </Text>
                      </Tag>
                    );
                  }
                })}
              </Space>
            ) : null}
          </div>
        )}
      </InView>
    );
  });

  const days = {
    1: "Δευ",
    2: "Τρί",
    3: "Τετ",
    4: "Πέμ",
    5: "Παρ",
    6: "Σάβ",
    0: "Κυρ",
  };

  const DateColumn = memo(({ date }) => {
    return (
      <InView triggerOnce>
        {({ inView, ref, entry }) => (
          <div ref={ref}>
            {inView ? (
              <Space direction="vertical" size={0}>
                <Text style={{ fontSize: 14 }}>
                  {days[dayjs(date, "DD/MM/YYYY").day()]}
                </Text>
                <Text style={{ fontSize: 11 }}>
                  {dayjs(date, "DD/MM/YYYY").format("DD/MM")}
                </Text>
              </Space>
            ) : null}
          </div>
        )}
      </InView>
    );
  });

  const onMonthChange = () => {
    let dates = monthToDays(month);
    fetchPersonEventHistory(dates[0], dates.slice(-1)[0]);
    const cols = dates.map((date) => {
      return {
        title: <DateColumn date={date} />,
        width: 68,
        render: (_, record) => {
          return {
            props: {
              style: {
                background: isWeekEnd(date) ? "#d9d9d9" : null,
                borderColor: "#bfbfbf",
              },
            },
            children: <EventCell record={record} date={date} />,
          };
        },
      };
    });
    setColumns(cols);
  };
  const isWeekEnd = (date) => {
    return (
      dayjs(date, "DD/MM/YYYY").get("day") === 6 ||
      dayjs(date, "DD/MM/YYYY").get("day") === 0
    );
  };
  const debounceMonthChange = useMemo(
    () => _.debounce(onMonthChange, 500),
    [month, selectedEventTypeOptions],
  );

  useEffect(() => {
    fetchEventTypes();
    debounceMonthChange();
  }, [month, selectedEventTypeOptions]);

  const onPersonSearch = (e) => {
    setPersonSearch(e.target.value.toUpperCase());
  };
  const onPersonSearchDebounce = useMemo(
    () => _.debounce(onPersonSearch, 300),
    [personSearch],
  );

  const fetchEventTypes = async () => {
    ldb.get("eventTypes", async (eventTypes) => {
      if (eventTypes) {
        if (eventTypes.needsUpdate) {
          await invoke("get_all_event_types").then((res) => {
            if (res && !res["error"]) {
              ldb.set("eventTypes", { needsUpdate: false, data: res });
              let options = res.map((type) => {
                return { label: type.name, value: type.id, color: type.color };
              });
              setEventTypeOptions(options);
            } else {
              messageApi.error(res["error"]);
            }
          });
        } else {
          let options = eventTypes.data.map((type) => {
            return { label: type.name, value: type.id, color: type.color };
          });
          setEventTypeOptions(options);
        }
      } else {
        await invoke("get_all_event_types").then((res) => {
          if (res && !res["error"]) {
            ldb.set("eventTypes", { needsUpdate: false, data: res });
            let options = res.map((type) => {
              return { label: type.name, value: type.id, color: type.color };
            });
            setEventTypeOptions(options);
          } else {
            messageApi.error(res["error"]);
          }
        });
      }
    });
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <>
      {messageContextHolder}
      {notificationContextHolder}
      <Flex justify={"space-evenly"} align={"left"} vertical>
        <Space align="baseline">
          <DoubleLeftOutlined
            style={{ fontSize: "22px" }}
            onClick={() => navigate("/sentoni")}
          />
          <Title style={{ margin: "2px", padding: "2px" }}>
            Μηνιαία προβολή{month ? " - " + month.format("MM/YYYY") : null}
          </Title>
        </Space>
        <Space direction="vertical" size="middle">
          <Space direction="vertical" align="left">
            <Space align="start">
              <Space direction="vertical" align="center">
                <DatePicker
                  allowClear={false}
                  value={month}
                  format={"MM/YYYY"}
                  style={{ width: 200 }}
                  locale={locale}
                  onChange={(month, monthString) => {
                    if (month) {
                      setMonth(month);
                    } else {
                      setColumns([]);
                      setEvents([]);
                      setMonth(null);
                    }
                  }}
                  picker="month"
                />
                <Space>
                  <ArrowLeftOutlined
                    onClick={() => {
                      setLoading(true);
                      setMonth(dayjs(month, "DD/MM/YYYY").subtract(1, "month"));
                    }}
                    style={{ fontSize: "22px" }}
                  />
                  <Divider type="vertical" />
                  <VerticalAlignBottomOutlined
                    style={{
                      fontSize: "22px",
                      color: dayjs(month, "DD/MM/YYYY").isToday()
                        ? "#bfbfbf"
                        : null,
                    }}
                    onClick={() => {
                      if (!dayjs(month, "DD/MM/YYYY").isToday()) {
                        setLoading(true);
                        setMonth(dayjs());
                      }
                    }}
                  />
                  <Divider type="vertical" />
                  <ArrowRightOutlined
                    onClick={() => {
                      setLoading(true);
                      setMonth(dayjs(month, "DD/MM/YYYY").add(1, "month"));
                    }}
                    style={{ fontSize: "22px" }}
                  />
                </Space>
              </Space>
              <Select
                maxTagCount={"responsive"}
                virtual
                showSearch
                allowClear
                value={selectedEventTypeOptions}
                filterOption={filterOption}
                mode="multiple"
                onChange={(value) => {
                  setLoading(true);
                  setSelectedEventTypeOptions(value);
                }}
                style={{ width: "300px" }}
                placeholder="Παρακαλώ επιλέξτε τουλάχιστον ένα γεγονός"
                options={eventTypeOptions}
                optionRender={(option) => (
                  <Tag
                    style={{
                      color: option.data.color
                        ? fontColorContrast(option.data.color, 0.7)
                        : null,
                    }}
                    color={option.data.color}
                  >
                    {option.data.label}
                  </Tag>
                )}
                notFoundContent={
                  <Text style={{ color: "#d9d9d9" }}>
                    Δεν υπάρχουν διαθέσιμα είδη γεγονότων,
                    <Link to="/event-type" state={{ modalVisibility: true }}>
                      δημηιουργήστε εδώ
                    </Link>
                  </Text>
                }
              />
            </Space>
            <Search
              loading={loading}
              allowClear
              style={{ width: 291, marginTop: 5 }}
              placeholder="Αναζήτηση προσωπικού"
              onChange={onPersonSearchDebounce}
              disabled={_.isEmpty(events)}
              enterButton
            />
          </Space>
          <Table
            size="small"
            bordered={true}
            dataSource={events}
            columns={events ? cl : null}
            scroll={{ x: 800, y: 800 }}
            rowKey={(record) => record.id}
            loading={loading}
            pagination={false}
            sticky={{ offsetHeader: 0 }}
            locale={{
              emptyText: <Text disabled>Δεν υπάρχουν δεδομένα</Text>,
            }}
          />
        </Space>
      </Flex>
    </>
  );
};

export default MonthlyEvents;
