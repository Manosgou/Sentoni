import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DoubleLeftOutlined,
  FileExcelOutlined,
  LoadingOutlined,
  QuestionOutlined,
  SyncOutlined,
  VerticalAlignBottomOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import { save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Alert,
  Badge,
  Button,
  DatePicker,
  Divider,
  Flex,
  FloatButton,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Checkbox,
  message,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import fontColorContrast from "font-color-contrast";
import jsonm from "jsonm";
import _ from "lodash";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { InView } from "react-intersection-observer";
import { useLocation, useNavigate } from "react-router-dom";
dayjs.extend(isToday);

const { Title, Text } = Typography;

const AttendanceBook = () => {
  const { state } = useLocation();
  const { curDate } = state;
  const [personnelDetails, setPersonnelDetails] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(dayjs(curDate, "DD/MM/YYYY"));
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const attendaceBookHeader = useRef();
  const [messageApi, contextHolder] = message.useMessage();
  const unpacker = new jsonm.Unpacker();

  const SelectedEventCell = memo(({ record }) => {
    if (record.events.length > 1) {
      return (
        <Select
          placeholder="Επιλέξτε γεγονός"
          allowClear
          size="small"
          style={{ width: 200 }}
          value={record.selectedEvent}
          onChange={(value) => {
            record.selectedEvent = value;
            setPersonnelDetails((current) =>
              current.map((obj) => {
                if (obj.id === record.id) {
                  return record;
                }
                return obj;
              }),
            );
          }}
          notFoundContent={<Text disabled>Δεν υπάρχουν δεδομένα</Text>}
        >
          {record.events.map((event) => {
            return (
              <Select.Option value={JSON.stringify(event)} key={event.id}>
                <Tag
                  color={event.color}
                  style={{
                    color: event.color
                      ? fontColorContrast(event.color, 0.7)
                      : null,
                  }}
                >
                  {event.name}
                </Tag>
              </Select.Option>
            );
          })}
        </Select>
      );
    } else if (record.events.length <= 1) {
      return (
        <InView triggerOnce>
          {({ inView, ref, entry }) => (
            <div ref={ref}>
              {inView ? (
                <Space>
                  <Tag
                    color={
                      record.events.length === 1 ? record.events[0].color : null
                    }
                    style={{
                      color:
                        record.events.length === 1
                          ? record.events[0].color
                            ? fontColorContrast(record.events[0].color, 0.7)
                            : null
                          : null,
                    }}
                  >
                    {record.events.length === 1
                      ? record.events[0].name
                      : "ΠΑΡΩΝ"}
                  </Tag>
                  {record.events.length === 1 ? (
                    <Checkbox
                      checked={record.selectedEvent}
                      onChange={() => {
                        if (record.selectedEvent) {
                          record.selectedEvent = null;
                        } else {
                          record.selectedEvent = JSON.stringify(
                            record.events[0],
                          );
                        }
                        console.log(record.selectedEvent);
                        setPersonnelDetails((current) =>
                          current.map((obj) => {
                            if (obj.id === record.id) {
                              return record;
                            }
                            return obj;
                          }),
                        );
                      }}
                    />
                  ) : null}
                </Space>
              ) : null}
            </div>
          )}
        </InView>
      );
    }
  });

  const FullNameCell = memo(({ fullName, record }) => {
    return (
      <InView triggerOnce>
        {({ inView, ref, entry }) => (
          <div ref={ref}>
            {inView ? (
              <Space align="baseline" size={"large"}>
                <Text>{fullName}</Text>
                {record.selectedEvent ? (
                  record.events.filter((event) => event.eventTypeId !== 0)
                    .length > 1 ? (
                    <CheckCircleTwoTone
                      twoToneColor={"#52c41a"}
                      style={{ fontSize: 20 }}
                    />
                  ) : null
                ) : (
                  <Badge
                    overflowCount={999}
                    count={
                      record.events.filter((event) => event.eventTypeId !== 0)
                        .length > 1
                        ? record.events.filter(
                            (event) => event.eventTypeId !== 0,
                          ).length
                        : null
                    }
                  />
                )}
              </Space>
            ) : null}
          </div>
        )}
      </InView>
    );
  });

  const columns = [
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      render: (fullName, record) => {
        return {
          props: {
            style: {
              borderColor: "#d9d9d9",
            },
          },
          children: <FullNameCell fullName={fullName} record={record} />,
        };
      },
    },
    {
      title: "Γεγονός",
      key: "event",
      filters: [{ text: "Εκτελούν γεγονός", value: true }],
      onFilter: (value, record) => !_.isEmpty(record.events),
      render: (a, record) => {
        return {
          props: {
            style: {
              borderColor: "#d9d9d9",
            },
          },
          children: <SelectedEventCell record={record} />,
        };
      },
    },
  ];

  const fetchDetails = async () => {
    await invoke("fetch_attendance_book_details", {
      eventDate: dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res && !res["error"]) {
        let unpacked = unpacker.unpack(res);
        let formatedDetails = unpacked.map((item) => {
          return {
            id: item.id,
            fullName: item.fullName,
            selectedEvent:
              item.events.length === 1 ? JSON.stringify(item.events[0]) : null,
            events: item.events,
          };
        });
        setPersonnelDetails(formatedDetails);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };

  const refresh = () => {
    setLoading(true);
    fetchDetails();
  };

  const debounceDateChange = useMemo(
    () => _.debounce(fetchDetails, 300),
    [date],
  );

  useEffect(() => {
    if (date) {
      debounceDateChange();
    }
  }, [date]);

  const onTableChange = (selectedRowKeys, selectedRows, info) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys: selectedRowKeys,
    onChange: onTableChange,
  };

  const exportAttendanceBook = async () => {
    setLoading(true);
    let selectedRows = personnelDetails.filter((person) =>
      selectedRowKeys.includes(person.id),
    );
    const formatedRows = selectedRows.map((item) => {
      let selectedEvent = {};
      try {
        selectedEvent = JSON.parse(item.selectedEvent);
      } catch (e) {}
      return {
        fullName: item.fullName,
        selectedEvent: selectedEvent
          ? {
              name: selectedEvent.name,
              startDate: selectedEvent.startDate,
              endDate: selectedEvent.endDate,
              notes: selectedEvent.notes,
            }
          : {
              name: "ΠΑΡΩΝ",
              startDate: null,
              endDate: null,
              notes: null,
            },
      };
    });
    const selected = await save({
      filters: [
        {
          name: "AttendanceBook",
          extensions: ["xlsx"],
        },
      ],
    });
    if (selected) {
      await invoke("generate_attendance_book", {
        header: _.isEmpty(attendaceBookHeader.current.input.value)
          ? null
          : attendaceBookHeader.current.input.value,
        attendaceBook: formatedRows,
        path: selected,
        date: date.format("DD/MM/YYYY"),
      })
        .then((res) => {
          if (res) {
            setSelectedRowKeys([]);
            messageApi.success("Επιτυχής εξαγωγή");
          } else {
            messageApi.error("Παρουσιάστηκε σφάλμα");
          }
        })
        .catch((_) => {
          messageApi.error("Παρουσιάστηκε σφάλμα");
        });
    }
    setLoading(false);
  };

  const isWeekEnd = (date) => {
    return dayjs(date, "DD/MM/YYYY").get("day");
  };

  return (
    <>
      {contextHolder}
      <Flex justify={"space-evenly"} align={"left"} vertical>
        <Space align="baseline">
          <DoubleLeftOutlined
            style={{ fontSize: "22px" }}
            onClick={() => navigate("/sentoni")}
          />
          <Title style={{ margin: "2px", padding: "2px" }}>
            Σύνθεση Παρουσιολογίου - {date.format("DD/MM/YYYY")}
          </Title>
        </Space>
        <Space direction="vertical">
          <Space size={"middle"} align="center">
            <Space align="baseline">
              <Space direction="vertical" align="center">
                <DatePicker
                  locale={locale}
                  allowClear={false}
                  value={date}
                  format={"DD/MM/YYYY"}
                  onChange={(date, _) => {
                    if (date) {
                      setDate(date);
                    }
                  }}
                />
                <Space>
                  <ArrowLeftOutlined
                    onClick={() => {
                      setLoading(true);
                      setDate(dayjs(date, "DD/MM/YYYY").subtract(1, "day"));
                    }}
                    style={{ fontSize: "22px" }}
                  />
                  <Divider type="vertical" />
                  <VerticalAlignBottomOutlined
                    style={{
                      fontSize: "22px",
                      color: dayjs(date, "DD/MM/YYYY").isToday()
                        ? "#bfbfbf"
                        : null,
                    }}
                    onClick={() => {
                      if (!dayjs(date, "DD/MM/YYYY").isToday()) {
                        setLoading(true);
                        setDate(dayjs());
                      }
                    }}
                  />
                  <Divider type="vertical" />
                  <ArrowRightOutlined
                    onClick={() => {
                      setLoading(true);
                      setDate(dayjs(date, "DD/MM/YYYY").add(1, "day"));
                    }}
                    style={{ fontSize: "22px" }}
                  />
                </Space>
              </Space>
              <Button
                loading={loading}
                type="primary"
                ghost={isWeekEnd(date) === 0 || isWeekEnd(date) === 6}
                onClick={() => exportAttendanceBook()}
                disabled={_.isEmpty(selectedRowKeys)}
                icon={<FileExcelOutlined />}
              >
                Εξαγωγή
              </Button>
              {_.isEmpty(selectedRowKeys) ? (
                <Text type="warning">
                  Επιλέξετε τουλάχιστον ένα άτομο για να μπορέσετε να εξάγετε το
                  παρουσιολόγιο
                </Text>
              ) : null}
            </Space>
          </Space>
          {isWeekEnd(date) === 0 || isWeekEnd(date) === 6 ? (
            <Alert
              message={
                <Text>
                  <strong>
                    <u>ΠΡΟΣΟΧΗ!</u>
                  </strong>{" "}
                  ΘΑ ΠΡΟΒΕΙΤΕ ΣΤΗΝ ΕΞΑΓΩΓΗ ΠΑΡΟΥΣΙΟΛΟΓΙΟΥ ΓΙΑ{" "}
                  <strong>
                    <u>
                      {isWeekEnd(date) === 0
                        ? "ΤΗΝ ΚΥΡΙΑΚΗ"
                        : isWeekEnd(date) === 6
                          ? "ΤΟ ΣΑΒΒΑΤΟ"
                          : null}
                    </u>
                  </strong>
                </Text>
              }
              type="warning"
            />
          ) : null}
        </Space>
        <Divider orientation="center" style={{ margin: 5 }}>
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 18 }} strong>
              Προσωπικού παρουσιλογίου
            </Text>
            <Space>
              <Text> Σύνολο προσωπικού:</Text>
              {loading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
              ) : (
                <Badge
                  overflowCount={999}
                  count={personnelDetails.length}
                  showZero
                  color="#1890ff"
                />
              )}
            </Space>
            {!_.isEmpty(selectedRowKeys) ? (
              <Space>
                <Text> Επιλέχθηκαν:</Text>
                <Badge
                  count={selectedRowKeys.length}
                  showZero
                  color="#52c41a"
                />
              </Space>
            ) : null}
          </Space>
        </Divider>
        <Space size={"large"} direction="vertical">
          <Input
            ref={attendaceBookHeader}
            showCount
            maxLength={50}
            allowClear
            disabled={_.isEmpty(personnelDetails) || loading}
            placeholder={`Επικεφαλίδα παρουσιολογίου,σε περίπτωση που αφήσετε το παρών πεδίο κενό θα εισαχθεί αυτόματα η ακόλουθη επικεφαλίδα "ΠΑΡΟΥΣΙΟΛΟΓΙΟ - ${curDate}"`}
          />
          <Table
            size="small"
            bordered
            scroll={{ y: 1000 }}
            pagination={false}
            dataSource={personnelDetails}
            rowSelection={rowSelection}
            loading={loading}
            columns={columns}
            rowKey={(record) => record.id}
            sticky={{ offsetHeader: 0 }}
            locale={{
              emptyText: (
                <Space direction="vertical" size="small">
                  <QuestionOutlined style={{ fontSize: "50px" }} />{" "}
                  <Text disabled>Δεν υπάρχουν δεδομένα</Text>
                </Space>
              ),
            }}
          />
        </Space>
        <FloatButton.Group shape="circle" style={{ right: 50, bottom: 50 }}>
          <FloatButton
            icon={<SyncOutlined />}
            tooltip={<div>Ανανέωση</div>}
            onClick={() => refresh()}
          />
          <FloatButton.BackTop visibilityHeight={300} />
        </FloatButton.Group>
      </Flex>
    </>
  );
};

export default AttendanceBook;
