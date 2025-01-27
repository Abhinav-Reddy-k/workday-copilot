import { useState } from "react";
import "./App.css";

function App() {
  const [userData, setUserData] = useState(""); // State for user data
  const [isCompatibleSite, setIsCompatibleSite] = useState(false); // Compatibility indicator

  // Load user data from localStorage
  useEffect(() => {
    chrome.storage.local.get(["userData"], (result) => {
      setUserData(result.userData || "");
    });
  }, []);

  // Check if the current site is compatible (Workday detection example)
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setIsCompatibleSite(url.includes("workday")); // Example: Check if URL contains "workday"
    });
  }, []);

  // Handle navigation to the editor page using chrome.tabs.create
  const goToEditor = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("editor.html"), // Open editor in a new tab
    });
  };

  // Handle the start autofill process
  const handleStartAutofill = () => {
    if (!userData) {
      alert("Please add your information first!");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      console.log("Starting autofill process...");

      if (tabId) {
        chrome.tabs.sendMessage(
          tabId,
          { action: "analyzeFields" },
          (response) => {
            console.log("Field Analysis Complete:", response);
          }
        );
      }
    });
    alert("Autofill process started!");
  };

  return (
    <div style={{ width: 300, padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Workday AutoFiller</h1>

      {isCompatibleSite ? (
        <p style={{ color: "green", fontWeight: "bold" }}>
          This site is supported!
        </p>
      ) : (
        <p style={{ color: "red", fontWeight: "bold" }}>
          This site is not supported.
        </p>
      )}

      {userData ? (
        <>
          <p>Your data is available.</p>
          <button
            onClick={goToEditor}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 8,
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            View / Edit Data
          </button>
        </>
      ) : (
        <>
          <p>Please add your info.</p>
          <button
            onClick={goToEditor}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 8,
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Add Your Info
          </button>
        </>
      )}

      <button
        onClick={handleStartAutofill}
        style={{
          width: "100%",
          padding: 8,
          backgroundColor: "#FF5722",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Start Autofill
      </button>

      <hr style={{ margin: "16px 0" }} />

      <button
        onClick={() =>
          alert(
            "This extension helps autofill Workday forms. Save your data, visit a Workday site, and click Start Autofill."
          )
        }
        style={{
          width: "100%",
          padding: 8,
          backgroundColor: "#757575",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        About This Extension
      </button>
    </div>
  );
}

export default App;
