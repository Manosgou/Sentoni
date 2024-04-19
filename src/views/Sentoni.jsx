import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  DeleteTwoTone,
  ExclamationCircleOutlined,
  LoadingOutlined,
  NotificationOutlined,
  PicCenterOutlined,
  PlusCircleOutlined,
  QuestionOutlined,
  SyncOutlined,
  TableOutlined,
  TeamOutlined,
  VerticalAlignBottomOutlined,
  LogoutOutlined,
  LoginOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Badge,
  Button,
  DatePicker,
  Divider,
  Flex,
  FloatButton,
  Form,
  Input,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Popover,
  QRCode,
  message,
  notification,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import fontColorContrast from "font-color-contrast";
import jsonm from "jsonm";
import ldb from "localdata";
import _ from "lodash";
import { lazy, memo, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { InView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import packageJson from "../../package.json";
import { LinearGradient } from "react-text-gradients";
dayjs.extend(isToday);

const { Text } = Typography;
const { Search } = Input;

import LazyComponent from "../components/LazyComponent";

const EventForm = lazy(() => import("../components/EventForm"));
const EventDetails = lazy(() => import("../components/EventDetails"));
const EventModal = lazy(() => import("../components/EventModal"));
const ReminderPanel = lazy(() => import("../components/ReminderPanel"));
const EventInfo = lazy(() => import("../components/EventInfo"));

import DateDisplay from "../components/DateDisplay";
import MonthProgress from "../components/MonthProgress";

const Sentoni = () => {
  const [eventForm] = Form.useForm();
  const [isModalVisible, setModalVisibility] = useState(false);
  const navigate = useNavigate();
  const [curDate, setCurDate] = useState(dayjs().format("DD/MM/YYYY"));
  const [loading, setLoading] = useState(true);
  const [personnelEvents, setPersonnelEvents] = useState([]);
  const [eventsInitialized, setEventsInitialized] = useState(false);
  const [activePersonnelCounter, setActivePersonnelCounter] = useState(0);
  const [eventTypes, setEventTypes] = useState([]);
  const [messageApi, messageContextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const [eventFilters, setEventFilters] = useState([]);
  const [tableFilters, setTableFilters] = useState({
    fullName: "",
    eventType: null,
  });
  const [tablePage, setTablePage] = useState(0);
  const [modalState, setModalState] = useState({ "": {} });
  const [drawerVisibility, setDrawerVisibility] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const dbPath = sessionStorage.getItem("dbPath");
  const unpacker = new jsonm.Unpacker();

  useHotkeys("ctrl+shift+p", () => navigate("/personnel"));
  useHotkeys("ctrl+t", () => navigate("/event-type"));
  useHotkeys("ctrl+m", () =>
    !_.isEmpty(personnelEvents)
      ? navigate("/monthly-events", { state: { curDate } })
      : null,
  );
  useHotkeys("ctrl+shift+c", () =>
    !_.isEmpty(personnelEvents) ? navigate("/numeration") : null,
  );

  useHotkeys("ctrl+shift+a", () =>
    !_.isEmpty(personnelEvents)
      ? navigate("/attendance-book", { state: { curDate } })
      : null,
  );

  useHotkeys("ctrl+n", () => setDrawerVisibility(true));

  const eventStatus = (event) => {
    if (!event) {
      return;
    }
    let startDate = dayjs(event.startDate, "DD/MM/YYYY");
    let endDate = dayjs(event.endDate, "DD/MM/YYYY");
    let currentDate = dayjs(event.currentDate, "DD/MM/YYYY");
    if (startDate.isSame(currentDate) && endDate.isSame(currentDate)) {
      return;
    } else if (endDate.isSame(currentDate)) {
      return (
        <Space>
          <Divider
            type="vertical"
            style={{ backgroundColor: fontColorContrast(event.color, 0.7) }}
          />
          <Space>
            <LoginOutlined />
            <Text
              strong
              underline
              style={{
                fontSize: 12,
                color: fontColorContrast(event.color, 0.7),
              }}
            >
              Λήξη
            </Text>
          </Space>
        </Space>
      );
    } else if (startDate.isSame(currentDate)) {
      return (
        <Space>
          <Divider
            type="vertical"
            style={{ backgroundColor: fontColorContrast(event.color, 0.7) }}
          />
          <Space>
            <LogoutOutlined />
            <Text
              strong
              underline
              style={{
                fontSize: 12,
                color: fontColorContrast(event.color, 0.7),
              }}
            >
              Έναρξη
            </Text>
          </Space>
        </Space>
      );
    }
  };

  const EventsCell = memo(({ record }) => {
    return (
      <InView triggerOnce>
        {({ inView, ref, entry }) => (
          <div ref={ref}>
            {inView ? (
              <Space
                size="small"
                direction={record.events.length > 3 ? "vertical" : "horizontal"}
              >
                {record.events.map((event) => {
                  return (
                    <Space size={1} key={event.id}>
                      <Tag
                        key={event.id}
                        color={event.color}
                        style={{
                          color: event.color
                            ? fontColorContrast(event.color, 0.7)
                            : null,
                        }}
                        onMouseDown={(mouse) =>
                          handleUpdate(mouse, record, event)
                        }
                      >
                        {event.eventTypeId ? event.name : "ΠΑΡΩΝ"}
                        {eventStatus(event)}
                      </Tag>
                      {event.eventTypeId || record.events.length >= 2 ? (
                        event.eventTypeId ? (
                          <Popconfirm
                            title="Η ενέργεια αυτή είναι μη αναστρέψιμη "
                            onConfirm={() => deleteEvent(event.id)}
                            okText="Διαγραφή"
                            cancelText="Άκυρο"
                          >
                            <DeleteTwoTone twoToneColor={"#C70000"} />
                          </Popconfirm>
                        ) : (
                          <DeleteTwoTone
                            twoToneColor={"#C70000"}
                            onClick={() => deleteEvent(event.id)}
                          />
                        )
                      ) : null}
                    </Space>
                  );
                })}
              </Space>
            ) : null}
          </div>
        )}
      </InView>
    );
  });

  const EventsCellActions = memo(({ record }) => {
    if (record.events.length >= 5) {
      return (
        <Tag icon={<ExclamationCircleOutlined />} color="warning">
          Μέγιστο αριθμός γεγονότων
        </Tag>
      );
    } else {
      return (
        <Button
          size="small"
          type="primary"
          ghost={isWeekEnd(curDate)}
          onClick={() => createEmptyEvent(record.id)}
          icon={<PlusCircleOutlined />}
          disabled={record.events.some((event) => !event.eventTypeId)}
        >
          Προσθήκη γεγονότος
        </Button>
      );
    }
  });

  const columns = [
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      width: 250,
      filteredValue: [tableFilters.fullName],
      onFilter: (value, record) => record.fullName.includes(value),
    },
    Table.EXPAND_COLUMN,
    {
      title: "Κατάσταση",
      dataIndex: "eventType",
      width: 500,
      filters: [{ text: "ΠΑΡΩΝ", value: 0 }, ...eventFilters],
      filteredValue: tableFilters.eventType || null,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) =>
        record.events.some((event) => event.eventTypeId === value),
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => <EventsCell record={record} />,
    },
    {
      title: "Ενέργειες",
      key: "action",
      width: 180,
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => <EventsCellActions record={record} />,
    },
  ];

  const deleteEvent = async (id) => {
    await invoke("delete_event_by_id", { id: id }).then((res) => {
      if (res) {
        initDateEvents();
        if (eventsInitialized) {
          if (tableFilters.fullName) {
            fetchPersonnelEvents(0, activePersonnelCounter);
          } else {
            fetchPersonnelEvents(tablePage, 20);
          }
        }
      } else {
        messageApi.error("Αποτυχής διαγραφή");
      }
    });
  };

  const handleUpdate = (mouse, record, event) => {
    switch (mouse.button) {
      case 0:
        setModalVisibility(true);
        let availableEvents = eventTypes.filter(
          (a) => !record.events.some((b) => a.id === b.eventTypeId),
        );
        setModalState(
          !event.eventTypeId
            ? {
                new: {
                  availableEvents: availableEvents,
                  eventId: event.id,
                  personId: record.id,
                  personName: record.fullName,
                  totalEvents: record.events.length,
                },
              }
            : {
                details: {
                  eventId: event.id,
                  personId: record.id,
                  personName: record.fullName,
                  availableEvents: availableEvents,
                },
              },
        );
        break;
      case 1:
        notificationApi.info({
          message: `${record.fullName} \n ${event.currentDate}`,
          description: <EventInfo eventDetails={event} />,
        });
        break;
    }
  };
  const fetchPersonnelEvents = async (page, limit) => {
    await invoke("get_date_events", {
      limit: limit,
      page: page,
      eventDate: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res) {
        let unpacked = unpacker.unpack(res);
        setActivePersonnelCounter(unpacked.activePersonnel);
        setPersonnelEvents(unpacked.events);
      } else {
        messageApi.open({
          type: "error",
          content: "Παρουσιάστηκε σφάλμα",
        });
      }
    });
    setLoading(false);
  };
  const initDateEvents = async () => {
    await invoke("init_date_events", {
      eventDate: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res) {
        setEventsInitialized(true);
      }
    });
  };
  const fetchEventTypes = async () => {
    ldb.get("eventTypes", async (eventTypes) => {
      if (eventTypes) {
        if (eventTypes.needsUpdate) {
          await invoke("get_all_event_types").then((res) => {
            if (res && !res["error"]) {
              ldb.set("eventTypes", { needsUpdate: false, data: res });
              setEventTypes(res);
              let filters = res.map((type) => {
                return { text: type.name, value: type.id };
              });
              setEventFilters(filters);
            } else {
              messageApi.error(res["error"]);
            }
          });
        } else {
          setEventTypes(eventTypes.data);
          let filters = eventTypes.data.map((type) => {
            return { text: type.name, value: type.id };
          });
          setEventFilters(filters);
        }
      } else {
        await invoke("get_all_event_types").then((res) => {
          if (res && !res["error"]) {
            ldb.set("eventTypes", { needsUpdate: false, data: res });
            setEventTypes(res);
            let filters = res.map((type) => {
              return { text: type.name, value: type.id };
            });
            setEventFilters(filters);
          } else {
            messageApi.error(res["error"]);
          }
        });
      }
    });
  };

  const createEmptyEvent = async (id) => {
    await invoke("create_empty_event", {
      pId: id,
      eventDate: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res) {
        switch (Object.keys(res)[0]) {
          case "created":
            messageApi.success(res["created"]);
            break;
          case "max":
            messageApi.info(res["max"]);
            messageApi.info("Αυτόματη ανανέωση");
            break;
          case "error":
            messageApi.error(res["error"]);
            return;
        }
        if (tableFilters.fullName) {
          fetchPersonnelEvents(0, activePersonnelCounter);
        } else {
          fetchPersonnelEvents(tablePage, 20);
        }
      } else {
        messageApi.error("Παρουσιάστηκε σφάλμα");
      }
    });
  };

  const handleOk = () => {
    setModalVisibility(false);
    fetchEventTypes();
    initDateEvents();
    if (eventsInitialized) {
      if (tableFilters.fullName) {
        fetchPersonnelEvents(0, activePersonnelCounter);
      } else {
        fetchPersonnelEvents(tablePage, 20);
      }
    }
  };

  const handleCancel = () => {
    setModalVisibility(false);
  };

  const refresh = () => {
    setLoading(true);
    if (tableFilters.fullName) {
      fetchPersonnelEvents(0, activePersonnelCounter);
    } else {
      fetchPersonnelEvents(tablePage, 20);
    }
    fetchEventTypes();
  };

  const curDateChange = () => {
    fetchEventTypes();
    fetchReminders();
    initDateEvents();
    if (eventsInitialized) {
      if (tableFilters.fullName) {
        fetchPersonnelEvents(0, activePersonnelCounter);
      } else {
        fetchPersonnelEvents(tablePage, 20);
      }
    }
  };

  const debounceCurDateChange = useMemo(
    () => _.debounce(curDateChange, 280),
    [eventsInitialized, tablePage, curDate],
  );

  useEffect(() => {
    if (curDate) {
      debounceCurDateChange();
    }
  }, [eventsInitialized, tablePage, curDate]);

  const onTableChange = (pagination, filters, sorter, extra) => {
    if (curDate) {
      setTableFilters(filters);
      if (filters.eventType) {
        fetchPersonnelEvents(tablePage, activePersonnelCounter);
      }
    }
  };
  const showDrawer = () => {
    setDrawerVisibility(true);
  };

  const onDrawerClose = () => {
    setDrawerVisibility(false);
  };

  const isWeekEnd = (date) => {
    return (
      dayjs(date, "DD/MM/YYYY").get("day") === 6 ||
      dayjs(date, "DD/MM/YYYY").get("day") === 0
    );
  };

  const fetchReminders = async () => {
    setReminderLoading(true);
    await invoke("get_all_reminders", {
      date: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res && !res["error"]) {
        setReminders(res);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setReminderLoading(false);
  };

  const switDB = () => {
    sessionStorage.removeItem("dbPath");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("isEffectDisplayed");
    ldb.delete("eventTypes");
    navigate("/");
  };

  const onPersonSearch = (event) => {
    setTableFilters((prev) => ({
      ...prev,
      fullName: event.target.value.toUpperCase(),
    }));
  };

  const onPersonSearchDebounce = useMemo(
    () => _.debounce(onPersonSearch, 300),
    [tableFilters.fullName],
  );

  const presentDate = () => {
    if (!dayjs(curDate, "DD/MM/YYYY").isToday()) {
      setLoading(true);
      setCurDate(dayjs().format("DD/MM/YYYY"));
    }
  };

  return (
    <>
      {messageContextHolder}
      {notificationContextHolder}
      <Flex align={"flex-start"} justify="space-between" vertical>
        {reminders ? (
          <ReminderPanel
            curDate={curDate}
            reminders={reminders}
            onDrawerClose={onDrawerClose}
            drawerVisibility={drawerVisibility}
            reminderLoading={reminderLoading}
            setReminderLoading={setReminderLoading}
            fetchReminders={fetchReminders}
          />
        ) : null}
        <Space size={0} direction="vertical">
          <DateDisplay curDate={curDate} presentDate={presentDate} />
          <MonthProgress curDate={curDate} />
        </Space>
        <Space size={"small"} align="baseline">
          <Space size={15} align="baseline">
            <Space direction="vertical" align="center">
              <DatePicker
                allowClear={false}
                locale={locale}
                format={"DD/MM/YYYY"}
                value={dayjs(curDate, "DD/MM/YYYY")}
                onChange={(_, dateString) => {
                  if (dateString) {
                    setCurDate(dateString);
                  }
                }}
              />
              <Space>
                <ArrowLeftOutlined
                  onClick={() => {
                    setLoading(true);
                    setCurDate(
                      dayjs(curDate, "DD/MM/YYYY")
                        .subtract(1, "day")
                        .format("DD/MM/YYYY"),
                    );
                  }}
                  style={{ fontSize: "22px" }}
                />
                <Divider type="vertical" />
                <VerticalAlignBottomOutlined
                  style={{
                    fontSize: "22px",
                    color: dayjs(curDate, "DD/MM/YYYY").isToday()
                      ? "#bfbfbf"
                      : null,
                  }}
                  onClick={() => presentDate()}
                />
                <Divider type="vertical" />
                <ArrowRightOutlined
                  onClick={() => {
                    setLoading(true);
                    setCurDate(
                      dayjs(curDate, "DD/MM/YYYY")
                        .add(1, "day")
                        .format("DD/MM/YYYY"),
                    );
                  }}
                  style={{ fontSize: "22px" }}
                />
              </Space>
            </Space>
            <Tooltip
              placement="bottom"
              title="Προσωπικό (Ctrl + Shift + P)"
              mouseEnterDelay={0.3}
            >
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(curDate)}
                onClick={() => navigate("/personnel")}
                icon={<TeamOutlined />}
              >
                Προσωπικό
              </Button>
            </Tooltip>
            <Tooltip
              placement="bottom"
              title="Είδη γεγονότων (Ctrl + T)"
              mouseEnterDelay={0.3}
            >
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(curDate)}
                onClick={() => navigate("/event-type")}
                icon={<CalendarOutlined />}
              >
                Είδη γεγονότων
              </Button>
            </Tooltip>
            <Tooltip
              placement="bottom"
              title="Μηνιαία προβολή (Ctrl + M)"
              mouseEnterDelay={0.3}
            >
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(curDate)}
                onClick={() =>
                  navigate("/monthly-events", {
                    state: {
                      curDate: curDate,
                      eventTypes: eventTypes.map((eventType) => eventType.id),
                    },
                  })
                }
                icon={<PicCenterOutlined />}
                disabled={_.isEmpty(personnelEvents)}
              >
                Μηνιαία προβολή
              </Button>
            </Tooltip>
            <Tooltip
              placement="bottom"
              title="Καταμέτρηση (Ctrl + Shift + S)"
              mouseEnterDelay={0.3}
            >
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(curDate)}
                onClick={() => navigate("/numeration")}
                icon={<BarChartOutlined />}
                disabled={_.isEmpty(personnelEvents)}
              >
                Καταμέτρηση
              </Button>
            </Tooltip>

            <Tooltip
              placement="bottom"
              title="Παρουσιολόγιο (Ctrl + Shift + A)"
              mouseEnterDelay={0.3}
            >
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(curDate)}
                onClick={() =>
                  navigate("/attendance-book", {
                    state: { curDate },
                  })
                }
                icon={<TableOutlined />}
                disabled={_.isEmpty(personnelEvents)}
              >
                Παρουσιολόγιο
              </Button>
            </Tooltip>
            <Badge
              overflowCount={999}
              count={
                reminders
                  ? reminders.filter((reminder) => !reminder.isFinished).length
                  : null
              }
            >
              <Tooltip
                placement="bottom"
                title="Υπενθυμίσεις (Ctrl + N)"
                mouseEnterDelay={0.3}
              >
                <Button
                  loading={loading}
                  type="primary"
                  ghost={isWeekEnd(curDate)}
                  onClick={() => showDrawer()}
                  icon={<NotificationOutlined />}
                >
                  Υπενθυμίσεις
                </Button>
              </Tooltip>
            </Badge>

            <Popconfirm
              title="Είστε σίγουρος πως θέλετε να αλλάξετε βάση δεδομένων;"
              onConfirm={() => switDB()}
              okText="Αλλαγή βάσης"
              cancelText="Άκυρο"
            >
              <Button
                loading={loading}
                type="default"
                icon={<DatabaseOutlined />}
              >
                Τρέχουσα βάση:{" "}
                {dbPath
                  ? dbPath.substring(
                      dbPath.search(/([\\\/])*([a-zA-Z0-9]+\.sqlite)/g),
                    )
                  : null}
              </Button>
            </Popconfirm>
          </Space>
        </Space>
        <Search
          loading={loading}
          allowClear
          style={{ width: 320, marginTop: 5 }}
          placeholder="Αναζήτηση προσωπικού"
          onChange={onPersonSearchDebounce}
          onFocus={() => fetchPersonnelEvents(0, activePersonnelCounter)}
          disabled={_.isEmpty(personnelEvents) || tableFilters.eventType}
          enterButton
        />
        <Divider orientation="center" style={{ margin: 0 }}>
          <Space direction="vertical" size={0}>
            <LinearGradient
              gradient={
                isWeekEnd(curDate)
                  ? ["to right", "#434343,#8c8c8c"]
                  : ["to left", "#108ee9 ,#87d068"]
              }
            >
              <Text style={{ fontSize: 18 }} strong>
                Γεγονότα ημέρας
              </Text>
            </LinearGradient>
            <Space>
              <Text>Σύνολο προσωπικού:</Text>
              {loading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
              ) : (
                <Badge
                  overflowCount={999}
                  count={activePersonnelCounter}
                  showZero
                  color="#1890ff"
                />
              )}
            </Space>
          </Space>
        </Divider>
        <Table
          size="small"
          tableLayout="fixed"
          columns={columns}
          dataSource={personnelEvents}
          rowKey={(record) => record.id}
          loading={loading}
          onChange={onTableChange}
          sticky={{ offsetHeader: 0 }}
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical">
                {record.notes.split("\n").map((note, index) => (
                  <Text
                    key={index}
                    copyable={{
                      tooltips: ["Αντιγραφή", "Επιτυχής αντιγραφή"],
                    }}
                  >
                    {note}
                  </Text>
                ))}
              </Space>
            ),
            rowExpandable: (record) => !_.isEmpty(record.notes),
          }}
          pagination={
            !_.isEmpty(tableFilters.fullName) || tableFilters.eventType
              ? false
              : {
                  position: ["topRight", "bottomRight"],
                  pageSize: 20,
                  showSizeChanger: false,
                  total: activePersonnelCounter,
                  onChange: (page, pageSize) => {
                    setLoading(true);
                    setTablePage(page - 1);
                  },
                }
          }
          locale={{
            emptyText: (
              <Space direction="vertical" size="small">
                <QuestionOutlined style={{ fontSize: "50px" }} />
                <Text disabled>Δεν υπάρχουν δεδομένα</Text>
              </Space>
            ),
          }}
        />
        <Space>
          <Text style={{ color: "#d9d9d9" }}>
            Developed by Manos Gouvrikos
            <Divider type="vertical" /> Copyright (c) 2023-2024 Sentoni v.
            {packageJson.version}
          </Text>
          <Popover
            overlayInnerStyle={{ padding: 0 }}
            content={
              <QRCode
                value={"https://github.com/Manosgou/Sentoni"}
                bordered={false}
              />
            }
          >
            <GithubOutlined style={{ fontSize: 20, color: "#d9d9d9" }} />
          </Popover>
        </Space>
        <FloatButton.Group shape="circle" style={{ left: 15, bottom: 15 }}>
          <FloatButton
            icon={<SyncOutlined />}
            tooltip={<div>Ανανέωση</div>}
            onClick={() => refresh()}
          />
          <FloatButton.BackTop visibilityHeight={300} />
        </FloatButton.Group>
        <LazyComponent
          Component={
            <EventModal
              form={Object.keys(modalState)[0] === "new" ? eventForm : null}
              Content={() => {
                switch (Object.keys(modalState)[0]) {
                  case "new":
                    return (
                      <LazyComponent
                        Component={
                          <EventForm
                            form={eventForm}
                            handleOk={handleOk}
                            availableEvents={modalState.new.availableEvents}
                            eventId={modalState.new.eventId}
                            personId={modalState.new.personId}
                            personName={modalState.new.personName}
                            curDate={curDate}
                          />
                        }
                      />
                    );
                  case "details":
                    return (
                      <LazyComponent
                        Component={
                          <EventDetails
                            eventId={modalState.details.eventId}
                            personId={modalState.details.personId}
                            availableEvents={modalState.details.availableEvents}
                            personName={modalState.details.personName}
                            handleOk={handleOk}
                          />
                        }
                      />
                    );
                }
              }}
              isModalVisible={isModalVisible}
              handleCancel={handleCancel}
            />
          }
        />
      </Flex>
    </>
  );
};

export default Sentoni;
