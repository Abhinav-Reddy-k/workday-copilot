import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Typography,
  Alert,
  Switch,
  Progress,
  Tooltip,
  Space,
  Upload,
  message,
  Input,
} from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlayCircleOutlined,
  FileTextOutlined,
  ExpandAltOutlined,
} from "@ant-design/icons";
import Lottie from "lottie-react";
import scanningAnimation from "../../animations/scanning.json";
import successAnimation from "../../animations/success.json";
import failureAnimation from "../../animations/failure.json";
import mammoth from "mammoth";
import { saveData, getData } from "@/utils/storageUtil";
import { formatResume } from "@/utils/commonUtils";
import Typewriter from "typewriter-effect";
import CustomMenu from "../../components/Menu";
import { BottomNav } from "../../components/BottomNav";

const { Title } = Typography;

function App() {
  const [userData, setUserData] = useState<string>("");
  const [isCompatibleSite, setIsCompatibleSite] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [autofillProgress, setAutofillProgress] = useState<number>(0);
  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(
    "There was an unexpected error, Please try again"
  );
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Load user data and additional context from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      const savedUserData = await getData("userData");
      if (savedUserData) setUserData(savedUserData);
      const savedTheme = await getData("globalTheme");
      if (savedTheme === "dark") setDarkMode(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (message: { action: string; overallProgress: number | null }) => {
        if (
          message.action === "updateOverallProgress" &&
          message.overallProgress !== null
        ) {
          setAutofillProgress(message.overallProgress);
        }
      }
    );
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (message: {
        action: string;
        payload: { action: string; reason: string; value: string };
      }) => {
        if (message.action === "updateStatus") {
          setReason(message.payload.reason);
          setAction(message.payload.action);
        }
      }
    );
  }, []);

  // Function to check if the current site is compatible
  const checkSiteCompatibility = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setIsCompatibleSite(url.includes("workday"));
    });
  };

  // Initial compatibility check on mount
  useEffect(() => {
    checkSiteCompatibility();
  }, []);

  // Listen for tab activation changes
  useEffect(() => {
    const handleTabChange = () => {
      checkSiteCompatibility(); // Re-check compatibility when the tab changes
    };

    chrome.tabs.onActivated.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener(handleTabChange);

    // Cleanup listeners on unmount
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabChange);
    };
  }, []);

  // Save user data to storage when it changes
  useEffect(() => {
    saveData("userData", userData);
  }, [userData]);

  // Dynamically inject placeholder styles
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      /* Light mode placeholder */
      .ant-input.textarea-placeholder::placeholder {
        color: ${darkMode ? "#ccc" : "#aaa"} !important;
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, [darkMode]);

  // Handle file upload and extract text
  const handleFileUpload = async (file: File) => {
    try {
      let extractedText = "";
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        extractedText = result.value;
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      }
      const updatedUserData = formatResume(extractedText);
      setUserData(updatedUserData);
      await saveData("userData", updatedUserData);
      message.success("File uploaded and text extracted successfully!");
    } catch (error) {
      message.error("Failed to process the file.");
    }
  };

  // Start autofill process
  const handleStartAutofill = async () => {
    if (!isCompatibleSite) {
      message.error("This site is not supported.");
      return;
    }
    if (!userData) {
      message.error("Please add your information first!");
      return;
    }
    setIsFilling(true);
    setAutofillProgress(0);
    await saveData("userData", userData);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;

      if (tabId) {
        chrome.tabs.sendMessage(
          tabId,
          { action: "fillThePage" },
          (response) => {
            if (response?.status === "done") {
              setIsSuccess(true);
              setTimeout(() => {
                setIsFilling(false);
                setIsSuccess(false);
              }, 3000);
            } else {
              if (response?.error) {
                setErrorMessage(
                  "There was an unexpected error, Please try again" +
                    "\n" +
                    response?.error
                );
              }
              setIsError(true);
              setTimeout(() => {
                setIsFilling(false);
                setIsError(false);
              }, 5000);
              message.error("Failed to autofill fields.");
            }
          }
        );
      }
    });
  };

  const [currentPath, setCurrentPath] = useState("/");

  const handleNavigation = (path: string) => {
    setCurrentPath(path);
  };

  const renderContent = () => {
    if (currentPath === "/") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Card
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: 20,
              textAlign: "center",
              background: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "none",
              boxShadow: darkMode
                ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                : "0 8px 24px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header */}
            <Space
              direction="vertical"
              size={16}
              style={{ flex: 1, width: "100%" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                <Switch
                  checkedChildren="🌙"
                  unCheckedChildren="☀️"
                  checked={darkMode}
                  onChange={() => {
                    setDarkMode(!darkMode);
                    saveData("globalTheme", darkMode ? "light" : "dark");
                  }}
                />
              </div>
              {/* Site Compatibility */}
              {isCompatibleSite ? (
                <Alert
                  message="This site is supported!"
                  type="success"
                  showIcon
                  icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                />
              ) : (
                <Alert
                  message="This site is not supported."
                  type="error"
                  showIcon
                  icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}
                />
              )}
              {/* File Upload */}
              {!isFilling && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  style={{ flex: 1 }}
                >
                  <Upload.Dragger
                    accept=".docx,.txt"
                    beforeUpload={(file) => {
                      handleFileUpload(file);
                      return false;
                    }}
                    showUploadList={false}
                    style={{
                      marginTop: 16,
                      background: darkMode ? "#333" : "#fafafa",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <FileTextOutlined style={{ fontSize: 24 }} />
                    </p>
                    <p
                      style={{
                        color: darkMode ? "#fff" : "#000",
                      }}
                      className="ant-upload-hint"
                    >
                      Drop your resume .docx, .txt
                    </p>
                  </Upload.Dragger>
                </motion.div>
              )}

              {/* Additional Context */}
              {!isFilling && (
                <div style={{ position: "relative", flex: 1, marginTop: 16 }}>
                  <Input.TextArea
                    className={`textarea-placeholder ${
                      darkMode ? "dark-mode" : ""
                    }`}
                    value={userData}
                    onChange={(e) => setUserData(e.target.value)}
                    placeholder="Add your details here..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{
                      background: darkMode ? "#1f1f1f" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                      height: "100%",
                    }}
                  />
                  <Tooltip title="Full Screen">
                    <Button
                      icon={
                        <ExpandAltOutlined
                          style={{
                            color: darkMode ? "#fff" : "#000",
                          }}
                        />
                      }
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 12,
                        padding: 4,
                        background: "transparent",
                        border: "none",
                      }}
                      onClick={() => {
                        chrome.tabs.create({
                          url: chrome.runtime.getURL("editor.html"),
                        });
                      }}
                    />
                  </Tooltip>
                </div>
              )}
              {/* Start Autofill Button */}
              <motion.div
                layout
                initial={{ opacity: 1, y: 0 }}
                animate={isFilling ? { y: -20 } : { y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginTop: 16 }}
              >
                <Button
                  type="primary"
                  danger
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartAutofill}
                  block
                  disabled={isFilling}
                >
                  Start Autofill
                </Button>
              </motion.div>
              {/* Autofill Progress */}
              {isFilling && !isSuccess && !isError && (
                <>
                  <Lottie
                    animationData={scanningAnimation}
                    style={{ height: 80, margin: "10px auto" }}
                  />
                  <Progress
                    percent={autofillProgress}
                    strokeColor={{
                      from: "#108ee9",
                      to: "#87d068",
                    }}
                  />
                </>
              )}

              {isFilling && !isSuccess && !isError && (
                <>
                  <Typewriter
                    key={action}
                    options={{
                      autoStart: true,
                      loop: false, // Set to true if you want it to loop
                      delay: 10,
                    }}
                    onInit={(typewriter) => {
                      // Start typing the current state value
                      typewriter.typeString(action + "\n" + reason).start();
                    }}
                  />
                </>
              )}
              {/* Success Animation */}
              {isSuccess && (
                <Lottie
                  animationData={successAnimation}
                  style={{ height: 120, margin: "20px auto" }}
                />
              )}

              {/* Error Animation */}
              {isError && (
                <>
                  <Lottie
                    animationData={failureAnimation}
                    style={{ height: 120, margin: "20px auto" }}
                  />
                  <Typewriter
                    options={{
                      autoStart: true,
                      loop: false, // Set to true if you want it to loop
                      delay: 10,
                    }}
                    onInit={(typewriter) => {
                      // Start typing the current state value
                      typewriter.typeString(errorMessage).start();
                    }}
                  />
                </>
              )}
            </Space>
          </Card>
        </motion.div>
      );
    }

    if (currentPath === "/menu") {
      return (
        <>
          <CustomMenu darkMode={darkMode} />
        </>
      );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <BottomNav
        activePath={currentPath}
        onNavigate={handleNavigation}
        darkMode={darkMode}
      />
    </>
  );
}

export default App;
