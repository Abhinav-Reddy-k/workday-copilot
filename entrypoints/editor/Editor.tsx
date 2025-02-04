import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Typography,
  Input,
  Button,
  Progress,
  Switch,
  Space,
  Modal,
  Card,
  theme,
  message,
  Tooltip,
  Spin,
  ConfigProvider,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  SaveOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  ToolOutlined,
  TrophyOutlined,
  ProjectOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  IdcardOutlined,
  EllipsisOutlined,
  LoadingOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { saveData, getData, clearData } from "@/utils/storageUtil";
import { downloadTextFile } from "@/utils/fileUtil";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

type SectionState = Record<string, string>;

// Map sections to icons
const sectionIcons: Record<string, React.ReactNode> = {
  Personal_Information: <UserOutlined />,
  Skills: <ToolOutlined />,
  Experience: <TrophyOutlined />,
  Projects: <ProjectOutlined />,
  Education: <ReadOutlined />,
  Certifications: <SafetyCertificateOutlined />,
  Voluntary_Disclosures: <FileTextOutlined />,
  Self_Identify: <IdcardOutlined />,
  Miscellaneous: <EllipsisOutlined />,
};

const exampleVoluntaryDisclosures = `Race/Ethnicity:
  Q1: Are you Hispanic/Latino?
  A1: No
  Q2: What is your race? (Select all that apply)
  A2: Asian
  Q3: Do you wish to decline to provide this information?
  A3: No

Gender:
  Q1: What is your gender?
  A1: Male
  Q2: Do you wish to decline to provide this information?
  A2: No`;

const exampleSelfIdentify = `Veteran Status:
  Q1: Do you identify as a veteran?
  A1: No, I,m not a protected veteran
  Q3: Do you wish to decline to provide this information?
  A3: No

Disability Status:
  Q1: Do you have a disability (or a history of a disability)?
  A1: No
  Q2: Do you wish to decline to provide this information?
  A2: Yes`;

const WorkdayCopilot = () => {
  const [sections, setSections] = useState<SectionState>({
    Personal_Information: "",
    Skills: "",
    Experience: "",
    Projects: "",
    Education: "",
    Certifications: "",
    Voluntary_Disclosures: ``,
    Self_Identify: "",
    Miscellaneous: "",
  });
  const [activeSection, setActiveSection] = useState("Personal_Information");
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const { token } = useToken();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await getData("userData");
        if (savedData) {
          const parsedSections = parseSections(savedData);
          // Check if Voluntary Disclosures and Self Identify sections are empty
          if (!parsedSections["Voluntary_Disclosures"]) {
            parsedSections["Voluntary_Disclosures"] =
              exampleVoluntaryDisclosures;
          }
          if (!parsedSections["Self_Identify"]) {
            parsedSections["Self_Identify"] = exampleSelfIdentify;
          }

          setSections(parsedSections);
        }

        // Load theme preference
        const savedTheme = await getData("globalTheme");
        if (savedTheme) {
          setDarkMode(savedTheme === "dark");
        }

        setLoading(false);
      } catch (error) {
        message.error("Failed to load saved data");
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sections]);

  const parseSections = (formattedText: string): SectionState => {
    const lines = formattedText.split("\n");
    const parsedSections: SectionState = {};
    let currentSection: string | null = null;
    let sectionsFound: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (Object.keys(sections).includes(trimmedLine)) {
        currentSection = trimmedLine;
        sectionsFound.push(trimmedLine);
        parsedSections[currentSection] = "";
        continue;
      }

      if (currentSection) {
        parsedSections[currentSection] += `${line}\n`;
      }
    }

    // Initialize empty sections for any missing ones
    Object.keys(sections).forEach((section) => {
      if (!sectionsFound.includes(section)) {
        parsedSections[section] = "";
      }
    });

    return parsedSections;
  };

  const calculateProgress = () => {
    const filledSections = Object.values(sections).filter(
      (content) => content.trim().length > 0
    ).length;
    return Math.round((filledSections / Object.keys(sections).length) * 100);
  };

  const handleSave = async () => {
    try {
      const combinedData = Object.entries(sections)
        .map(
          ([sectionName, sectionContent]) =>
            `${sectionName}\n${sectionContent.trim()}`
        )
        .join("\n\n");
      await saveData("userData", combinedData);
      setSaved(true);
      message.success("Changes saved successfully!");
    } catch (error) {
      message.error("Failed to save changes");
    }
  };

  const handleDownload = () => {
    try {
      const combinedData = Object.entries(sections)
        .map(
          ([sectionName, sectionContent]) =>
            `${sectionName}\n${sectionContent.trim()}`
        )
        .join("\n\n");
      downloadTextFile(combinedData);
      message.success("ATS friendly resume saved successfully!");
    } catch (error: any) {
      message.error("Failed to download resume", error.message);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !darkMode ? "dark" : "light";
      await saveData("globalTheme", newTheme);
      setDarkMode(!darkMode);
    } catch (error) {
      message.error("Failed to save theme preference");
    }
  };

  const showClearConfirm = () => {
    Modal.confirm({
      title: "Clear all content?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone. All sections will be cleared.",
      okText: "Clear All",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await clearData("userData");
          setSections(
            Object.fromEntries(Object.keys(sections).map((key) => [key, ""]))
          );
          setSaved(true);
          message.success("All content cleared");
        } catch (error) {
          message.error("Failed to clear data");
        }
      },
    });
  };

  const getWordCount = (text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length;
  const getCharCount = (text: string) => text.length;

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: darkMode ? token.colorBgContainer : "#f0f2f5",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 8,
        },
      }}
    >
      <Layout
        style={{
          minHeight: "100vh",
          background: darkMode ? "#141414" : "#fff",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%" }}
        >
          <Layout
            style={{
              background: darkMode ? "#141414" : "#fff",
              minHeight: "100vh",
              padding: "0.5rem",
            }}
          >
            <Content
              style={{
                background: darkMode ? "#141414" : "#fff",
                color: darkMode ? "#fff" : "#000",
              }}
            >
              {/* Header Section */}
              <Card
                style={{
                  marginBottom: "0.5rem",
                  backgroundColor: darkMode ? "#141414" : "#fff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <img
                        src="https://img.icons8.com/?size=100&id=eoxMN35Z6JKg&format=png&color=000000"
                        alt="Workday Copilot"
                        style={{ width: 30, height: 30, marginRight: 8 }}
                      />
                      <Title
                        level={4}
                        style={{
                          margin: 0,
                          color: darkMode ? "#fff" : "#000",
                          fontWeight: "bold",
                        }}
                      >
                        Workday Copilot
                      </Title>
                    </div>
                    <Text
                      type="secondary"
                      style={{ color: darkMode ? "#999" : undefined }}
                    >
                      Complete your profile sections below
                    </Text>
                  </div>
                  <Space size="middle">
                    <Tooltip
                      title={
                        saved ? "All changes saved" : "You have unsaved changes"
                      }
                    >
                      <InfoCircleOutlined
                        style={{
                          color: saved ? "#52c41a" : "#faad14",
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                    <Switch
                      checkedChildren="🌙"
                      unCheckedChildren="☀️"
                      checked={darkMode}
                      onChange={toggleTheme}
                    />
                  </Space>
                </div>

                {/* Progress Section */}
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Text style={{ color: darkMode ? "#999" : undefined }}>
                      Profile Completion
                    </Text>
                    <Text
                      strong
                      style={{ color: darkMode ? "#fff" : undefined }}
                    >
                      {calculateProgress()}%
                    </Text>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Progress
                      percent={calculateProgress()}
                      strokeColor={{
                        "0%": darkMode ? "#108ee9" : "#1890ff",
                        "100%": darkMode ? "#87d068" : "#52c41a",
                      }}
                      showInfo={false}
                    />
                  </motion.div>
                </div>
              </Card>

              {/* Main Content */}
              <Layout
                style={{
                  background: "transparent",
                  display: "flex",
                  flexDirection: "row",
                  height: "calc(100vh - 200px)",
                }}
              >
                {/* Sidebar */}
                <Sider
                  width={300}
                  style={{
                    background: "transparent",
                    marginRight: "2rem",
                    height: "100%",
                  }}
                >
                  <Card
                    style={{
                      background: darkMode ? "#141414" : "#fff",
                      borderRadius: "8px",
                      height: "100%",
                    }}
                  >
                    <Menu
                      theme={darkMode ? "dark" : "light"}
                      mode="inline"
                      selectedKeys={[activeSection]}
                      onClick={({ key }) => setActiveSection(key)}
                      style={{
                        background: darkMode ? "#141414" : "#fff",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      {Object.keys(sections).map((section) => (
                        <Menu.Item
                          key={section}
                          icon={sectionIcons[section]}
                          style={{
                            color: darkMode ? "#fff" : undefined,
                          }}
                        >
                          {section.replace(/_/g, " ")}
                        </Menu.Item>
                      ))}
                    </Menu>
                  </Card>
                </Sider>

                {/* Content Area */}
                <Content style={{ height: "100%" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      style={{ height: "90%" }}
                    >
                      <Card
                        title={
                          <Space style={{ color: darkMode ? "#fff" : "#000" }}>
                            {sectionIcons[activeSection]}
                            {activeSection.replace(/_/g, " ")}
                          </Space>
                        }
                        style={{
                          background: darkMode ? "#141414" : "#fff",
                          borderRadius: "8px",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <TextArea
                            value={sections[activeSection]}
                            onChange={(e) => {
                              setSaved(false);
                              setSections((prev) => ({
                                ...prev,
                                [activeSection]: e.target.value,
                              }));
                            }}
                            placeholder={`Enter your ${activeSection
                              .toLowerCase()
                              .replace(/_/g, " ")}...`}
                            autoSize={{ minRows: 13 }}
                            style={{
                              flex: 1,
                              background: darkMode ? "#1f1f1f" : "#fff",
                              color: darkMode ? "#fff" : undefined,
                              border: darkMode
                                ? "1px solid #434343"
                                : undefined,
                              resize: "none",
                            }}
                          />
                          <div
                            style={{
                              marginTop: "0.5rem",
                              fontSize: "12px",
                              color: darkMode ? "#999" : "#666",
                            }}
                          >
                            Words: {getWordCount(sections[activeSection])} |
                            Characters: {getCharCount(sections[activeSection])}
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "1rem",
                      }}
                    >
                      <Tooltip title="Clear all sections (Ctrl+Del)">
                        <Button danger onClick={showClearConfirm}>
                          Clear All
                        </Button>
                      </Tooltip>
                      <Tooltip title="Download resume (Ctrl+D)">
                        <Button
                          type="dashed"
                          icon={<DownloadOutlined />}
                          onClick={handleDownload}
                          style={{
                            marginRight: "1rem",
                          }}
                        >
                          Download Resume
                        </Button>
                      </Tooltip>
                      <Tooltip title="Save changes (Ctrl+S)">
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSave}
                          disabled={saved}
                        >
                          Save Changes
                        </Button>
                      </Tooltip>
                    </motion.div>
                  </AnimatePresence>
                </Content>
              </Layout>
            </Content>
          </Layout>
        </motion.div>
      </Layout>
    </ConfigProvider>
  );
};

export default WorkdayCopilot;
