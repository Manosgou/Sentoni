import { Modal } from "antd";
import { memo } from "react";

const EventModal = memo(({ Content, form, isModalVisible, handleCancel }) => {
  return (
    <Modal
      title="Γεγονός ημέρας"
      open={isModalVisible}
      onCancel={() => {
        if (form) {
          form.resetFields();
        }
        handleCancel();
      }}
      width={1000}
      footer={null}
    >
      <Content />
    </Modal>
  );
});

export default EventModal;
