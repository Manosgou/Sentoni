import {
  CloseOutlined,
  DeleteFilled,
  EditOutlined,
  QuestionOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import locale from "antd/es/date-picker/locale/el_GR";
import dayjs from "dayjs";
import fontColorContrast from "font-color-contrast";
import _ from "lodash";
import { useEffect, useState } from "react";
const { Text } = Typography;

const EventDetails = ({
  eventId,
  personId,
  availableEvents,
  personName,
  handleOk,
}) => {
  const [form] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);
  const [eventDetails, setEventDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const newEndDate = Form.useWatch("endDate", form);
  const newStartDate = Form.useWatch("startDate", form);

  const fetchEventDetails = async () => {
    await invoke("get_event_details", { id: eventId }).then((res) => {
      if (res && !res["error"]) {
        setEventDetails(res);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };
  const deleteEvent = async () => {
    await invoke("delete_event_by_id", { id: eventId }).then((res) => {
      if (res) {
        handleOk();
      } else {
        messageApi.error("Αποτυχής διαγραφής");
      }
    });
  };

  const updateEvent = async (values) => {
    setLoading(true);
    const updatedEvent = {
      personId: personId,
      oldEventType: eventDetails?.eventTypeId,
      eventType: values["eventType"],
      oldStartDate: dayjs(eventDetails?.startDate, "DD/MM/YYYY").format(
        "YYYY-MM-DD",
      ),
      startDate: values["startDate"]
        ? dayjs(values["startDate"], "DD/MM/YYYY").format("YYYY-MM-DD")
        : null,
      oldEndDate: dayjs(eventDetails?.endDate, "DD/MM/YYYY").format(
        "YYYY-MM-DD",
      ),
      endDate: values["endDate"]
        ? dayjs(values["endDate"], "DD/MM/YYYY").format("YYYY-MM-DD")
        : null,
      oldNotes: eventDetails?.notes,
      notes: values["notes"] ? values["notes"].trim() : null,
    };
    await invoke("update_event", { eventUpdate: updatedEvent }).then((res) => {
      if (res) {
        handleOk();
      }
    });
    setLoading(false);
  };

  const disabledDate = (current) => {
    return (
      current <
      dayjs(
        form.getFieldValue("startDate")
          ? form.getFieldValue("startDate")
          : eventDetails?.startDate,
        "DD/MM/YYYY",
      )
        .endOf("day")
        .subtract(1, "day")
    );
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const initialReturnDate = dayjs(eventDetails?.endDate, "DD/MM/YYYY")
    .add(1, "day")
    .format("DD/MM/YYYY");

  const updatedReturnDate = dayjs(
    newEndDate ? newEndDate : eventDetails?.endDate,
    "DD/MM/YYYY",
  )
    .add(1, "day")
    .format("DD/MM/YYYY");

  const initialDuration =
    dayjs(eventDetails?.endDate, "DD/MM/YYYY").diff(
      dayjs(eventDetails?.startDate, "DD/MM/YYYY"),
      "day",
    ) + 1;

  const updatedDuration =
    dayjs(newEndDate ? newEndDate : eventDetails?.endDate, "DD/MM/YYYY").diff(
      dayjs(
        newStartDate ? newStartDate : eventDetails?.startDate,
        "DD/MM/YYYY",
      ),
      "day",
    ) + 1;
  if (eventId) {
    return (
      <>
        {contextHolder}
        <Spin spinning={loading} tip="Φόρτωση">
          <Form
            form={form}
            initialValues={{
              eventType: null,
              startDate: null,
              endDate: null,
              notes: null,
            }}
            onFinish={(values) => updateEvent(values)}
          >
            <Descriptions column={1} bordered={true} style={{ width: 950 }}>
              <Descriptions.Item label="Ονοματεπώνυμο">
                {personName}
              </Descriptions.Item>

              <Descriptions.Item label="Είδος γεγονότος">
                <Space align="baseline">
                  <Tag
                    color={eventDetails?.color}
                    style={{
                      color: fontColorContrast(eventDetails?.color, 0.7),
                    }}
                  >
                    {eventDetails?.name}
                  </Tag>
                  {isUpdating ? (
                    <>
                      <Divider type="vertical" />
                      <Form.Item name="eventType" style={{ margin: 0 }}>
                        <Select
                          virtual
                          showSearch
                          filterOption={filterOption}
                          placeholder="Παρακαλώ επιλέξτε ένα είδος γενονότος"
                          notFoundContent={
                            <Text style={{ color: "#d9d9d9" }}>
                              Δεν υπάρχουν δεδομένα
                            </Text>
                          }
                          allowClear
                          style={{ width: 350 }}
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
                                  style={{
                                    color: fontColorContrast(event.color, 0.7),
                                  }}
                                >
                                  {event.name}
                                </Tag>
                              </Select.Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </>
                  ) : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Έναρξη γεγονότος">
                <Space align="baseline">
                  {eventDetails?.startDate}
                  {isUpdating ? (
                    <>
                      <Divider type="vertical" />
                      <Form.Item
                        name="startDate"
                        style={{ margin: 0 }}
                        dependencies={["endDate"]}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator() {
                              if (getFieldValue("endDate") === null) {
                                if (
                                  getFieldValue("startDate") >
                                  dayjs(eventDetails?.endDate, "DD/MM/YYYY")
                                ) {
                                  return Promise.reject(
                                    "Σφάλμα. Η ημερομηνία έναρξης είναι μεγαλύτερη από την ημερομηνία επιστροφής.",
                                  );
                                }
                              } else {
                                if (
                                  getFieldValue("startDate") >
                                  getFieldValue("endDate")
                                ) {
                                  return Promise.reject(
                                    "Σφάλμα. Η ημερομηνία έναρξης είναι μεγαλύτερη από την ημερομηνία επιστροφής.",
                                  );
                                }
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <DatePicker
                          locale={locale}
                          format={"DD/MM/YYYY"}
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                    </>
                  ) : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Λήξη γεγονότος">
                <Space align="baseline">
                  {eventDetails?.endDate}
                  {isUpdating ? (
                    <>
                      <Divider type="vertical" />
                      <Form.Item name="endDate" style={{ margin: 0 }}>
                        <DatePicker
                          locale={locale}
                          format={"DD/MM/YYYY"}
                          style={{ width: 200 }}
                          disabledDate={disabledDate}
                        />
                      </Form.Item>
                    </>
                  ) : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Επιστροφή">
                <Space align="baseline">
                  {initialReturnDate}
                  {isUpdating ? (
                    <>
                      <Divider type="vertical" />
                      <Text
                        type={
                          updatedDuration <= 0
                            ? "danger"
                            : initialDuration !== updatedDuration
                              ? "success"
                              : null
                        }
                        strong={
                          updatedDuration <= 0 ||
                          initialDuration !== updatedDuration
                        }
                      >
                        {updatedDuration <= 0 ? "Σφάλμα" : updatedReturnDate}
                      </Text>
                    </>
                  ) : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Διάρκεια(σε ημέρες)">
                <Space align="baseline">
                  {initialDuration}
                  {isUpdating ? (
                    <>
                      <Divider type="vertical" />
                      <Text
                        type={
                          updatedDuration <= 0
                            ? "danger"
                            : initialDuration !== updatedDuration
                              ? "success"
                              : null
                        }
                        strong={
                          updatedDuration <= 0 ||
                          initialDuration !== updatedDuration
                        }
                      >
                        {updatedDuration <= 0 ? "Σφάλμα" : updatedDuration}
                      </Text>
                    </>
                  ) : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Παρατηρήσεις">
                {isUpdating ? (
                  <Form.Item name="notes" style={{ margin: 8 }}>
                    <Input.TextArea
                      style={{ height: 60, resize: "none" }}
                      placeholder={
                        !eventDetails?.notes
                          ? "Δεν υπάρχουν παρατηρήσεις"
                          : null
                      }
                      maxLength={100}
                      showCount
                    />
                  </Form.Item>
                ) : eventDetails?.notes ? (
                  <Text
                    copyable={{ tooltips: ["Αντιγραφή", "Επιτυχής αντιγραφή"] }}
                  >
                    {eventDetails?.notes}
                  </Text>
                ) : (
                  <Text style={{ color: "#d9d9d9" }}>
                    Δεν υπάρχουν παρατηρήσεις
                  </Text>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ενέργειες">
                <Space size={"small"}>
                  {isUpdating ? (
                    <Button
                      loading={loading}
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                    >
                      Αποθήκευση
                    </Button>
                  ) : null}
                  <Button
                    type="primary"
                    danger={isUpdating}
                    htmlType="button"
                    icon={!isUpdating ? <EditOutlined /> : <CloseOutlined />}
                    onClick={() => {
                      setIsUpdating(!isUpdating);
                      if (isUpdating) {
                        form.resetFields();
                      } else {
                        if (eventDetails?.notes) {
                          form.setFieldsValue({
                            notes: eventDetails?.notes,
                          });
                        }
                      }
                    }}
                  >
                    {isUpdating ? "Ακύρωση" : "Ενημέρωση"}
                  </Button>
                  {!isUpdating ? (
                    <Popconfirm
                      title="Η ενέργεια αυτή είναι μη αναστρέψιμη "
                      onConfirm={() => deleteEvent()}
                      okText="Διαγραφή"
                      cancelText="Άκυρο"
                    >
                      <Button danger icon={<DeleteFilled />}>
                        Διαγραφή
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Form>
        </Spin>
      </>
    );
  } else {
    return (
      <Space direction="vertical" size="small">
        <QuestionOutlined style={{ fontSize: "50px" }} />{" "}
        <Text style={{ color: "#d9d9d9" }}>Δεν υπάρχουν δεδομένα</Text>
      </Space>
    );
  }
};

export default EventDetails;
