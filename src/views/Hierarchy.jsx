import {
  Flex,
  Space,
  Button,
  Typography,
  Divider,
  Table,
  FloatButton,
  message,
} from "antd";
import {
  DoubleLeftOutlined,
  RedoOutlined,
  SyncOutlined,
  QuestionOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useEffect, useState, memo } from "react";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";
import { CSS } from "@dnd-kit/utilities";
import { MenuOutlined } from "@ant-design/icons";
import _ from "lodash";
const { Title, Text } = Typography;

const Row = memo(({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(
      transform && {
        ...transform,
        scaleY: 1,
      },
    ),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
        }
      : {}),
  };
  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child) => {
        if (child.key === "sort") {
          return React.cloneElement(child, {
            children: (
              <MenuOutlined
                ref={setActivatorNodeRef}
                style={{
                  touchAction: "none",
                  cursor: "move",
                }}
                {...listeners}
              />
            ),
          });
        }
        return child;
      })}
    </tr>
  );
});

const Hierarchy = () => {
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState([]);
  const [original, setOriginal] = useState([]);
  const [updateButtonVisibility, setUpdateButtonVisibilit] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const columns = [
    {
      title: "Χειροκίμητη ταξινόμηση",
      key: "sort",
      width: 120,
    },
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    },
  ];

  const fetchtHierarchyDetails = async () => {
    await invoke("fetch_hierarchy").then((res) => {
      if (res && !res["error"]) {
        setHierarchy(res);
        setOriginal(res);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };
  const updatePosition = (newArray) => {
    setLoading(true);
    if (newArray) {
      const updatedPosition = newArray.map((person, index) => {
        person.position = index;
        return person;
      });
      return updatedPosition;
    }
  };

  const updateHierarchy = async () => {
    const formatedHierarchy = hierarchy.map((h) => {
      return {
        id: h.id,
        personId: h.personId,
        position: h.position,
      };
    });
    await invoke("update_hierarchy", {
      updatedHierarchy: formatedHierarchy,
    }).then((res) => {
      if (res) {
        navigate("/personnel");
        messageApi.success("Επιτυχής ενημέρωση");
      } else {
        messageApi.open({
          type: "error",
          content: "Παρουσιάστηκε σφάλμα",
        });
      }
    });
  };
  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setHierarchy((previous) => {
        const activeIndex = previous.findIndex((i) => i.position === active.id);
        const overIndex = previous.findIndex((i) => i.position === over?.id);
        const newArray = arrayMove(previous, activeIndex, overIndex);
        const updateArray = updatePosition(newArray);
        const same = JSON.stringify(original) == JSON.stringify(updateArray);
        if (!same) {
          setUpdateButtonVisibilit(false);
        } else {
          setUpdateButtonVisibilit(true);
        }
        return updateArray;
      });
    }
    setLoading(false);
  };

  const refresh = () => {
    setLoading(true);
    fetchtHierarchyDetails();
  };

  useEffect(() => {
    fetchtHierarchyDetails();
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
          <Title style={{ margin: "2px", padding: "2px" }}>Ιεραρχία</Title>
        </Space>
        <Button
          loading={loading}
          type="primary"
          disabled={updateButtonVisibility}
          onClick={() => updateHierarchy()}
          icon={<RedoOutlined />}
          style={{ width: 140 }}
        >
          Ενημέρωση
        </Button>
        <Divider orientation="center" style={{ margin: 5 }}>
          Ταξινόμηση Προσωπικού
        </Divider>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            items={hierarchy.map((i) => i.position)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              size="small"
              loading={loading}
              bordered
              components={{
                body: {
                  row: Row,
                },
              }}
              rowKey="position"
              columns={columns}
              dataSource={hierarchy}
              pagination={false}
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
            />
          </SortableContext>
        </DndContext>
        <FloatButton.Group shape="square" style={{ right: 94 }}>
          <FloatButton icon={<SyncOutlined />} onClick={() => refresh()} />
          <FloatButton.BackTop visibilityHeight={300} />
        </FloatButton.Group>
      </Flex>
    </>
  );
};

export default Hierarchy;
