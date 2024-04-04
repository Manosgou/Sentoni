import {
  CloseCircleOutlined,
  DoubleLeftOutlined,
  QuestionOutlined,
  SearchOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Button,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import fontColorContrast from "font-color-contrast";
import jsonm from "jsonm";
import ldb from "localdata";
import _ from "lodash";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { save } from "@tauri-apps/api/dialog";
import { Link } from "react-router-dom";
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

const Numeration = () => {
  const [form] = Form.useForm();
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [tableFilters, setTableFilters] = useState({
    fullName: "",
    total: null,
  });
  const numerationHeader = useRef();
  const unpacker = new jsonm.Unpacker();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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

  const fetchStats = async (values) => {
    setLoading(true);
    const startDate = dayjs(values["range"][0], "DD/MM/YYYY").format(
      "YYYY-MM-DD",
    );
    const endDate = dayjs(values["range"][1], "DD/MM/YYYY").format(
      "YYYY-MM-DD",
    );
    const events = values["events"].join(",");
    await invoke("get_personnel_numeration", {
      startDate: startDate,
      endDate: endDate,
      events: events,
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

  const countUniqueEvents = (e) => {
    let res = {};
    e.events.forEach(function (v) {
      res[v.eventTypeId] = (res[v.eventTypeId] || 0) + 1;
    });
    return res;
  };

  const columns = [
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      filteredValue: [tableFilters.fullName] || null,
      onFilter: (value, record) => record.fullName.includes(value),
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    },
    {
      title: "Γεγονότα",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => {
        if (record.events.length > 0) {
          return (
            <Timeline
              items={record.events.map((event) => {
                return {
                  children: (
                    <Space>
                      <Text italic>{event.currentDate}:</Text>
                      <Tag
                        color={event.eventColor}
                        style={{
                          color: event.eventColor
                            ? fontColorContrast(event.eventColor, 0.7)
                            : null,
                        }}
                      >
                        {event.eventName}
                      </Tag>
                    </Space>
                  ),
                  color: event.eventColor,
                };
              })}
            />
          );
        } else {
          return (
            <Tag icon={<CloseCircleOutlined />} color="error">
              Δεν υπάρχουν γεγονότα
            </Tag>
          );
        }
      },
    },
    {
      title: "Πλήθος",
      key: "total",
      filters: [
        { text: "Εκτέλεσαν κάποιο γεγονός", value: true },
        { text: "Δεν εκτέλεσαν κάποιο γεγονός", value: false },
      ],
      filteredValue: tableFilters.total || null,
      onFilter: (value, record) => {
        if (value) {
          return record.events.length > 0;
        } else {
          return record.events.length === 0;
        }
      },
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => (
        <Space direction="vertical" style={{ width: 200 }}>
          {Object.entries(countUniqueEvents(record)).map((value) => {
            let eventType = eventTypeOptions.filter(
              (eventType) => eventType.value === parseInt(value[0]),
            )[0];
            return (
              <Space key={parseInt(value[0])} size={"small"}>
                <Tag
                  color={eventType.color}
                  style={{
                    color: eventType.color
                      ? fontColorContrast(eventType.color, 0.7)
                      : null,
                  }}
                >
                  {eventType.label}
                </Tag>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  : {value[1]}
                </Text>
              </Space>
            );
          })}
          {record.events.length > 0 ? (
            <Divider
              style={{ width: "100%", borderColor: "#bfbfbf", margin: 0 }}
            />
          ) : null}
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Σύνολο: {record.events.length}
          </Text>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination, filters, sorter, extra) => {
    setSelectedRowKeys([]);
    setTableFilters(filters);
  };

  const onRowSelection = (newSelectedRowKeys, selectedRows) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    columnWidth: 60,
    selectedRowKeys: selectedRowKeys,
    onChange: onRowSelection,
  };

  const exportNumeration = async () => {
    setLoading(true);
    if (selectedRowKeys) {
      const selected = await save({
        filters: [
          {
            name: "AttendanceBook",
            extensions: ["xlsx"],
          },
        ],
      });
      if (selected) {
        await invoke("export_numeration", {
          header: _.isEmpty(numerationHeader.current.input.value)
            ? null
            : numerationHeader.current.input.value,
          dateRange: `ΑΠΟ: ${form.getFieldValue("range")[0].format("DD/MM/YYYY")} | ΕΩΣ: ${form.getFieldValue("range")[1].format("DD/MM/YYYY")} `,
          stats: events.filter((event) => selectedRowKeys.includes(event.id)),
          path: selected,
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
    }
    setLoading(false);
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    fetchEventTypes();
  }, []);

  return (
    <>
      {messageContextHolder}
      <Flex justify={"space-evenly"} align={"left"} vertical>
        <Space align="baseline">
          <DoubleLeftOutlined
            style={{ fontSize: "22px" }}
            onClick={() => navigate("/sentoni")}
          />
          <Title style={{ margin: "2px", padding: "2px" }}>Kαταμέτρηση</Title>
        </Space>
        <Form
          layout={"inline"}
          form={form}
          onFinish={(values) => fetchStats(values)}
        >
          <Form.Item
            name="range"
            label="Διάρκεια"
            rules={[
              {
                required: true,
                message: "Το πεδίο διάρκεια είναι υποχρεωτικό",
              },
            ]}
          >
            <RangePicker
              allowClear
              format={"DD/MM/YYYY"}
              locale={locale}
              style={{ width: "350px" }}
              onCalendarChange={(value) => {
                if (value[0] === null || value[1] === null) {
                  if (events.length > 0) {
                    setEvents([]);
                  }
                  if (selectedRowKeys.length > 0) {
                    setSelectedRowKeys([]);
                  }
                  form.resetFields(["events"]);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="events"
            label="Είδος γεγονότος"
            rules={[
              {
                required: true,
                message: "Το πεδίο είδος γεγονότος",
              },
            ]}
          >
            <Select
              maxTagCount={"responsive"}
              virtual
              allowClear
              showSearch
              filterOption={filterOption}
              onClear={() => {
                if (events.length > 0) {
                  setEvents([]);
                }
                if (selectedRowKeys.length > 0) {
                  setSelectedRowKeys([]);
                }
                form.resetFields(["range"]);
              }}
              mode="multiple"
              onDeselect={() => {
                setEvents([]);
                form.resetFields(["range"]);
              }}
              style={{ width: "500px" }}
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
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={loading}
            >
              Αναζήτηση
            </Button>
          </Form.Item>
        </Form>
        <Space align="end">
          <Search
            loading={loading}
            allowClear
            style={{ width: 291, marginTop: 20 }}
            placeholder="Αναζήτηση προσωπικού"
            onChange={(e) =>
              setTableFilters((prev) => ({
                ...prev,
                fullName: e.target.value.toUpperCase(),
              }))
            }
            disabled={_.isEmpty(events) || tableFilters.total}
            enterButton
          />
          <Button
            loading={loading}
            type="primary"
            icon={<FileExcelOutlined />}
            disabled={_.isEmpty(selectedRowKeys)}
            onClick={() => exportNumeration()}
          >
            Εξαγωγή
          </Button>
          {_.isEmpty(selectedRowKeys) ? (
            <Text type="warning">
              Επιλέξετε τουλάχιστον ένα άτομο για να μπορέσετε να κάνετε εξαγωγή
            </Text>
          ) : null}
        </Space>
        <Divider style={{ margin: 5 }}>
          <Text style={{ fontSize: 18 }} strong>
            Χρονοδιάγραμμα γεγότων
          </Text>
        </Divider>
        <Space direction="vertical">
          <Input
            ref={numerationHeader}
            showCount
            maxLength={50}
            allowClear
            disabled={_.isEmpty(events) || loading}
            placeholder={`Επικεφαλίδα καταμέτρησης,σε περίπτωση που αφήσετε το παρών πεδίο κενό θα εισαχθεί αυτόματα η ακόλουθη επικεφαλίδα "ΚΑΤΑΜΕΤΡΗΣΗ"`}
          />
          <Table
            size="small"
            tableLayout="fixed"
            bordered
            virtual
            scroll={{ y: 800 }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={events}
            rowKey={(record) => record.id}
            loading={loading}
            onChange={onTableChange}
            pagination={false}
            sticky={{ offsetHeader: 0 }}
            locale={{
              emptyText: (
                <Flex gap="middle" align="center" vertical>
                  <QuestionOutlined
                    style={{ fontSize: "50px", color: "#d9d9d9" }}
                  />{" "}
                  <Text style={{ color: "#d9d9d9" }}>
                    Δεν υπάρχουν δεδομένα
                  </Text>
                </Flex>
              ),
            }}
          />
        </Space>
      </Flex>
    </>
  );
};

export default Numeration;
