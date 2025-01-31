import { handleMultiSelectInput } from "./multiSelect";
import { handleRadioGroupInput } from "./radioGroup";
import { handleSelectInput } from "./selectInput";
import { handleCheckboxInput } from "./checkbox";
import { handleTextInput } from "./textInput";
import { getProgressBarStep, delay } from "@/utils/commonUtils";
import { handleDateInput } from "./dateInput";

let maxRetryCountForCurrentPage = 3;
let saveButtonDataAutomationId: string | null = null;
let progressOnCurrentPage = 0;

/**
 * Analyzes page fields and processes them based on their types and attributes.
 * @param hasError - Indicates whether the function is analyzing the page due to errors.
 */
async function analyzePageFields(hasError: boolean = false): Promise<void> {
  try {
    const labels = Array.from(
      document.querySelectorAll<HTMLLabelElement>("label")
    );

    let currentLabel = 0;

    const isDateInput = document.querySelector<HTMLElement>(
      '[data-automation-id="dateIcon"]'
    );

    console.log("Date Input", isDateInput);

    if (isDateInput) {
      await handleDateInput(isDateInput, "Date Input");
    }

    await processFieldsets(hasError);

    for (const label of labels) {
      const labelText = label.textContent?.trim() || "";
      const inputId = label.getAttribute("for");
      const inputElement = inputId ? document.getElementById(inputId) : null;

      if (!inputElement || !shouldProcessInput(inputElement, hasError))
        continue;

      await processInputElement(inputElement, labelText, hasError);
      delay(1000);
      // update current page progress after processing each input based on number of labels processed
      currentLabel++;
      progressOnCurrentPage = (currentLabel / labels.length) * 100;
    }
    progressOnCurrentPage = 100;
    await handleNavigation();
  } catch (error) {
    console.error("Error analyzing page fields:", error);
  }
}

/**
 * Determines if an input element should be processed.
 * @param inputElement - The input element to check.
 * @param hasError - Whether the page is being analyzed due to errors.
 * @returns True if the input should be processed, false otherwise.
 */
function shouldProcessInput(
  inputElement: HTMLElement,
  hasError: boolean
): boolean {
  if (!inputElement) return false;
  if (hasError && inputElement.getAttribute("aria-invalid") !== "true")
    return false;
  return true;
}

/**
 * Processes an input element based on its type and attributes.
 * @param inputElement - The input element to process.
 * @param labelText - The label text associated with the input.
 * @param processedLabels - A set of previously processed labels.
 */
async function processInputElement(
  inputElement: HTMLElement,
  labelText: string,
  hasError: boolean
): Promise<void> {
  const widgetType = inputElement.getAttribute("data-uxi-widget-type");
  const inputType = inputElement.getAttribute("type");
  const isListbox = inputElement.getAttribute("aria-haspopup") === "listbox";

  if (isListbox) {
    await handleSelectInput(inputElement, labelText);
  } else if (widgetType === "selectinput") {
    await handleMultiSelectInput(inputElement, labelText);
  } else if (widgetType === "radioGroup") {
    await handleRadioGroupInput(inputElement, labelText);
  } else if (inputType === "checkbox") {
    await handleCheckboxInput(inputElement, labelText);
  } else if (inputType === "text" || inputElement.tagName === "TEXTAREA") {
    await handleTextInput(inputElement, labelText);
  }
}

/**
 * Handles navigation to the next page and reanalyzes if errors are detected.
 */
async function handleNavigation(): Promise<void> {
  if (maxRetryCountForCurrentPage <= 0) {
    console.warn("Max retry count reached for the current page.");
    return;
  }

  const dataAutomationId = saveButtonDataAutomationId
    ? saveButtonDataAutomationId
    : await getCorrectDataAutomationId();

  if (dataAutomationId) {
    console.log("The correct Data-Automation-ID is:", dataAutomationId);
  }

  // Optionally, use this ID to find and click the button
  const nextButton = document.querySelector<HTMLButtonElement>(
    `[data-automation-id="${dataAutomationId}"]`
  );

  if (!nextButton) {
    console.warn("Next button not found.");
    return;
  }

  saveButtonDataAutomationId = dataAutomationId;

  const previousStep = getProgressBarStep();

  nextButton.click();
  await delay(6000);
  console.log("Next button clicked, waiting for navigation...");

  const currentStep = getProgressBarStep();

  if (previousStep === currentStep) {
    console.log("Errors found, reanalyzing page...");
    maxRetryCountForCurrentPage--;
    await analyzePageFields(true);
  } else {
    maxRetryCountForCurrentPage = 3;
    console.log("Navigated to the next page, analyzing...");
    await analyzePageFields();
  }
}

/**
 * Processes all fieldsets and their associated legends on the page.
 * @param hasError - Indicates whether the function is analyzing the page due to errors.
 */
async function processFieldsets(hasError: boolean): Promise<void> {
  try {
    const fieldsets = Array.from(
      document.querySelectorAll<HTMLFieldSetElement>("fieldset")
    );

    for (const fieldset of fieldsets) {
      const legends = Array.from(
        fieldset.querySelectorAll<HTMLLegendElement>("legend")
      );

      for (const legend of legends) {
        const legendText = legend.textContent?.trim() || "";
        const legendInputId = legend.getAttribute("for");
        const legendInputElement = legendInputId
          ? document.getElementById(legendInputId)
          : null;

        if (!legendInputElement) {
          continue;
        }

        if (!shouldProcessInput(legendInputElement, hasError)) continue;

        if (
          legendInputElement.getAttribute("data-uxi-widget-type") ===
          "radioGroup"
        ) {
          await handleRadioGroupInput(legendInputElement, legendText);
        }
      }
    }
  } catch (error) {
    console.error("Error processing fieldsets:", error);
  }
}

export default defineContentScript({
  matches: ["https://*.myworkdayjobs.com/*"],
  main() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "analyzeFields") {
        analyzePageFields()
          .then(() => sendResponse({ status: "done" }))
          .catch((error) =>
            sendResponse({ status: "error", error: error.message })
          );
        return true;
      }
    });

    // send updates on current progress to sidepanel
    setInterval(() => {
      const overallProgress = calculateOverallPercentage(
        getProgress(getProgressBarStep()),
        progressOnCurrentPage
      )?.toFixed(1);
      overallProgress &&
        chrome.runtime.sendMessage({
          action: "updateOverallProgress",
          overallProgress,
        });
    }, 1000);
  },
});

function getAllButtonsData(): {
  dataAutomationId: string;
  textContent: string;
}[] {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "button[data-automation-id]"
  );
  return Array.from(buttons).map((button) => ({
    dataAutomationId: button.getAttribute("data-automation-id") || "",
    textContent: button.textContent?.trim() || "",
  }));
}

async function getCorrectDataAutomationId(): Promise<string | null> {
  const buttonData = getAllButtonsData();

  if (buttonData.length === 0) {
    console.warn("No buttons with data-automation-id found on the page.");
    return null;
  }

  // Step 2: Construct the prompt for OpenAI
  const buttonListString = buttonData
    .map(
      (button, index) =>
        `${index + 1}. Text: "${button.textContent}" | Data-Automation-ID: "${
          button.dataAutomationId
        }"`
    )
    .join("\n");

  const prompt = `You are an intelligent assistant helping a user complete a job ap
    plication form on Workday. 
    Your task is to identify the most appropriate button to proceed to the next step of the form. \n\n
    ### Instructions:\n
    1. Analyze the **button text** and **Data-Automation-ID**.\n2. 
    Use the context provided by the button text to determine the best possible button for the action.\n
    3. Return a **JSON object** in the below structure:\n  
    { "reason": "reason for selecting the button", "dataAutomationId": "the data-automation-id of the selected button" }  \n
    4. If no button matches, provide a reason and return null.\n\n
    ### Inputs:\n
    - **Context**: The user is navigating a Workday form and looking for the 'Next' button to proceed to the next step.\n
    - **Buttons**:\n${buttonListString}\n\n
    Which button corresponds to the action to proceed? Respond only with a JSON object.`;

  // Step 3: Use the helper function to query OpenAI
  try {
    const result: {
      reason: string;
      dataAutomationId: string;
    } = JSON.parse(await generateText(prompt));

    // check if the dataAutomationId is valid
    const selectedButton = buttonData.find(
      (button) => button.dataAutomationId === result.dataAutomationId
    );

    if (selectedButton) {
      console.log("Reason for button selection:", result.reason);
      return result.dataAutomationId;
    } else {
      return await getCorrectDataAutomationId();
    }
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    return null;
  }
}

function getProgress(text: string): number | null {
  const match = text.match(/\d+/g);
  if (match && match[0] && match[1]) {
    const current = parseInt(match[0], 10);
    const total = parseInt(match[1], 10);
    const percentage = total === 0 ? null : (current / total) * 100; // Avoid division by zero
    return percentage;
  }
  return null;
}

function calculateOverallPercentage(
  workflowPercentage: number | null,
  pagePercentage: number | null
): number | null {
  if (workflowPercentage === null || pagePercentage === null) {
    return null; // Handle cases where percentage data is missing
  }

  const workflowWeight = 0.7;
  const pageWeight = 1 - workflowWeight;

  const overallPercentage =
    workflowWeight * workflowPercentage + pageWeight * pagePercentage;

  return overallPercentage;
}
