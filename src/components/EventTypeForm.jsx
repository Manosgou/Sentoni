import { blue, green, magenta, purple, red, yellow } from "@ant-design/colors";
import { DownOutlined, SaveOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Button,
  ColorPicker,
  Form,
  Input,
  List,
  Modal,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import fontColorContrast from "font-color-contrast";
import ldb from "localdata";
import { useEffect, useState } from "react";
const { Text } = Typography;

const EventTypeForm = ({ form, isModalVisible, handleOk, handleCancel }) => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [eventTypes, setEventTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const eventTypeName = Form.useWatch("name", form);

  const handleSubmit = async (values) => {
    setLoading(true);
    const eventType = {
      name: values["name"].trim(),
      color:
        typeof values["color"] === "string"
          ? values["color"]
          : values["color"].toHexString(),
    };
    if (values["formState"] === "new") {
      await invoke("create_event_type", {
        eventType: eventType,
      }).then((res) => {
        if (!res) {
          messageApi.error("Παρουσιάστηκε σφάλμα κατά την δημιουργία");
          return;
        }
      });
    } else if (values["formState"] === "update") {
      eventType["id"] = values["id"];
      await invoke("update_event_type", {
        eventType: eventType,
      }).then((res) => {
        if (!res) {
          messageApi.error("Παρουσιάστηκε σφάλμα κατά την ενημέρωση");
          return;
        }
      });
    }
    form.resetFields();
    setLoading(false);
    handleOk();
    ldb.set("eventTypes", { needsUpdate: true, data: [] });
  };

  const genPresets = (presets) =>
    Object.entries(presets).map(([label, colors]) => ({
      label,
      colors,
      defaultOpen: false,
    }));

  const fetchEventTypes = async () => {
    ldb.get("eventTypes", async (eventTypes) => {
      if (eventTypes) {
        if (eventTypes.needsUpdate) {
          await invoke("get_all_event_types").then((res) => {
            if (res && !res["error"]) {
              ldb.set("eventTypes", { needsUpdate: false, data: res });
              setEventTypes(res);
            } else {
              messageApi.error(res["error"]);
            }
          });
        } else {
          setEventTypes(eventTypes.data);
        }
      } else {
        await invoke("get_all_event_types").then((res) => {
          if (res && !res["error"]) {
            ldb.set("eventTypes", { needsUpdate: false, data: res });
            setEventTypes(res);
          } else {
            messageApi.error(res["error"]);
          }
        });
      }
    });
  };

  useEffect(() => {
    fetchEventTypes();
  }, [eventTypes]);

  return (
    <>
      {contextHolder}
      <Modal
        title="Εισαγωγή είδη γενονότων"
        open={isModalVisible}
        onCancel={() => {
          form.resetFields();
          handleCancel();
        }}
        width={600}
        footer={null}
      >
        <Spin spinning={loading} tip="Φόρτωση">
          <Form
            form={form}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            autoComplete="off"
            onFinish={handleSubmit}
            initialValues={{
              formState: "",
              name: "",
              color: "#000000",
            }}
          >
            <Form.Item name="id" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item name="formState" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Όνομα"
              name="name"
              rules={[
                {
                  required: true,
                  message: "To πεδίο όνομα γεγονότος είναι υποχρεωτικό",
                },
              ]}
            >
              <Input showCount maxLength={20} />
            </Form.Item>
            {eventTypes?.some((eventType) =>
              eventType.name
                .toUpperCase()
                .includes(eventTypeName?.toUpperCase() || null),
            ) && form.getFieldValue("formState") === "new" ? (
              <List
                style={{ paddingBottom: 40 }}
                header={
                  <Text strong>Παρόμοια αποθηκευμένα είδη γεγονότων</Text>
                }
                dataSource={eventTypes?.filter((eventType) =>
                  eventType.name
                    .toUpperCase()
                    .includes(eventTypeName?.toUpperCase() || null),
                )}
                pagination={{
                  position: ["topRight", "bottomRight"],
                  pageSize: 3,
                  showSizeChanger: false,
                }}
                size="small"
                renderItem={(event) => (
                  <List.Item>
                    <Tag
                      color={event.color}
                      style={{ color: fontColorContrast(event.color, 0.7) }}
                    >
                      {event.name}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : null}
            <Form.Item
              label="Χρώμα απεικόνισης"
              name="color"
              rules={[
                {
                  required: true,
                  message:
                    "To πεδίο χρώμα απεικόνισης γεγονότος είναι υποχρεωτικό",
                },
              ]}
            >
              <ColorPicker
                size="middle"
                format={"hex"}
                disabledAlpha={true}
                presets={genPresets({
                  green,
                  red,
                  yellow,
                  purple,
                  magenta,
                  blue,
                })}
                placement="topLeft"
                open={open}
                onOpenChange={setOpen}
                showText={() => (
                  <DownOutlined
                    rotate={open ? 180 : 0}
                    style={{
                      color: "rgba(0, 0, 0, 0.25)",
                    }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Αποθήκευση
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
};

export default EventTypeForm;
