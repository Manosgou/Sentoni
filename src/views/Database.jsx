import {
  FileDoneOutlined,
  FileSyncOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { open, save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Avatar,
  Button,
  Divider,
  Flex,
  Popover,
  QRCode,
  Space,
  Spin,
  Switch,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import packageJson from "../../package.json";
import { LinearGradient } from "react-text-gradients";
const { Title, Text } = Typography;

const LoadDatabase = () => {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadDB = async () => {
    setLoading(true);
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Database",
          extensions: ["sqlite"],
        },
      ],
    });
    if (selected) {
      await invoke("load_db", { value: selected }).then((res) => {
        if (res) {
          rememberDBPath(selected);
          sessionStorage.setItem("dbPath", selected);
          navigate("/sentoni");
          messageApi.success("Επιτυχής φόρτωση βάσης δεδομένων");
        } else {
          messageApi.error("Ανεπιτυχής φόρτωση βάσης δεδομένων");
        }
      });
    }
    setLoading(false);
  };

  const newDB = async () => {
    setLoading(true);
    const selected = await save({
      filters: [
        {
          name: "Database",
          extensions: ["sqlite"],
        },
      ],
    });
    if (selected) {
      await invoke("new_db", { value: selected }).then((res) => {
        if (res) {
          rememberDBPath(selected);
          sessionStorage.setItem("dbPath", selected);
          navigate("/sentoni");
          messageApi.success("Επιτυχής δημιουργία βάσης δεδομένων");
        } else {
          messageApi.error("Ανεπιτυχής δημιουργία βάσης δεδομένων");
        }
      });
    }
    setLoading(false);
  };

  const rememberDBPath = (dBPath) => {
    if (rememberMe) {
      localStorage.setItem("rememberMe", dBPath);
    }
  };
  const loadRememberedDb = async () => {
    const dBPath = localStorage.getItem("rememberMe");
    if (dBPath) {
      setLoading(true);
      setRememberMe(true);
      await invoke("load_db", { value: dBPath }).then((res) => {
        if (res) {
          sessionStorage.setItem("dbPath", dBPath);
          navigate("/sentoni");
          messageApi.success("Επιτυχής φόρτωση βάσης δεδομένων");
        } else {
          console.log(res);
          messageApi.error("Ανεπιτυχής φόρτωση βάσης δεδομένων");
        }
      });
    }
    setLoading(false);
  };
  useEffect(() => {
    loadRememberedDb();
  }, []);
  return (
    <>
      {contextHolder}
      <Spin spinning={loading} tip={"Φόρτωση βάσης δεδομένων"} size="large">
        <Flex
          justify={"center"}
          align={"center"}
          vertical
          gap="middle"
          style={{ width: "100%", height: "80vh" }}
        >
          <Avatar
            shape="round"
            size={120}
            src={<img src={"./images/logo.png"} alt="avatar" />}
          />
          <LinearGradient gradient={["to right", "#108ee9 ,#87d068"]}>
            <Title>ΣΕΝΤΟΝΙ</Title>
          </LinearGradient>
          <Divider>Επιλογές</Divider>
          <Space gap={"large"}>
            <Button
              type="primary"
              onClick={() => loadDB()}
              icon={<FileSyncOutlined />}
            >
              Φόρτωση βάσης
            </Button>
            <Button
              type="primary"
              onClick={() => newDB()}
              icon={<FileDoneOutlined />}
            >
              Νέα βάση
            </Button>
          </Space>
          <Space>
            <Text>Θυμήσου την επιλογή μου:</Text>
            <Switch
              value={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
          </Space>
          <Space>
            <Text style={{ color: "#d9d9d9" }}>
              Developed by Manos Gouvrikos
              <Divider type="vertical" /> Copyright (c) 2023-2024 Sentoni v.
              {packageJson.version}
            </Text>
            <Popover
              overlayInnerStyle={{ padding: 0 }}
              content={<QRCode value={"Sentoni"} bordered={false} />}
            >
              <GithubOutlined style={{ fontSize: 20, color: "#d9d9d9" }} />
            </Popover>
          </Space>
        </Flex>
      </Spin>
    </>
  );
};

export default LoadDatabase;
