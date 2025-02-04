import { generateText } from "@/utils/aiUtil";
import { updateStatus } from "@/utils/commonUtils";
import { getProgressBarStep } from "@/utils/progressUtils";

/**
 * Represents a pair of label and its associated input element
 * @interface LabelInputPair
 */
interface LabelInputPair {
  /** The text content of the label */
  label: string;
  /** The associated input element, if found */
  input: HTMLInputElement | null;
  /** The ID of the associated input element */
  inputId: string | null;
}

/**
 * Represents an option in the radio group
 * @interface RadioOption
 */
interface RadioOption {
  /** The display text of the option */
  optionText: string;
  /** The unique identifier of the option */
  optionId: string;
}

/**
 * Response structure from the AI model
 * @interface AIResponse
 */
interface AIResponse {
  /** Explanation for the selection */
  reason: string;
  /** Selected option identifier */
  optionId: string;
}

/**
 * Custom error class for radio group related errors
 */
class RadioGroupError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "RadioGroupError";
  }
}

/**
 * Handles the interaction with a radio group input
 * @param parentInputElement - The parent element containing the radio group
 * @param labelText - The label text associated with the radio group
 * @throws {RadioGroupError} When input validation fails or interaction errors occur
 */
export const handleRadioGroupInput = async (
  parentInputElement: HTMLElement,
  labelText: string
): Promise<void> => {
  try {
    validateInputs(parentInputElement, labelText);

    const labelInputPairs = getLabelInputPairs(parentInputElement);
    if (labelInputPairs.length === 0) {
      throw new RadioGroupError("No radio options found", "NO_OPTIONS_FOUND");
    }

    const selectedOptionId = await selectOptionWithAI(
      labelInputPairs,
      labelText
    );

    await clickSelectedOption(labelInputPairs, selectedOptionId);
  } catch (error) {
    handleError(error);
  }
};

/**
 * Validates the input parameters
 * @throws {RadioGroupError} When validation fails
 */
function validateInputs(parentElement: HTMLElement, labelText: string): void {
  if (!parentElement) {
    throw new RadioGroupError("Parent element is required", "INVALID_PARENT");
  }
  if (!labelText?.trim()) {
    throw new RadioGroupError("Label text is required", "INVALID_LABEL");
  }
}

/**
 * Extracts label-input pairs from the parent element
 * @returns {LabelInputPair[]} Array of label-input pairs
 */
function getLabelInputPairs(parentElement: HTMLElement): LabelInputPair[] {
  return Array.from(parentElement.querySelectorAll("label"))
    .map((label: HTMLLabelElement) => {
      const inputId = label.getAttribute("for");
      const inputElement = inputId
        ? (parentElement.querySelector(
            `input[id=\\3${inputId}]`
          ) as HTMLInputElement | null)
        : null;

      return {
        label: label.innerText.trim(),
        input: inputElement,
        inputId,
      };
    })
    .filter((pair) => pair.label && pair.inputId); // Filter out invalid pairs
}

/**
 * Selects an option using AI
 * @throws {RadioGroupError} When AI selection fails
 */
async function selectOptionWithAI(
  labelInputPairs: LabelInputPair[],
  labelText: string
): Promise<string> {
  const options = mapToRadioOptions(labelInputPairs);

  try {
    const prompt = generatePrompt(labelText, options);
    const aiResponse = await generateText(prompt, true);
    const completion = parseAIResponse(aiResponse);

    updateStatus(
      `Filling input ${labelText}...`,
      completion.reason,
      completion.optionId
    );

    validateAIResponse(completion, options);

    return completion.optionId;
  } catch (error) {
    throw new RadioGroupError(
      "AI selection failed",
      "AI_SELECTION_FAILED",
      error
    );
  }
}

/**
 * Maps label-input pairs to radio options
 */
function mapToRadioOptions(pairs: LabelInputPair[]): RadioOption[] {
  return pairs
    .filter((pair): pair is LabelInputPair & { inputId: string } =>
      Boolean(pair.inputId)
    )
    .map((pair) => ({
      optionText: pair.label,
      optionId: pair.inputId,
    }));
}

/**
 * Generates the prompt for the AI model
 */
function generatePrompt(labelText: string, options: RadioOption[]): string {
  return `
    You are an intelligent assistant helping a user complete a job application form on Workday. Your task is to select the most appropriate option for the given label text based on the provided saved data of the user and the available options.  

    ### Instructions:
    1. Analyze the **label text** and the list of available options carefully.
    2. Determine the option that best matches the label text and user's saved data.
    3. Return a **JSON object** in the exact structure:  
      { "reason": "reason for selecting the option", "optionId": "optionId that is exactly provided in the Options Data.optionId" }  

    ### Important:
    - The **optionId** must be an exact match of the "optionId" value from the provided "Options Data".
    - The **reason** should clearly explain why the selected option is the most appropriate based on the given inputs.

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
  options: RadioOption[]
): void {
  if (!response.optionId || typeof response.optionId !== "string") {
    throw new Error("Invalid optionId in AI response");
  }

  const validOptionIds = options.map((opt) => opt.optionId);
  if (!validOptionIds.includes(response.optionId)) {
    throw new Error("Selected optionId does not match any available options");
  }
}

/**
 * Clicks the selected radio option
 * @throws {RadioGroupError} When option cannot be clicked
 */
async function clickSelectedOption(
  pairs: LabelInputPair[],
  selectedId: string
): Promise<void> {
  const selectedPair = pairs.find((pair) => pair.inputId === selectedId);

  if (!selectedPair?.input) {
    throw new RadioGroupError(
      `Could not find input element for option ${selectedId}`,
      "OPTION_NOT_FOUND"
    );
  }

  selectedPair.input.click();
}

/**
 * Handles errors in a consistent way
 * @throws {RadioGroupError} Always throws the error after logging
 */
function handleError(error: unknown) {
  if (error instanceof RadioGroupError) {
    console.error(`[${error.code}] ${error.message}`, error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
