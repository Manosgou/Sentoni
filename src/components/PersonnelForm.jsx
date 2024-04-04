import { SaveOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import { Button, Form, Input, Modal, Spin, Switch } from "antd";
import { useState } from "react";

const PersonnelForm = ({ form, isModalVisible, handleOk, handleCancel }) => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (values) => {
    setLoading(true);
    const sValues = {
      fullName: values["fullName"].toUpperCase().trim(),
      notes: values["notes"].trim(),
      active: values["active"] ? 1 : 0,
    };
    if (values["formState"] === "update") {
      sValues["id"] = values["id"];
      await invoke("update_person", { person: sValues }).then((res) => {
        if (!res) {
          return;
        }
      });
    } else if (values["formState"] === "")
      await invoke("create_person", { person: sValues }).then((res) => {
        if (!res) {
          return;
        }
      });
    form.resetFields();
    handleOk();
    setLoading(false);
  };

  return (
    <Modal
      title="Εισαγωγή προσωπικού"
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
            fullName: "",
            notes: "",
            active: false,
          }}
        >
          <Form.Item name="id" hidden={true}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Πλήρες όνομα"
            name="fullName"
            rules={[
              {
                required: true,
                message: "To πεδίο ονοματεπώνυμο είναι υποχρεωτικό",
              },
            ]}
          >
            <Input placeholder="Παρακαλώ εισάγετε ονοματεπώνυμο" />
          </Form.Item>
          <Form.Item label="Παρατηρήσεις" name="notes">
            <Input.TextArea
              placeholder="Παρατηρήσεις"
              showCount
              maxLength={100}
            />
          </Form.Item>
          <Form.Item label="Ενεργός" name={"active"} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Αποθήκευση
            </Button>
          </Form.Item>
          <Form.Item name="formState" hidden={true}>
            <Input />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PersonnelForm;
