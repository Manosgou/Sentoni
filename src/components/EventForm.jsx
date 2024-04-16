import { SaveOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { Divider } from "antd/lib";
import dayjs from "dayjs";
import fontColorContrast from "font-color-contrast";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
const { Text } = Typography;

const EventForm = ({
  form,
  availableEvents,
  handleOk,
  eventId,
  personId,
  personName,
  curDate,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const duration = Form.useWatch("duration", form);
  const returnDate = dayjs(curDate, "DD/MM/YYYY")
    .add(duration, "day")
    .format("DD/MM/YYYY");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (values) => {
      setLoading(true);
      let start = dayjs(curDate, "DD/MM/YYYY");
      let end = start.add(values["duration"] - 1, "day").format("YYYY-MM-DD");
      let finalValues = {
        id: eventId,
        personId: personId,
        startDate: start.format("YYYY-MM-DD"),
        currentDate: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
        endDate: end,
        eventType: values["eventType"],
        notes: values["notes"] ? values["notes"].trim() : null,
      };
      await invoke("create_event", { event: finalValues }).then((res) => {
        if (res) {
          switch (Object.keys(res)[0]) {
            case "created":
              form.resetFields();
              messageApi.success("Επιτυχής προσθήκη γεγονότος");
              handleOk();
              break;
            case "max":
              form.resetFields();
              messageApi.warning(res["max"]);
              messageApi.info("Αυτόματη ανανέωση", 0.7).then(() => handleOk());
              break;
            case "exists":
              form.resetFields();
              messageApi.error(res["exists"]);
              messageApi.info("Αυτόματη ανανέωση", 0.7).then(() => handleOk());
              break;
            case "error":
              form.resetFields();
              messageApi.error(res["error"]);
              break;
          }
        } else {
          messageApi.error("Παρουσιάστηκε σφάλμα κατά την δημιουργία");
        }
        setLoading(false);
      });
    },
    [eventId, personId],
  );

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <>
      {contextHolder}
      <Spin spinning={loading} tip="Φόρτωση">
        <Space direction="vertical" style={{ display: "flex" }}>
          <Alert
            message={
              <Space>
                <Text strong>{personName} </Text>
                <Divider type="vertical" />
                <Space size={"small"}>
                  <Text>Από:</Text>
                  <Text strong>
                    <Tag color="green">{curDate}</Tag>
                  </Text>
                </Space>
                <Space size={"small"}>
                  <Text>Εως:</Text>
                  <Text strong>
                    <Tag color="green">{returnDate}</Tag>
                  </Text>
                </Space>

                <Divider type="vertical" />

                <Space size={"small"}>
                  <Text>Διάρκεια:</Text>
                  <Text strong>
                    <Tag color="green">
                      {duration} {duration > 1 ? "Ημέρες" : "Ημέρα"}
                    </Tag>
                  </Text>
                </Space>
              </Space>
            }
            type="info"
          />
          <Form
            form={form}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 700 }}
            autoComplete="off"
            onFinish={handleSubmit}
            initialValues={{
              duration: 1,
              notes: null,
              eventType: null,
            }}
          >
            <Form.Item name="id" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item name="person_id" hidden={true}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Είδος γεγονότος"
              name="eventType"
              rules={[
                {
                  required: true,
                  message: "To πεδίο είδος γεγονότος είναι υποχρεωτικό",
                },
              ]}
            >
              <Select
                virtual
                showSearch
                filterOption={filterOption}
                placeholder="Παρακαλώ επιλέξτε ένα είδος γενονότος"
                notFoundContent={
                  <Text style={{ color: "#d9d9d9" }}>
                    Δεν υπάρχουν διαθέσιμα είδη γεγονότων,
                    <Link to="/event-type" state={{ modalVisibility: true }}>
                      δημηιουργήστε εδώ
                    </Link>
                  </Text>
                }
                allowClear
              >
                {availableEvents?.map((event) => {
                  return (
                    <Select.Option
                      value={event.id}
                      key={event.id}
                      label={event.name}
                    >
                      <Tag
                        color={event.color}
                        style={{ color: fontColorContrast(event.color, 0.7) }}
                      >
                        {event.name}
                      </Tag>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item
              label="Διάρκεια"
              name="duration"
              extra={
                <Space direction="vertical">
                  <Text style={{ color: "#bfbfbf" }}>
                    Επιστροφή: {returnDate}
                  </Text>
                  <Space>
                    <Text style={{ color: "#bfbfbf" }}>
                      Προεπιλεγμένες τιμές:
                    </Text>
                    {[3, 5, 10, 12, 15, 18, 20].map((range) => {
                      return (
                        <Button
                          key={range}
                          type="primary"
                          shape="circle"
                          onClick={() => {
                            form.setFieldValue("duration", range);
                          }}
                          style={{ fontWeight: "bold" }}
                        >
                          {range}
                        </Button>
                      );
                    })}
                  </Space>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: "To πεδίο διάρκεια είναι υποχρεωτικό",
                },
              ]}
            >
              <InputNumber min={1} max={365} changeOnWheel />
            </Form.Item>
            <Form.Item
              label="Σημειώσεις"
              name="notes"
              extra={
                <Space style={{ marginTop: 25 }}>
                  <Text style={{ color: "#bfbfbf" }}>
                    Προεπιλεγμένες τιμές:
                  </Text>
                  {["ΚΑ", "ΑΜΔ", "ΓΟΝ", "ΑΙΜΑ", "ΤΙΜ"].map((note) => {
                    return (
                      <Tag
                        color="processing"
                        onClick={() =>
                          form.setFieldValue("notes", `${duration} ${note}`)
                        }
                      >
                        {note}
                      </Tag>
                    );
                  })}
                </Space>
              }
            >
              <Input.TextArea
                placeholder="Μπορείτε να εισάγετε παρατηρήσεις"
                style={{ height: 60, resize: "none" }}
                showCount
                maxLength={100}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Space>
                <Button
                  loading={loading}
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Αποθήκευση
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Spin>
    </>
  );
};

export default EventForm;
