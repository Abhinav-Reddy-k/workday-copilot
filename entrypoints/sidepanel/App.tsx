import { useState, useEffect, use } from "react";
import {
  Button,
  Card,
  Typography,
  Alert,
  Divider,
  Switch,
  Progress,
  Tooltip,
  Space,
  Upload,
  message,
  Input,
} from "antd";
import { motion } from "framer-motion";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlayCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  ExpandAltOutlined,
} from "@ant-design/icons";
import Lottie from "lottie-react";
import scanningAnimation from "../../animations/scanning.json";
import successAnimation from "../../animations/success.json";
import mammoth from "mammoth";
import { saveData, getData } from "@/utils/storageUtil";
import { formatResume } from "@/utils/commonUtils";
import Typewriter from "typewriter-effect";

const { Title } = Typography;

function App() {
  const [userData, setUserData] = useState<string>("");
  const [isCompatibleSite, setIsCompatibleSite] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [autofillProgress, setAutofillProgress] = useState<number>(0);
  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Load user data and additional context from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      const savedUserData = await getData("userData");
      if (savedUserData) setUserData(savedUserData);
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
        console.log("received", message);
        if (message.action === "updateStatus") {
          console.log(message);
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
      console.log("Starting autofill process...");

      if (tabId) {
        chrome.tabs.sendMessage(
          tabId,
          { action: "analyzeFields" },
          (response) => {
            if (response?.status === "done") {
              setIsSuccess(true);
              setTimeout(() => {
                setIsFilling(false);
                setIsSuccess(false);
              }, 3000);
            } else {
              message.error("Failed to autofill fields.");
              setIsFilling(false);
            }
          }
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
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
                src="https://cdn-icons-png.flaticon.com/512/2921/2921156.png"
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
              onChange={() => setDarkMode(!darkMode)}
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
                <p className="ant-upload-hint">Drop your resume .docx, .txt</p>
              </Upload.Dragger>
            </motion.div>
          )}

          {/* Additional Context */}
          {!isFilling && (
            <div style={{ position: "relative", flex: 1, marginTop: 16 }}>
              <Input.TextArea
                value={userData}
                onChange={(e) => setUserData(e.target.value)}
                placeholder="Add data here..."
                autoSize={{ minRows: 3, maxRows: 6 }}
                style={{
                  background: darkMode ? "#333" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  height: "100%",
                }}
              />
              <Tooltip title="Full Screen">
                <Button
                  icon={<ExpandAltOutlined />}
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
          {isFilling && !isSuccess && (
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

          {isFilling && (
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
        </Space>
      </Card>
    </motion.div>
  );
}

export default App;
