import {
  DoubleLeftOutlined,
  FileExcelOutlined,
  QuestionOutlined,
} from "@ant-design/icons";
import { save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Badge,
  Button,
  DatePicker,
  Divider,
  Flex,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import fontColorContrast from "font-color-contrast";
import jsonm from "jsonm";
import ldb from "localdata";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PersonEventsHistory = () => {
  const { state } = useLocation();
  const { id, fullName } = state;
  const [personEventsHistory, setPersonEventsHistory] = useState([]);
  const [eventFilters, setEventFilters] = useState([]);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const unpacker = new jsonm.Unpacker();

  const fetchEventTypes = async () => {
    ldb.get("eventTypes", async (eventTypes) => {
      if (eventTypes) {
        if (eventTypes.needsUpdate) {
          await invoke("get_all_event_types").then((res) => {
            if (res && !res["error"]) {
              ldb.set("eventTypes", { needsUpdate: false, data: res });
              let filters = res.map((type) => {
                return { text: type.name, value: type.id };
              });
              setEventFilters(filters);
            } else {
              messageApi.error(res["error"]);
            }
          });
        } else {
          let filters = eventTypes.data.map((type) => {
            return { text: type.name, value: type.id };
          });
          setEventFilters(filters);
        }
      } else {
        await invoke("get_all_event_types").then((res) => {
          if (res && !res["error"]) {
            ldb.set("eventTypes", { needsUpdate: false, data: res });
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

  const fetchPersonEventHistory = async (startDate, endDate) => {
    setLoading(true);
    await invoke("fetch_person_events_history", {
      personId: id,
      startDate: dayjs(startDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      endDate: dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res && !res["error"]) {
        let unpacked = unpacker.unpack(res);
        setPersonEventsHistory(unpacked);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };

  const exportHistoryEvents = async () => {
    setLoading(true);
    if (selectedRowKeys) {
      const selected = await save({
        filters: [
          {
            name: "HistoryEvents",
            extensions: ["xlsx"],
          },
        ],
      });

      if (selected) {
        await invoke("export_person_events_history", {
          fullName: fullName,
          events: personEventsHistory.filter((event) =>
            selectedRowKeys.includes(event.id),
          ),
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

  const columns = [
    {
      title: "Ημερομηνία",
      dataIndex: "currentDate",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    },
    {
      title: "Κατάσταση",
      key: "event",
      filters: eventFilters,
      onFilter: (value, record) => record.eventTypeId === value,
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => (
        <Tag
          color={record.eventColor}
          style={{
            color: record.eventColor
              ? fontColorContrast(record.eventColor, 0.7)
              : null,
          }}
        >
          {record.eventTypeId ? record.eventName : "ΠΑΡΩΝ"}
        </Tag>
      ),
    },
    {
      title: "Παρατηρήσεις",
      dataIndex: "notes",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) =>
        record.notes ? (
          record.notes
        ) : (
          <Text style={{ color: "#d9d9d9" }}>Δεν υπάρχουν παρατηρήσεις</Text>
        ),
    },
  ];

  const onTableChange = (selectedRowKeys, selectedRows, info) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    columnWidth: 60,
    selectedRowKeys: selectedRowKeys,
    onChange: onTableChange,
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);
  return (
    <>
      {contextHolder}
      <Flex justify={"space-evenly"} align={"left"} vertical>
        <Space align="baseline">
          <DoubleLeftOutlined
            style={{ fontSize: "22px" }}
            onClick={() => navigate("/personnel")}
          />
          <Title style={{ margin: "2px", padding: "2px" }}>
            Ιστορικό γεγονότων: {fullName}
          </Title>
        </Space>

        <Space direction="vertical" size="middle">
          <Space>
            <RangePicker
              locale={locale}
              format={"DD/MM/YYYY"}
              onChange={(_, dateString) => {
                if (dateString[0] && dateString[1]) {
                  fetchPersonEventHistory(dateString[0], dateString[1]);
                } else {
                  setPersonEventsHistory([]);
                }
              }}
            />
            <Button
              type="primary"
              disabled={_.isEmpty(selectedRowKeys)}
              onClick={() => exportHistoryEvents()}
              icon={<FileExcelOutlined />}
            >
              Εξαγωγή
            </Button>
            {_.isEmpty(selectedRowKeys) ? (
              <Text type="warning">
                Επιλέξετε τουλάχιστον ένα γεγονός για να μπορέσετε να κάνετε
                εξαγωγή του πίνακα
              </Text>
            ) : null}
          </Space>
          {!_.isEmpty(selectedRowKeys) ? (
            <Divider orientation="center">
              <Space>
                <Text> Επιλέχθηκαν:</Text>
                <Badge
                  overflowCount={999}
                  count={selectedRowKeys.length}
                  showZero
                  color="#52c41a"
                />
              </Space>
            </Divider>
          ) : null}
          <Table
            size="small"
            bordered
            loading={loading}
            columns={columns}
            rowSelection={rowSelection}
            dataSource={personEventsHistory}
            rowKey={(record) => record.id}
            sticky={{ offsetHeader: 0 }}
            pagination={false}
            virtual
            scroll={{ y: 800 }}
            tableLayout="fixed"
            locale={{
              emptyText: (
                <Flex gap="middle" align="center" vertical>
                  <QuestionOutlined
                    style={{ fontSize: "50px", color: "#d9d9d9" }}
                  />
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

export default PersonEventsHistory;
