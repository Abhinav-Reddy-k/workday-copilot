import { generateText } from "@/utils/aiUtil";
import { getTextContentAbove, updateStatus } from "@/utils/commonUtils";
import { getProgressBarStep } from "@/utils/progressUtils";

/**
 * Represents the possible states of a checkbox
 */
type CheckboxState = "checked" | "unchecked";

/**
 * Response structure from the AI model
 * @interface AIResponse
 */
interface AIResponse {
  /** Explanation for the chosen state */
  reason: string;
  /** Desired checkbox state */
  state: CheckboxState;
}

/**
 * Custom error class for checkbox-related errors
 */
class CheckboxError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "CheckboxError";
  }
}

/**
 * Type guard to check if an element is a checkbox input
 * @param element - Element to check
 * @returns True if element is a checkbox input
 */
function isCheckboxInput(element: HTMLElement): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === "checkbox";
}

/**
 * Handles a checkbox input by determining whether it should be checked or unchecked using AI suggestions.
 * @param inputElement - The HTML checkbox element to update
 * @param labelText - The label text associated with the checkbox
 * @throws {CheckboxError} When input validation fails or interaction errors occur
 */
export const handleCheckboxInput = async (
  inputElement: HTMLElement,
  labelText: string
): Promise<void> => {
  try {
    validateInputs(inputElement, labelText);

    const checkbox = inputElement as HTMLInputElement;
    const currentState = getCheckboxState(checkbox);
    const contextSoFar = getTextContentAbove(checkbox);
    const desiredState = await determineDesiredState(
      labelText,
      currentState,
      contextSoFar
    );

    await updateCheckboxState(checkbox, desiredState);
  } catch (error) {
    handleError(error);
  }
};

/**
 * Validates the input parameters
 * @throws {CheckboxError} When validation fails
 */
function validateInputs(element: HTMLElement, labelText: string): void {
  if (!labelText?.trim()) {
    throw new CheckboxError("Label text is required.", "INVALID_LABEL");
  }

  if (!isCheckboxInput(element)) {
    throw new CheckboxError(
      "Invalid input element: Expected a checkbox",
      "INVALID_INPUT_TYPE"
    );
  }
}

/**
 * Gets the current state of a checkbox
 */
function getCheckboxState(checkbox: HTMLInputElement): CheckboxState {
  return checkbox.checked ? "checked" : "unchecked";
}

/**
 * Determines the desired state of the checkbox using AI
 * @throws {CheckboxError} When AI processing fails
 */
async function determineDesiredState(
  labelText: string,
  currentState: CheckboxState,
  contextSoFar: string
): Promise<CheckboxState> {
  try {
    const prompt = generatePrompt(labelText, currentState, contextSoFar);
    const aiResponse = await generateText(prompt, true);
    const completion = parseAIResponse(aiResponse);

    updateStatus(
      `Filling input ${labelText}...`,
      completion.reason,
      completion.state
    );

    validateAIResponse(completion);

    return completion.state;
  } catch (error) {
    throw new CheckboxError(
      "Failed to determine checkbox state",
      "AI_PROCESSING_FAILED",
      error
    );
  }
}

/**
 * Generates the prompt for the AI model
 */
function generatePrompt(
  labelText: string,
  currentState: CheckboxState,
  contextSoFar: string
): string {
  return `
    You are an intelligent assistant helping a user complete a job application form on Workday. Your task is to determine whether a checkbox should be checked or unchecked based on the given label text, the current state of the checkbox, and the user's saved data.  

    ### Instructions:
    1. Carefully analyze the **label text**, the **current checkbox value**, and the context provided.
    2. Decide whether the checkbox should remain checked or be updated to unchecked.
    3. Return a **JSON object** in the exact structure:  
      { "reason": "reason for selecting the option", "state": "checked" or "unchecked" }  

    ### Important:
    - The **state** field must strictly be either "checked" or "unchecked".
    - The **reason** should clearly explain why this state is the best choice based on the given inputs.

    ### Inputs:
    - **Label Text**: ${labelText}
    - **${getProgressBarStep()}**
    - **Form filled so far**: ${contextSoFar}

    Respond only with the JSON object.
  `;
}

/**
 * Parses and validates the AI response
 * @throws {Error} When response is invalid
 */
function parseAIResponse(response: string): AIResponse {
  try {
    return JSON.parse(response);
  } catch (error) {
    throw new Error("Invalid JSON response from AI");
  }
}

/**
 * Validates the structure and content of the AI response
 * @throws {Error} When validation fails
 */
function validateAIResponse(response: AIResponse): void {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid response structure");
  }

  if (!["checked", "unchecked"].includes(response.state)) {
    throw new Error("Invalid checkbox state in response");
  }

  if (typeof response.reason !== "string" || !response.reason.trim()) {
    throw new Error("Invalid or missing reason in response");
  }
}

/**
 * Updates the checkbox state if necessary
 * @throws {CheckboxError} When state update fails
 */
async function updateCheckboxState(
  checkbox: HTMLInputElement,
  desiredState: CheckboxState
): Promise<void> {
  const shouldBeChecked = desiredState === "checked";

  if (checkbox.checked !== shouldBeChecked) {
    try {
      checkbox.click();
    } catch (error) {
      throw new CheckboxError(
        "Failed to update checkbox state",
        "STATE_UPDATE_FAILED",
        error
      );
    }
  }
}

/**
 * Handles errors in a consistent way
 * @throws {CheckboxError} Always throws the error after logging
 */
function handleError(error: unknown) {
  if (error instanceof CheckboxError) {
    console.error(`[${error.code}] ${error.message}`, error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
