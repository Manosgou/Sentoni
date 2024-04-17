import {
  DeleteFilled,
  DoubleLeftOutlined,
  EditOutlined,
  ExportOutlined,
  LoadingOutlined,
  QuestionOutlined,
  SyncOutlined,
  TagOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { open, save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Badge,
  Button,
  Divider,
  Flex,
  FloatButton,
  Form,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import _ from "lodash";
import { lazy, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
const { Title, Text } = Typography;

import LazyComponent from "../components/LazyComponent";
const EventTypeForm = lazy(() => import("../components/EventTypeForm"));

const EventType = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [isModalVisible, setModalVisibility] = useState(
    false || state ? state.modalVisibility : null,
  );
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypeCounter, setEventTypeCounter] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  const columns = [
    {
      title: "Όνομα γεγονότος",
      dataIndex: "name",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    },
    {
      title: "Χρώμα απεικόνισης",
      dataIndex: "color",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => (
        <Space>
          <Tag
            color={record.color}
            style={{
              width: "20px",
              height: "20px",
            }}
          />

          <Text
            copyable={{ tooltips: ["Αντιγραφή", "Επιτυχής αντιγραφή"] }}
            underline
          >
            {record.color}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ενέργειες",
      key: "action",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => updateEventType(record)}
          >
            Ενημέρωση
          </Button>
          <Popconfirm
            title="Η ενέργεια αυτή είναι μη αναστρέψιμη "
            onConfirm={() => deleteEventType(record)}
            okText="Διαγραφή"
            cancelText="Άκυρο"
          >
            <Button danger size="small" icon={<DeleteFilled />}>
              Διαγραφή
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const handleOk = () => {
    setModalVisibility(false);
    fetchEventTypes(tablePage);
  };

  const handleCancel = () => {
    setModalVisibility(false);
  };

  const fetchEventTypes = async (page) => {
    await invoke("get_all_event_types_paginated", { page: page }).then(
      (res) => {
        if (res && !res["error"]) {
          setEventTypes(res.eventTypes);
          setEventTypeCounter(res.eventTypesCounter);
        } else {
          messageApi.error(res["error"]);
        }
      },
    );
    setLoading(false);
  };

  const deleteEventType = async (eventType) => {
    await invoke("delete_event_type", {
      eventType: eventType,
    }).then((res) => {
      if (res) {
        ldb.set("eventTypes", { needsUpdate: true, data: [] });
        fetchEventTypes(tablePage);
      } else {
        messageApi.error("Παρουσιάστηκε σφάλμα");
      }
    });
  };
  const updateEventType = async (eventType) => {
    form.setFieldsValue({ formState: "update", ...eventType });
    setModalVisibility(true);
  };

  const refresh = () => {
    setLoading(true);
    fetchEventTypes(tablePage);
  };

  const exportEventTypes = async () => {
    setLoading(true);
    const selected = await save({
      filters: [
        {
          name: "EventTypes",
          extensions: ["csv"],
        },
      ],
    });
    if (selected) {
      await invoke("export_event_types", { path: selected }).then((res) => {
        if (res) {
          messageApi.success("Επιτυχής εξαγωγή");
        } else {
          messageApi.error("Παρουσιάστηκε σφάλμα κατά την εξαγωγή");
        }
      });
    }
    setLoading(false);
  };

  const importEventTypes = async () => {
    setLoading(true);
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "EventTypes",
          extensions: ["csv"],
        },
      ],
    });
    if (selected) {
      await invoke("import_multiple_event_types", { csvPath: selected }).then(
        (res) => {
          if (res) {
            refresh();
            messageApi.success("Επιτυχής φόρτωση");
          } else {
            messageApi.error("Παρουσιάστηκε σφάλμα κατά την φόρτωση");
          }
        },
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventTypes(tablePage);
  }, [tablePage]);

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
            Είδη γεγονότων
          </Title>
        </Space>
        <Space size={"middle"} align="baseline">
          <Button
            loading={loading}
            type="primary"
            onClick={() => {
              form.setFieldValue("formState", "new");
              setModalVisibility(true);
            }}
            icon={<TagOutlined />}
          >
            Δημιουργία
          </Button>
          <Button
            loading={loading}
            onClick={importEventTypes}
            type="primary"
            icon={<TagsOutlined />}
          >
            Φόρτωση
          </Button>
          <Popconfirm
            placement="bottomLeft"
            title="Εξαγωγή ειδών γεγονότων"
            description="Πρόκειτε να προβείτε στην εξαγωγή όλου των ειδών γεγονότων σε αρχείο csv"
            onConfirm={exportEventTypes}
            okText="Εξαγωγή"
            cancelText="Άκυρο"
          >
            <Button
              loading={loading}
              type="primary"
              icon={<ExportOutlined />}
              disabled={_.isEmpty(eventTypes)}
            >
              Εξαγωγή
            </Button>
          </Popconfirm>
        </Space>

        <Space size={"middle"} align="baseline"></Space>
        <Divider orientation="center" style={{ margin: 0 }}>
          <Space direction="vertical">
            <Text style={{ fontSize: 18 }} strong>
              {" "}
              Πίνακας ειδών γεγονότων
            </Text>
            <Space>
              <Text>Σύνολο ειδών γεγονότων:</Text>
              {loading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
              ) : (
                <Badge
                  overflowCount={999}
                  count={eventTypeCounter}
                  showZero
                  color="#1890ff"
                />
              )}
            </Space>
          </Space>
        </Divider>
        <Table
          size="small"
          dataSource={eventTypes}
          loading={loading}
          columns={columns}
          rowKey={(record) => record.id}
          sticky={{ offsetHeader: 0 }}
          pagination={{
            position: ["topRight", "bottomRight"],
            pageSize: 20,
            showSizeChanger: false,
            total: eventTypeCounter,
            onChange: (page, pageSize) => {
              setLoading(true);
              setTablePage(page - 1);
            },
          }}
          locale={{
            emptyText: (
              <Space direction="vertical" size="small">
                <QuestionOutlined style={{ fontSize: "50px" }} />{" "}
                <Text style={{ color: "#d9d9d9" }}>Δεν υπάρχουν δεδομένα</Text>
              </Space>
            ),
          }}
        />
        <LazyComponent
          Component={
            <EventTypeForm
              form={form}
              isModalVisible={isModalVisible}
              handleOk={handleOk}
              handleCancel={handleCancel}
              loading={loading}
            />
          }
        />
        <FloatButton.Group shape="circle" style={{ left: 15, bottom: 15 }}>
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

export default EventType;
