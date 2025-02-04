import { handleMultiSelectInput } from "./multiSelect";
import { handleRadioGroupInput } from "./radioGroup";
import { handleSelectInput } from "./selectInput";
import { handleCheckboxInput } from "./checkbox";
import { handleTextInput } from "./textInput";
import { delay } from "@/utils/commonUtils";
import { handleDateInput } from "./dateInput";
import { getSaveButtonId } from "@/utils/aiUtil";
import {
  calculateOverallPercentage,
  getProgressBarStep,
} from "@/utils/progressUtils";

let maxRetryCountForCurrentPage = 3;
let saveButtonDataAutomationId: string | null = null;
let progressOnCurrentPage = 0;

async function fillThePage(hasError: boolean = false) {
  await analyzePageFields(hasError);
  await analyzeFieldsets(hasError);
  await handleNavigation();
}

/**
 * Analyzes page fields and processes them based on their types and attributes.
 * @param hasError - Indicates whether the function is analyzing the page due to errors.
 */
async function analyzePageFields(hasError: boolean = false): Promise<void> {
  const labels = Array.from(
    document.querySelectorAll<HTMLLabelElement>("label")
  );

  for (const [i, label] of labels.entries()) {
    const labelText = label.textContent?.trim() || "";
    const inputId = label.getAttribute("for");
    const inputElement = inputId ? document.getElementById(inputId) : null;

    if (!inputElement || !shouldProcessInput(inputElement, hasError)) continue;

    await processInputElement(inputElement, labelText);
    if (!hasError) {
      progressOnCurrentPage = (i / labels.length) * 100;
    }
  }

  await processDateInputs();
}

/**
 * Processes all fieldsets and their associated legends on the page.
 * @param hasError - Indicates whether the function is analyzing the page due to errors.
 */
async function analyzeFieldsets(hasError: boolean = false): Promise<void> {
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
      const legendInputElement =
        legendInputId && document.getElementById(legendInputId);

      if (
        !legendInputElement ||
        !shouldProcessInput(legendInputElement, hasError)
      )
        continue;

      if (
        legendInputElement.getAttribute("data-uxi-widget-type") === "radioGroup"
      ) {
        await handleRadioGroupInput(legendInputElement, legendText);
      }

      if (!hasError) {
        progressOnCurrentPage = 100;
      }
    }
  }
}

async function processDateInputs() {
  const dateInput = document.querySelector<HTMLElement>(
    '[data-automation-id="dateIcon"]'
  );

  if (dateInput && !dateInput.getAttribute("value")) {
    await handleDateInput(dateInput, "Date Input");
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
  return (
    !!inputElement &&
    (!hasError || inputElement.getAttribute("aria-invalid") === "true")
  );
}

/**
 * Processes an input element based on its type and attributes.
 * @param inputElement - The input element to process.
 * @param labelText - The label text associated with the input.
 * @param processedLabels - A set of previously processed labels.
 */
async function processInputElement(
  inputElement: HTMLElement,
  labelText: string
): Promise<void> {
  const widgetType = inputElement.getAttribute("data-uxi-widget-type");
  const inputType = inputElement.getAttribute("type");
  const isListbox = inputElement.getAttribute("aria-haspopup") === "listbox";
  if (inputElement.getAttribute("value")) {
    return;
  }

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
    maxRetryCountForCurrentPage = 3;
    throw new Error("Max retry count reached for the current page.");
  }

  const saveBtnId = saveButtonDataAutomationId || (await getSaveButtonId());

  saveButtonDataAutomationId = saveBtnId;

  const nextButton = document.querySelector<HTMLButtonElement>(
    `[data-automation-id="${saveBtnId}"]`
  );

  if (!nextButton) {
    throw Error("Next button not found.");
  }

  const previousStep = getProgressBarStep();

  nextButton.click();
  await delay(3000);

  const currentStep = getProgressBarStep();

  if (previousStep === currentStep) {
    maxRetryCountForCurrentPage--;
    await fillThePage(true);
  } else {
    maxRetryCountForCurrentPage = 3;
    await fillThePage();
  }
}

export default defineContentScript({
  matches: ["https://*.myworkdayjobs.com/*"],
  main() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "fillThePage") {
        fillThePage()
          .then(() => sendResponse({ status: "done" }))
          .catch((error) => {
            sendResponse({ status: "error", error: error.message });
          });
        return true;
      }
    });

    setInterval(() => {
      const overallProgress = calculateOverallPercentage(progressOnCurrentPage);
      overallProgress &&
        chrome.runtime.sendMessage({
          action: "updateOverallProgress",
          overallProgress,
        });
    }, 5000);
  },
});
