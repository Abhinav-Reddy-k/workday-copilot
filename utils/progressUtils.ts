/**
 * Extracts numeric values from a string and calculates the percentage.
 * @param text - A string containing numeric values (e.g., "3 of 5").
 * @returns The percentage as a number, or null if parsing fails.
 */
export function getWorkflowProgress(text: string): number | null {
  const match = text.match(/\d+/g);
  if (match && match.length >= 2) {
    const current = parseInt(match[0], 10); // Current step
    const total = parseInt(match[1], 10); // Total steps
    return total === 0 ? null : (current / total) * 100; // Avoid division by zero
  }
  return null;
}

/**
 * Retrieves the current progress bar step from the DOM.
 * @returns The current step as a string.
 */
export function getProgressBarStep(): string {
  return (
    document
      .querySelector('[data-automation-id="progressBarActiveStep"]')
      ?.textContent?.trim() || ""
  );
}

/**
 * Calculates the overall progress percentage.
 * @param pagePercentage - The percentage of inputs completed on the current step.
 * @returns The overall progress as a string (e.g., "57.3"), or null if data is missing.
 */
export function calculateOverallPercentage(
  pagePercentage: number | null
): number | null {
  const progressBarText = getProgressBarStep();
  const workflowPercentage = getWorkflowProgress(progressBarText);

  if (workflowPercentage === null || pagePercentage === null) {
    return null; // Handle cases where percentage data is missing
  }

  // Calculate the weight for the current step based on total steps
  const match = progressBarText.match(/\d+/g);
  if (!match || match.length < 2) {
    return null; // Invalid progress bar text
  }

  const currentStep = parseInt(match[0], 10); // Current step
  const totalSteps = parseInt(match[1], 10); // Total steps

  // Weight for the workflow progress (steps completed so far)
  const workflowWeight = (currentStep - 1) / totalSteps;

  // Weight for the current step's progress
  const currentStepWeight = 1 / totalSteps;

  // Combine the two components to calculate overall progress
  const overallPercentage =
    workflowWeight * 100 + currentStepWeight * pagePercentage;

  return Math.floor(overallPercentage); // Return as a string with one decimal place
}

// helper function to check if its the last step
export function isLastStep(): boolean {
  const progressBarText = getProgressBarStep();
  const match = progressBarText.match(/\d+/g);
  if (!match || match.length < 2) {
    return false; // Invalid progress bar text
  }

  const currentStep = parseInt(match[0], 10); // Current step
  const totalSteps = parseInt(match[1], 10); // Total steps

  return currentStep === totalSteps;
}
