import { generateText } from "@/utils/aiUtil";
import { delay, updateStatus } from "@/utils/commonUtils";
import { getProgressBarStep } from "@/utils/progressUtils";

/**
 * Represents an option in a multi-select dropdown
 * @interface MultiSelectOption
 * @property {string | null} optionText - The display text of the option
 * @property {string | null} optionId - The unique identifier of the option
 * @property {Element} element - The DOM element representing the option
 */
interface MultiSelectOption {
  optionText: string | null;
  optionId: string | null;
}

/**
 * Structure of the AI response for option selection
 * @interface AIResponse
 * @property {string} reason - Explanation for why the option was selected
 * @property {string} optionId - The ID of the selected option
 */
interface AIResponse {
  reason: string;
  optionId: string;
}

/**
 * Enum representing the types of multi-select controls
 * @enum {string}
 */
enum MultiSelectType {
  /** Single-level selection */
  Single = "1",
  /** Two-level nested selection */
  Nested = "2",
}

/**
 * Custom error class for multi-select related errors
 * @class MultiSelectError
 * @extends Error
 */
class MultiSelectError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code for categorizing the error
   */
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "MultiSelectError";
  }
}

/** Constants used throughout the module */
const DELAY_MS = 2000;
/** DOM selectors used for finding elements */
const SELECTORS = {
  MULTISELECT_ITEM: 'data-uxi-widget-type="multiselectlistitem"',
  PROMPT_OPTION: '[data-automation-id="promptOption"]',
} as const;

/**
 * Handles the interaction with a multi-select input element
 * @param {HTMLElement} inputElement - The input element to interact with
 * @param {string} labelText - The label text associated with the input
 * @param {string[]} processedLabels - Array of labels that have been processed so far
 * @throws {MultiSelectError} When input validation fails or interaction errors occur
 * @returns {Promise<void>}
 */
export async function handleMultiSelectInput(
  inputElement: HTMLElement,
  labelText: string
): Promise<void> {
  try {
    validateInputs(inputElement, labelText);

    inputElement.click();
    await delay(DELAY_MS);

    const controlId = getControlId(inputElement);
    const options = getOptions(controlId);
    const multiselectType = getMultiSelectType(options[0]);

    const primaryOptionId = await selectOption(options, labelText);
    await clickOption(primaryOptionId);

    if (multiselectType === MultiSelectType.Nested) {
      await handleNestedSelection(controlId, labelText);
    }
  } catch (error) {
    handleError(error);
  }
}

/**
 * Validates the input parameters
 * @param {HTMLElement} inputElement - The input element to validate
 * @param {string} labelText - The label text to validate
 * @throws {MultiSelectError} When validation fails
 */
function validateInputs(inputElement: HTMLElement, labelText: string): void {
  if (!labelText?.trim()) {
    throw new MultiSelectError("Label text is required.", "INVALID_LABEL");
  }
  if (!inputElement) {
    throw new MultiSelectError("Input element is required.", "INVALID_ELEMENT");
  }
}

/**
 * Retrieves the control ID from an element
 * @param {HTMLElement} element - Element containing the control ID
 * @returns {string} The control ID
 * @throws {MultiSelectError} When control ID is missing
 */
function getControlId(element: HTMLElement): string {
  const controlId = element.getAttribute("data-uxi-multiselect-id");
  if (!controlId) {
    throw new MultiSelectError(
      "data-uxi-multiselect-id attribute is missing.",
      "MISSING_CONTROL_ID"
    );
  }
  return controlId;
}

/**
 * Retrieves all options for a given control ID
 * @param {string} controlId - The control ID to find options for
 * @returns {Element[]} Array of option elements
 * @throws {MultiSelectError} When no options are found
 */
function getOptions(controlId: string): Element[] {
  const selector = `[${SELECTORS.MULTISELECT_ITEM}][data-uxi-multiselect-id="${controlId}"]`;
  const options = Array.from(document.querySelectorAll(selector));

  if (!options.length) {
    throw new MultiSelectError("No options found.", "NO_OPTIONS");
  }

  return options;
}

/**
 * Determines the type of multi-select from an element
 * @param {Element} element - Element containing the type information
 * @returns {MultiSelectType} The type of multi-select
 */
function getMultiSelectType(element: Element): MultiSelectType {
  const type = element.getAttribute(
    "data-uxi-multiselectlistitem-type"
  ) as MultiSelectType;
  return type || MultiSelectType.Single;
}

/**
 * Handles the selection of nested options
 * @param {string} controlId - The control ID for the nested selection
 * @param {string} labelText - The label text to use for selection
 * @param {string[]} processedLabels - Previously processed labels
 * @returns {Promise<void>}
 */
async function handleNestedSelection(
  controlId: string,
  labelText: string
): Promise<void> {
  await delay(DELAY_MS);

  const subOptions = getOptions(controlId);
  const subOptionId = await selectOption(subOptions, labelText);
  await clickOption(subOptionId);
}

/**
 * Clicks an option by its ID
 * @param {string} optionId - The ID of the option to click
 * @returns {Promise<void>}
 * @throws {MultiSelectError} When the option cannot be found
 */
async function clickOption(optionId: string): Promise<void> {
  const option = document.getElementById(optionId);
  if (!option) {
    throw new MultiSelectError(
      `Option with ID "${optionId}" not found.`,
      "OPTION_NOT_FOUND"
    );
  }
  option.click();
}

/**
 * Uses AI to select the most appropriate option from a list
 * @param {Element[]} options - Available options to choose from
 * @param {string} labelText - The label text to base the selection on
 * @param {string[]} processedLabels - Previously processed labels
 * @returns {Promise<string>} The ID of the selected option
 * @throws {MultiSelectError} When AI selection fails
 */
async function selectOption(
  options: Element[],
  labelText: string
): Promise<string> {
  const optionsData = parseOptions(options);

  try {
    const prompt = generatePrompt(labelText, optionsData);
    const aiResponse = await generateText(prompt, true);
    const completion = parseAIResponse(aiResponse);

    updateStatus(
      `Filling input ${labelText}...`,
      completion.reason,
      completion.optionId
    );

    validateAIResponse(completion, optionsData);

    return completion.optionId.trim();
  } catch (error: any) {
    throw new MultiSelectError(
      `AI selection failed: ${error.message}`,
      "AI_SELECTION_FAILED"
    );
  }
}

/**
 * Parses DOM elements into MultiSelectOption objects
 * @param {Element[]} options - The elements to parse
 * @returns {MultiSelectOption[]} Array of parsed options
 */
function parseOptions(options: Element[]): MultiSelectOption[] {
  return options.map((option) => ({
    optionText: option.textContent?.trim() ?? null,
    optionId: option.querySelector(SELECTORS.PROMPT_OPTION)?.id ?? null,
  }));
}

/**
 * Generates the prompt for the AI model
 * @param {string} labelText - The label text to use in the prompt
 * @param {string[]} processedLabels - Previously processed labels
 * @param {MultiSelectOption[]} optionsData - Available options
 * @returns {string} The generated prompt
 */
function generatePrompt(
  labelText: string,
  optionsData: MultiSelectOption[]
): string {
  return `
    You are an intelligent assistant helping a user complete a job application form on Workday. Your task is to select the most suitable option from the provided options based on the given label text and options data.  

    ### Instructions:
    1. Carefully analyze the **label text** and the list of available options.
    2. Use the label and options data to identify the option that is the best fit.
    3. Return a **JSON object** in this below structure:  
      { "reason": "reason for selecting the option", "optionId": "optionId" }  

    ### Important:
    - The **"optionId"** must be the exact one-word value from the provided "optionId" in the options data.
    - The **reason** should clearly justify why the selected option is the most appropriate.

    ### Inputs:
    - **Label Text**: ${labelText}  
    - **Options Data**: ${JSON.stringify(optionsData)}  
    - **${getProgressBarStep()}**

    Respond only with the JSON object.
  `;
}

/**
 * Parses the AI response into a structured object
 * @param {string} response - The raw AI response
 * @returns {AIResponse} The parsed response
 * @throws {Error} When the response is invalid JSON
 */
function parseAIResponse(response: string): AIResponse {
  try {
    return JSON.parse(response);
  } catch (error) {
    throw new Error("Invalid JSON response from AI");
  }
}

/**
 * Validates the AI response against available options
 * @param {AIResponse} response - The AI response to validate
 * @param {MultiSelectOption[]} optionsData - Available options to validate against
 * @throws {Error} When validation fails
 */
function validateAIResponse(
  response: AIResponse,
  optionsData: MultiSelectOption[]
): void {
  if (!response.optionId || typeof response.optionId !== "string") {
    throw new Error("Invalid optionId in AI response");
  }

  const validOptionIds = optionsData
    .map((opt) => opt.optionId)
    .filter((id): id is string => id !== null);

  if (!validOptionIds.includes(response.optionId)) {
    throw new Error("Selected optionId does not match any available options");
  }
}

/**
 * Handles errors in a consistent way
 * @param {unknown} error - The error to handle
 * @throws {unknown} Always throws the error after logging
 */
function handleError(error: unknown) {
  if (error instanceof MultiSelectError) {
    console.error(`[${error.code}] ${error.message}`);
  } else {
    console.error("Unexpected error:", error);
  }
}
