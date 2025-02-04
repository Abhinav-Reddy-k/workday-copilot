import { generateText } from "@/utils/aiUtil";
import { delay, updateStatus } from "@/utils/commonUtils";

/**
 * Represents an option in a select dropdown
 * @interface SelectOption
 */
interface SelectOption {
  /** The display text of the option */
  optionText: string | null;
  /** The unique identifier of the option */
  id: string | null;
}

/**
 * Response structure from the AI model
 * @interface AIResponse
 */
interface AIResponse {
  /** Explanation for why the option was selected */
  reason: string;
  /** Selected option identifier */
  id: string;
}

/**
 * Custom error class for select input related errors
 */
class SelectInputError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "SelectInputError";
  }
}

/** Time to wait for UI updates in milliseconds */
const UI_UPDATE_DELAY = 1000;

/**
 * Handles the interaction with a select input element
 * @param inputElement - The select input element to interact with
 * @param labelText - The label text associated with the select
 * @throws {SelectInputError} When input validation fails or interaction errors occur
 */
export async function handleSelectInput(
  inputElement: HTMLElement,
  labelText?: string
): Promise<void> {
  try {
    validateInputs(inputElement, labelText);

    await openSelectDropdown(inputElement);
    const options = await getSelectOptions(inputElement);
    const selectedId = await selectOptionWithAI(options, labelText!);
    await clickOption(selectedId);
  } catch (error) {
    handleError(error);
  }
}

/**
 * Validates the input parameters
 * @throws {SelectInputError} When validation fails
 */
function validateInputs(inputElement: HTMLElement, labelText?: string): void {
  if (!labelText?.trim()) {
    throw new SelectInputError("Label text is required.", "INVALID_LABEL");
  }
  if (!inputElement) {
    throw new SelectInputError("Input element is required.", "INVALID_INPUT");
  }
}

/**
 * Opens the select dropdown and waits for UI update
 * @throws {SelectInputError} When interaction fails
 */
async function openSelectDropdown(inputElement: HTMLElement): Promise<void> {
  try {
    inputElement.click();
    await delay(UI_UPDATE_DELAY);
  } catch (error) {
    throw new SelectInputError(
      "Failed to open select dropdown",
      "CLICK_FAILED",
      error
    );
  }
}

/**
 * Retrieves options from the select dropdown
 * @throws {SelectInputError} When options cannot be found
 */
async function getSelectOptions(
  inputElement: HTMLElement
): Promise<NodeListOf<Element>> {
  const controls = inputElement.getAttribute("aria-controls");
  if (!controls) {
    throw new SelectInputError(
      "aria-controls attribute is missing.",
      "MISSING_CONTROLS"
    );
  }

  const listbox = document.getElementById(controls);
  if (!listbox) {
    throw new SelectInputError("Listbox not found.", "LISTBOX_NOT_FOUND");
  }

  const options = listbox.querySelectorAll("li");
  if (!options.length) {
    throw new SelectInputError("No options found.", "NO_OPTIONS");
  }

  return options;
}

/**
 * Selects an option using AI
 * @throws {SelectInputError} When AI selection fails
 */
async function selectOptionWithAI(
  options: NodeListOf<Element>,
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
      completion.id
    );

    validateAIResponse(completion, optionsData);

    return completion.id;
  } catch (error) {
    throw new SelectInputError(
      "AI selection failed",
      "AI_SELECTION_FAILED",
      error
    );
  }
}

/**
 * Parses DOM elements into SelectOption objects
 */
function parseOptions(options: NodeListOf<Element>): SelectOption[] {
  return Array.from(options).map((option) => ({
    optionText: option.textContent?.trim() ?? null,
    id: option.id,
  }));
}

/**
 * Generates the prompt for the AI model
 */
function generatePrompt(labelText: string, options: SelectOption[]): string {
  return `
    You are an intelligent assistant helping a user complete a job application form on Workday. Your task is to select the most appropriate option from the provided options (not based on chat history) for the given form label, using the provided saved data of the user.  

    ### Instructions:
    1. Carefully analyze the **label text** and the list of **options data** provided.
    2. Use the information in the **options data** to determine the most suitable option for the label.
    3. Return a **JSON object** in the exact structure:  
      { "reason": "reason for selecting the option", "id": "optionId that is exactly provided in the Options Data, including the prefix" }  

    ### Important:
    - The **id** field must be an exact match of the "optionId" value from the provided "Options Data", including any prefixes.
    - The **reason** should explain clearly why the selected option is the best choice based on the provided label and options data.

    ### Inputs:
    - **Label Text**: ${labelText}  
    - **Options Data**: ${JSON.stringify(options)}  
    - **${getProgressBarStep()}**

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
 * Validates the AI response against available options
 * @throws {Error} When validation fails
 */
function validateAIResponse(
  response: AIResponse,
  options: SelectOption[]
): void {
  if (!response.id || typeof response.id !== "string") {
    throw new Error("Invalid id in AI response");
  }

  const validOptionIds = options
    .map((opt) => opt.id)
    .filter((id): id is string => id !== null);

  if (!validOptionIds.includes(response.id)) {
    throw new Error("Selected id does not match any available options");
  }
}

/**
 * Clicks an option by its ID
 * @throws {SelectInputError} When option cannot be clicked
 */
async function clickOption(optionId: string): Promise<void> {
  const option = document.getElementById(optionId);
  if (!option) {
    throw new SelectInputError(
      `Option with ID "${optionId}" not found.`,
      "OPTION_NOT_FOUND"
    );
  }
  option.click();
}

/**
 * Handles errors in a consistent way
 * @throws {SelectInputError} Always throws the error after logging
 */
function handleError(error: unknown) {
  if (error instanceof SelectInputError) {
    console.error(`[${error.code}] ${error.message}`, error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
