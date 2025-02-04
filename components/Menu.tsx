import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Divider,
  Typography,
  ConfigProvider,
  theme,
  Space,
  Row,
  Col,
} from "antd";
import {
  HeartFilled,
  SettingOutlined,
  ApiOutlined,
  LinkOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { saveData, getData } from "@/utils/storageUtil";
import { LLM } from "@/utils/aiUtil";

import { motion } from "framer-motion";

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface MenuSettings {
  llmModel: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

interface CustomMenuProps {
  darkMode: boolean;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ darkMode }) => {
  const [form] = Form.useForm();
  const [customLLM, setCustomLLM] = useState<string>("");
  const [settings, setSettings] = useState<MenuSettings>({
    llmModel: LLM.HermesLlama,
    baseUrl: "http://127.0.0.1:1234/v1",
    apiKey: "lm-studio",
    temperature: 0.7,
    maxTokens: 2000,
  });

  useEffect(() => {
    const loadSavedSettings = async () => {
      const savedLLM = await getData("llmModel");
      const savedBaseUrl = await getData("baseUrl");
      const savedApiKey = await getData("apiKey");
      const savedTemp = await getData("temperature");
      const savedMaxTokens = await getData("maxTokens");

      const newSettings = {
        llmModel: savedLLM || settings.llmModel,
        baseUrl: savedBaseUrl || settings.baseUrl,
        apiKey: savedApiKey || settings.apiKey,
        temperature: savedTemp ? parseFloat(savedTemp) : settings.temperature,
        maxTokens: savedMaxTokens
          ? parseInt(savedMaxTokens)
          : settings.maxTokens,
      };

      setSettings(newSettings);
      form.setFieldsValue(newSettings);
    };

    loadSavedSettings();
  }, []);

  const handleSettingsChange = async (changedValues: any, allValues: any) => {
    const newSettings = { ...settings, ...allValues };
    setSettings(newSettings);

    Object.keys(changedValues).forEach(async (key) => {
      await saveData(key, changedValues[key].toString());
    });
  };

  const handleCustomLLMAdd = (value: string) => {
    if (value && !Object.values(LLM).includes(value as LLM)) {
      setCustomLLM(value);
      form.setFieldsValue({ llmModel: value });
      // persist custom LLM model as well
      saveData("llmModel", value);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: "22px 30px 64px",
    background: darkMode ? "#2d2e2e" : "#ffffff",
    boxShadow: darkMode
      ? "0 4px 12px rgba(0, 0, 0, 0.4)"
      : "0 4px 12px rgba(0, 0, 0, 0.1)",
    overflow: "auto",
    scrollbarWidth: "none",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const footerStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    color: darkMode ? "#d9d9d9" : "#666666",
  };

  const linkStyle: React.CSSProperties = {
    color: darkMode ? "#1677ff" : "#1677ff",
    textDecoration: "none",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 8,
          },
        }}
      >
        <div style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title
              level={3}
              style={{ margin: 0, color: darkMode ? "#fff" : "#000" }}
            >
              Settings
            </Title>
          </div>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            initialValues={settings}
            onValuesChange={handleSettingsChange}
            size="large"
          >
            {/* LLM Model */}
            <Form.Item label="LLM Model" name="llmModel">
              <Select
                showSearch
                placeholder="Select LLM Model"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ padding: 8 }}>
                      <Input.Search
                        placeholder="Add custom model"
                        enterButton={<PlusOutlined />}
                        onSearch={handleCustomLLMAdd}
                      />
                    </div>
                  </>
                )}
              >
                {Object.entries(LLM).map(([key, value]) => (
                  <Option key={key} value={value}>
                    {value}
                  </Option>
                ))}
                {customLLM && (
                  <Option key="custom" value={customLLM}>
                    Custom: {customLLM}
                  </Option>
                )}
              </Select>
            </Form.Item>

            {/* Base URL */}
            <Form.Item
              label={
                <Space>
                  <ApiOutlined />
                  Base URL
                </Space>
              }
              name="baseUrl"
            >
              <Input placeholder="Enter base URL" />
            </Form.Item>

            {/* API Key */}
            <Form.Item
              label={
                <Space>
                  <LinkOutlined />
                  API Key
                </Space>
              }
              name="apiKey"
            >
              <Input.Password placeholder="Enter API key" />
            </Form.Item>

            {/* Temperature */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Temperature" name="temperature">
                  <Input type="number" min={0} max={2} step={0.1} />
                </Form.Item>
              </Col>

              {/* Max Tokens */}
              <Col span={12}>
                <Form.Item label="Max Tokens" name="maxTokens">
                  <Input type="number" min={1} max={4096} />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {/* Footer */}
          <a
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            href="https://www.buymeacoffee.com/abhinavreddy"
            target="_blank"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png"
              alt="Buy Me A Coffee"
              style={{ height: "30px", width: "120px" }}
            />
          </a>
          <Divider style={{ margin: "10px 10px" }} />

          <Paragraph style={footerStyle}>
            Made with <HeartFilled style={{ color: "#ff4d4f" }} /> by{" "}
            <a
              href="https://www.linkedin.com/in/abhinav-reddy-k/"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              Abhinav Reddy
            </a>
          </Paragraph>
        </div>
      </ConfigProvider>
    </motion.div>
  );
};

export default CustomMenu;
