import {
  Flex,
  Typography,
  Space,
  Button,
  Divider,
  Table,
  Popconfirm,
  message,
  Form,
  Tag,
  Badge,
  FloatButton,
  Input,
  Spin,
} from "antd";
import { useState, useMemo } from "react";
import {
  DoubleLeftOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  HistoryOutlined,
  UsergroupAddOutlined,
  RiseOutlined,
  SyncOutlined,
  QuestionOutlined,
  EditOutlined,
  LoadingOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, lazy } from "react";
import { save, open } from "@tauri-apps/api/dialog";
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

import LazyComponent from "../components/LazyComponent";

const PersonnelForm = lazy(() => import("../components/PersonnelForm"));

const Personnel = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isPersonnelFormVisible, setPersonnelFormVisibility] = useState(false);
  const [personnel, setPersonnel] = useState([]);
  const [personnelCounter, setPersonnelCounter] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [tableFilters, setTableFilters] = useState({
    fullName: "",
    active: null,
  });

  const columns = [
    {
      title: "Ονοματεπώνυμο",
      dataIndex: "fullName",
      filteredValue: [tableFilters.fullName] || null,
      onFilter: (value, record) => record.fullName.includes(value),
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
    },
    {
      title: "Παρατηρήσεις",
      dataIndex: "notes",
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) =>
        record.notes ? (
          <Paragraph
            ellipsis={{ rows: 1, expandable: true, symbol: "Περισσότερα" }}
            style={{ whiteSpace: "pre-line" }}
          >
            {record.notes}
          </Paragraph>
        ) : (
          <Text style={{ color: "#d9d9d9" }}>Δεν υπάρχουν παρατηρήσεις</Text>
        ),
    },
    {
      title: "Κατάσταση",
      dataIndex: "active",
      filters: [
        { text: "Ανενεργός", value: 0 },
        { text: "Ενεργός", value: 1 },
      ],
      filteredValue: tableFilters.active || null,
      onFilter: (value, record) => record.active === value,
      shouldCellUpdate: (record, prevRecord) => !_.isEqual(record, prevRecord),
      render: (_, record) =>
        record.active ? (
          <Tag color="success" bordered={false}>
            Ενεργός
          </Tag>
        ) : (
          <Tag color="error" bordered={false}>
            Ανενεργός
          </Tag>
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
            onClick={() => updatePerson(record)}
            icon={<EditOutlined />}
          >
            Ενημέρωση
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() =>
              navigate("/person-events-history", {
                state: {
                  id: record.id,
                  fullName: record.fullName,
                },
              })
            }
            icon={<HistoryOutlined />}
          >
            Ιστορικό
          </Button>
          <Popconfirm
            title="Η ενέργεια αυτή είναι μη αναστρέψιμη "
            onConfirm={() => deletePerson(record)}
            okText="Διαγραφή"
            cancelText="Άκυρο"
          >
            {" "}
            <Button danger size="small" icon={<UserDeleteOutlined />}>
              Διαγραφή
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  const personnelFormHandleOk = () => {
    setPersonnelFormVisibility(false);
    if (tableFilters.fullName) {
      fetchAllPersonnel(0, personnelCounter);
    } else {
      fetchAllPersonnel(tablePage, 20);
    }
  };

  const personnelFormHandleCancel = () => {
    setPersonnelFormVisibility(false);
  };

  const fetchAllPersonnel = async (page, limit) => {
    await invoke("get_all_personnel_paginated", {
      page: page,
      limit: limit,
    }).then((res) => {
      if (res && !res["error"]) {
        setPersonnel(res.personnel);
        setPersonnelCounter(res.personnelCounter);
      } else {
        messageApi.error(res["error"]);
      }
    });
    setLoading(false);
  };

  const deletePerson = async (person) => {
    await invoke("delete_person", { person: person }).then((res) => {
      if (res) {
        if (tableFilters.fullName) {
          fetchAllPersonnel(0, personnelCounter);
        } else {
          fetchAllPersonnel(tablePage, 20);
        }
      } else {
        messageApi.error("Παρουσιάστηκε σφάλμα");
      }
    });
  };
  const updatePerson = async (person) => {
    setPersonnelFormVisibility(true);
    form.setFieldsValue({ formState: "update", ...person });
  };

  const refresh = () => {
    setLoading(true);
    if (tableFilters.fullName) {
      fetchAllPersonnel(0, personnelCounter);
    } else {
      fetchAllPersonnel(tablePage, 20);
    }
  };
  useEffect(() => {
    if (tableFilters.fullName) {
      fetchAllPersonnel(0, personnelCounter);
    } else {
      fetchAllPersonnel(tablePage, 20);
    }
  }, [tablePage]);

  const onTableChange = (pagination, filters, sorter, extra) => {
    setTableFilters(filters);
    if (filters.active || tableFilters.fullName) {
      fetchAllPersonnel(tablePage, personnelCounter);
    }
  };

  const onPersonSearch = (event) => {
    setTableFilters((prev) => ({
      ...prev,
      fullName: event.target.value.toUpperCase(),
    }));
  };

  const exportPersonnel = async () => {
    setLoading(true);
    const selected = await save({
      filters: [
        {
          name: "Personnel",
          extensions: ["csv"],
        },
      ],
    });
    if (selected) {
      await invoke("export_personnel", { path: selected }).then((res) => {
        if (res) {
          messageApi.success("Επιτυχής εξαγωγή");
        } else {
          messageApi.error("Παρουσιάστηκε σφάλμα κατά την εξαγωγή");
        }
      });
    }
    setLoading(false);
  };

  const importPersonnel = async () => {
    setLoading(true);
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Personnel",
          extensions: ["csv"],
        },
      ],
    });
    if (selected) {
      await invoke("import_multiple_persons", { csvPath: selected }).then(
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

  const onPersonSearchDebounce = useMemo(
    () => _.debounce(onPersonSearch, 300),
    [tableFilters.fullName],
  );

  return (
    <>
      {contextHolder}
      <Flex justify={"space-evenly"} align={"left"} vertical>
        <Space align="baseline">
          <DoubleLeftOutlined
            style={{ fontSize: "22px" }}
            onClick={() => navigate("/sentoni")}
          />
          <Title style={{ margin: "2px", padding: "2px" }}>Προσωπικό</Title>
        </Space>
        <Space direction="vertical">
          <Space size={"middle"} align="baseline">
            <Button
              loading={loading}
              type="primary"
              onClick={() => setPersonnelFormVisibility(true)}
              icon={<UserAddOutlined />}
            >
              Εισαγωγή
            </Button>
            <Button
              loading={loading}
              type="primary"
              onClick={importPersonnel}
              icon={<UsergroupAddOutlined />}
            >
              Φόρτωση
            </Button>
            <Popconfirm
              placement="bottomLeft"
              title="Εξαγωγή προσωπικού"
              description="Πρόκειτε να προβείτε στην εξαγωγή όλου του προσωπικού σε αρχείο csv"
              onConfirm={exportPersonnel}
              okText="Εξαγωγή"
              cancelText="Άκυρο"
            >
              <Button
                loading={loading}
                type="primary"
                icon={<ExportOutlined />}
                disabled={_.isEmpty(personnel)}
              >
                Εξαγωγή
              </Button>
            </Popconfirm>
            <Button
              loading={loading}
              type="primary"
              icon={<RiseOutlined />}
              onClick={() => navigate("/hierarchy")}
              disabled={_.isEmpty(personnel)}
            >
              Ιεραρχία
            </Button>
          </Space>
          <Search
            allowClear
            loading={loading}
            disabled={personnel.length < 0 || tableFilters.active}
            style={{ width: 291, marginTop: 5 }}
            placeholder="Αναζήτηση προσωπικού"
            onFocus={() => fetchAllPersonnel(0, personnelCounter)}
            onChange={onPersonSearchDebounce}
            enterButton
          />
        </Space>
        <Divider orientation="center" style={{ margin: 0 }}>
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 18 }} strong>
              Πίνακας προσωπικού
            </Text>
            <Space>
              <Text>Σύνολο:</Text>
              {loading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
              ) : (
                <Badge
                  overflowCount={999}
                  count={personnelCounter}
                  showZero
                  color="#1890ff"
                />
              )}
            </Space>
          </Space>
        </Divider>

        <Table
          size="small"
          bordered
          dataSource={personnel}
          columns={columns}
          rowKey={(record) => record.id}
          loading={loading}
          onChange={onTableChange}
          sticky={{ offsetHeader: 0 }}
          pagination={
            !_.isEmpty(tableFilters.fullName) || tableFilters.active
              ? false
              : {
                  position: ["topRight", "bottomRight"],
                  pageSize: 20,
                  showSizeChanger: false,
                  total: personnelCounter,
                  onChange: (page, pageSize) => {
                    setLoading(true);
                    setTablePage(page - 1);
                  },
                }
          }
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
            <PersonnelForm
              form={form}
              isModalVisible={isPersonnelFormVisible}
              handleOk={personnelFormHandleOk}
              handleCancel={personnelFormHandleCancel}
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

export default Personnel;
