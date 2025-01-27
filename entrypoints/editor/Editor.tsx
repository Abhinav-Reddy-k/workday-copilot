import { useState, useEffect } from "react";
import { getData, saveData } from "@/utils/storageUtil";

const Editor = () => {
  const [userData, setUserData] = useState(""); // Store the input data
  const [savedData, setSavedData] = useState(""); // Store the saved data (loaded from localStorage)

  // Load existing user data from localStorage
  useEffect(() => {
    async function fetchData() {
      const data = await getData("userData");
      setSavedData(data || "");
    }
    console.log("fetching data");
    fetchData();
  }, []);

  // Handle saving the user data
  const handleSaveData = async () => {
    if (userData.trim()) {
      await saveData("userData", userData);
      setSavedData(userData);
      alert("Data saved successfully!");
    } else {
      alert("Please enter some data before saving.");
    }
  };

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "Arial, sans-serif",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h1>Editor: Workday AutoFiller</h1>
      <textarea
        style={{
          width: "100%",
          height: 300,
          padding: 10,
          fontSize: 14,
          borderRadius: 4,
          border: "1px solid #ccc",
          marginBottom: 16,
        }}
        value={userData || savedData} // Display current user input or saved data
        onChange={(e) => {
          console.log(e.target.value);
          setUserData(e.target.value ? e.target.value : "Please input data"); // Update the user input
        }} // Update the user input
      />
      <br />
      <button
        onClick={handleSaveData}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Save Data
      </button>
      <br />
      <button
        onClick={() => window.close()} // Close the editor window
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: "#FF5722",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          marginTop: 10,
        }}
      >
        Close Editor
      </button>
    </div>
  );
};

export default Editor;
