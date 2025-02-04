import { generateText } from "@/utils/aiUtil";
import { updateStatus } from "@/utils/commonUtils";

type AIResponse = {
  reason: string;
  value: string;
};

/**
 * Handles input for a text field by generating and applying AI-suggested values.
 * @param inputElement - The HTML input element to update.
 * @param labelText - The label text associated with the input field.
 * @returns {Promise<void>}
 */
export const handleTextInput = async (
  inputElement: HTMLElement,
  labelText: string
): Promise<void> => {
  // Ensure the input element is a valid HTMLInputElement
  if (!(inputElement instanceof HTMLInputElement)) {
    console.error("Invalid input element type");
    return;
  }

  // Generate AI response
  let aiResponse: string;
  try {
    aiResponse = await generateText(
      `
      You are an intelligent assistant helping a user complete a job application form on Workday. Your task is to provide the most appropriate value for a text input field based on the given label and the user's saved data.  

      ### Instructions:
      1. Analyze the **label text**.
      2. Use the context provided by the label and the saved user data to determine the best possible value for the input field.
      3. Return a **JSON object** in the below structure:  
        { "reason": "reason for selecting the value", "value": "a string which is to be inputted by the user" }  
      4. If you find the same label again that is already in the , provide the secondary value.

      ### Inputs:
      - **Label Text**: ${labelText}  
      - **${getProgressBarStep()} **
      - **Form filled so far**: ${JSON.stringify(
        getTextContentAbove(inputElement)
      )}
    )}
    `,
      true
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    return;
  }

  // Parse the AI response
  const parseAIResponse = (response: string): AIResponse | null => {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return null;
    }
  };

  const parsedAIResponse = parseAIResponse(aiResponse);

  updateStatus(
    `Filling input ${labelText}...`,
    parsedAIResponse?.reason || "",
    parsedAIResponse?.value || ""
  );

  if (!parsedAIResponse || typeof parsedAIResponse.value !== "string") {
    console.error("Invalid or incomplete AI response:", aiResponse);
    return;
  }

  await simulateTyping(inputElement, parsedAIResponse.value);
};
