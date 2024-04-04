import {
  CalendarOutlined,
  DeleteFilled,
  EditFilled,
  FileTextOutlined,
  QuestionOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { memo, useState } from "react";
const { Text, Paragraph } = Typography;
const ReminderPanel = ({
  curDate,
  reminders,
  fetchReminders,
  onDrawerClose,
  drawerVisibility,
  reminderLoading,
  setReminderLoading,
}) => {
  const [reminderForm] = Form.useForm();
  const [reminderFormState, setReminderFormState] = useState("");
  const [childrenDrawer, setChildrenDrawer] = useState(false);
  const [messageApi, messageContextHolder] = message.useMessage();

  const calculateReschedule = () => {
    const newDate = dayjs(curDate, "DD/MM/YYYY").add(1, "day");
    if (isWeekEnd(newDate)) {
      return dayjs(curDate, "DD/MM/YYYY").add(3, "day").format("DD/MM/YYYY");
    }
    return newDate.format("DD/MM/YYYY");
  };
  const rescheduleReminder = async (reminderId, date) => {
    setReminderLoading(true);
    await invoke("reschedule_reminder", {
      reminderId: reminderId,
      newDate: dayjs(date, "DD/MM/YYYY").format("YYYY-MM-DD"),
    }).then((res) => {
      if (res) {
        setReminderLoading(false);
        fetchReminders();
      }
    });
  };
  const deleteReminder = async (reminder) => {
    setReminderLoading(true);
    await invoke("delete_reminder", { reminder: reminder }).then((res) => {
      if (res) {
        setReminderLoading(false);
        fetchReminders();
      } else {
        messageApi.open({
          type: "error",
          content: "Παρουσιάστηκε σφάλμα",
        });
      }
    });
  };

  const reminderSubmit = async (values) => {
    setReminderLoading(true);
    const reminder = {
      date: dayjs(curDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      notes: values["notes"],
      isFinished: 0,
    };
    switch (reminderFormState) {
      case "new":
        await invoke("create_reminder", { reminder: reminder }).then((res) => {
          if (res) {
            switch (Object.keys(res)[0]) {
              case "created":
                onChildrenDrawerClose();
                fetchReminders();
                break;
              case "max":
                messageApi.warning(res["max"]);
                messageApi.info("Αυτόματη ανανέωση", 0.7).then(() => {
                  onChildrenDrawerClose();
                  fetchReminders();
                });
                break;
              case "error":
                messageApi.error(res["max"]);
                break;
            }
          }
        });
        break;
      case "update":
        reminder["id"] = values["id"];
        await invoke("update_reminder", { reminder: reminder }).then((res) => {
          if (res) {
            onChildrenDrawerClose();
            fetchReminders();
          } else {
            messageApi.open({
              type: "error",
              content: "Παρουσιάστηκε σφάλμα",
            });
          }
        });
        break;
    }
    setReminderLoading(false);
  };

  const updateReminderStatus = async (reminderId, status) => {
    setReminderLoading(true);
    await invoke("update_reminder_status", {
      reminderId: reminderId,
      status: status ? 1 : 0,
    }).then((res) => {
      if (res) {
        fetchReminders();
      } else {
        messageApi.open({
          type: "error",
          content: "Παρουσιάστηκε σφάλμα",
        });
      }
    });
    setReminderLoading(false);
  };

  const showChildrenDrawer = () => {
    setChildrenDrawer(true);
  };

  const onChildrenDrawerClose = () => {
    reminderForm.resetFields();
    setChildrenDrawer(false);
  };
  const isWeekEnd = (date) => {
    return (
      dayjs(date, "DD/MM/YYYY").get("day") === 6 ||
      dayjs(date, "DD/MM/YYYY").get("day") === 0
    );
  };

  const ListItem = memo(({ item }) => {
    return (
      <List.Item>
        <Checkbox
          checked={item.isFinished}
          onChange={(e) => updateReminderStatus(item.id, e.target.checked)}
        />
        <Divider type="vertical" style={{ height: 100 }} />
        <Space align="start">
          <Paragraph
            delete={item.isFinished}
            style={{ width: 260 }}
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "Περισσότερα",
            }}
            copyable={{ tooltips: ["Αντιγραφή", "Επιτυχής αντιγραφή"] }}
          >
            {item.notes}
          </Paragraph>
          <Space>
            <Divider type="vertical" style={{ height: 100 }} />
            <Space direction="vertical">
              <Button
                size="small"
                icon={<EditFilled />}
                onClick={() => {
                  setReminderFormState("update");
                  showChildrenDrawer();
                  reminderForm.setFieldValue("id", item.id);
                  reminderForm.setFieldValue("notes", item.notes);
                }}
                disabled={item.isFinished}
              >
                Επεξεργασία
              </Button>
              <Popconfirm
                title="Η ενέργεια αυτή είναι μη αναστρέψιμη "
                onConfirm={() => deleteReminder(item)}
                okText="Διαγραφή"
                cancelText="Άκυρο"
              >
                {" "}
                <Button danger size="small" icon={<DeleteFilled />}>
                  Διαγραφή
                </Button>
              </Popconfirm>
              <Button
                disabled={item.isFinished}
                type="primary"
                size="small"
                icon={<CalendarOutlined />}
                onClick={() =>
                  rescheduleReminder(item.id, calculateReschedule())
                }
              >
                {calculateReschedule()}
              </Button>
            </Space>
          </Space>
        </Space>
      </List.Item>
    );
  });

  return (
    <>
      {messageContextHolder}
      <Drawer
        title="Υπενθυμίσεις"
        placement="right"
        width={550}
        onClose={onDrawerClose}
        open={drawerVisibility}
      >
        {reminders.length < 10 ? (
          <Button
            type="primary"
            onClick={() => {
              setReminderFormState("new");
              showChildrenDrawer();
            }}
            icon={<FileTextOutlined />}
            disabled={reminderLoading}
          >
            Νές υπενθύμιση
          </Button>
        ) : (
          <Tag icon={<ExclamationCircleOutlined />} color="warning">
            Μέγιστο αριθμός υπενθυμίσεων για {curDate}
          </Tag>
        )}
        <Drawer
          title={`Υπενθύμιση για ${curDate}`}
          width={400}
          closable={true}
          onClose={onChildrenDrawerClose}
          open={childrenDrawer}
        >
          <Form layout="vertical" onFinish={reminderSubmit} form={reminderForm}>
            <Form.Item name="id" hidden={true}>
              <Input />
            </Form.Item>
            <Form.Item
              name="notes"
              label="Κείμενο υπενθύμισης"
              rules={[
                {
                  required: true,
                  message: "Το πεδίο σημείωση είναι υποχρεωτικό",
                },
              ]}
            >
              <Input.TextArea
                showCount
                maxLength={100}
                style={{ height: 120 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Αποθήκευση
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
        <Divider>
          Σύνολο υπενθυμίσεων:{" "}
          <Badge count={reminders.length} showZero color="#1890ff" />
          <br />
          Ολοκληρωμένες υπενθυμίσεις:
          <Badge
            count={reminders?.filter((remidner) => remidner.isFinished).length}
            showZero
            color="#52c41a"
          />
        </Divider>
        <Spin tip="Φόρτωση" spinning={reminderLoading}>
          <List
            size="small"
            locale={{
              emptyText: (
                <Space direction="vertical" size="small">
                  <QuestionOutlined style={{ fontSize: "50px" }} />{" "}
                  <Text style={{ color: "#d9d9d9" }}>
                    Δεν υπάρχουν δεδομένα
                  </Text>
                </Space>
              ),
            }}
            header={
              <Text style={{ color: "#d9d9d9" }}>
                Υπενθυμίσεις για {curDate}
              </Text>
            }
            bordered
            dataSource={reminders}
            renderItem={(item) => <ListItem key={item.id} item={item} />}
          />
        </Spin>
      </Drawer>
    </>
  );
};

export default ReminderPanel;
