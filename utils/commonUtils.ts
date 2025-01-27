// Helper function for delays
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retrieves the current progress bar step.
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
 * Simulates typing into an input element letter by letter.
 *
 * @param {HTMLElement} inputElement - The input element to type into.
 * @param {string} text - The text to simulate typing.
 * @param {number} delay - Delay in milliseconds between typing each character (default is 100ms).
 */
export async function simulateTyping(
  inputElement: HTMLInputElement,
  text: string,
  delay = 200
) {
  inputElement.value = "";

  // Ensure the input element is focused
  inputElement.focus();

  for (const char of text) {
    // Create and dispatch the 'keydown' event
    const keydownEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      key: char,
    });
    inputElement.dispatchEvent(keydownEvent);

    // Update the input value
    inputElement.value += char;

    // Dispatch the 'input' event to reflect the change
    const inputEvent = new Event("input", { bubbles: true });
    inputElement.dispatchEvent(inputEvent);

    // Dispatch the 'keyup' event
    const keyupEvent = new KeyboardEvent("keyup", { bubbles: true, key: char });
    inputElement.dispatchEvent(keyupEvent);

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  inputElement.dispatchEvent(new Event("change", { bubbles: true }));

  // Simulate leaving the field after typing
  inputElement.focus();
  inputElement.blur();
  inputElement.click();
  inputElement.focus();
  inputElement.blur();
}

export function getTextContentAbove(inputElement: HTMLInputElement): string {
  let textContent = "";
  let currentElement: HTMLElement | null = inputElement;

  // Helper function to check if an element should be included
  const isRelevantTag = (tagName: string) => {
    const relevantTags = [
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "SPAN",
      "LABEL",
    ];
    return relevantTags.includes(tagName);
  };

  // Traverse previous siblings of the input element
  while (currentElement && currentElement.previousSibling) {
    currentElement = currentElement.previousSibling as HTMLElement;

    if (currentElement.nodeType === Node.ELEMENT_NODE) {
      const tagName = (currentElement as HTMLElement).tagName;
      if (isRelevantTag(tagName)) {
        const elementText = (currentElement as HTMLElement).innerText || "";
        textContent = elementText + "\n" + textContent;
      }
    }
  }

  // Traverse parent elements to continue collecting from higher up
  let parentNode: HTMLElement | null = inputElement.parentElement;
  while (parentNode) {
    if (parentNode.previousSibling) {
      currentElement = parentNode.previousSibling as HTMLElement;

      while (currentElement) {
        if (currentElement.nodeType === Node.ELEMENT_NODE) {
          const tagName = (currentElement as HTMLElement).tagName;
          if (isRelevantTag(tagName)) {
            const elementText = (currentElement as HTMLElement).innerText || "";
            textContent = elementText + "\n" + textContent;
          }
        }
        currentElement = currentElement.previousSibling as HTMLElement;
      }
    }
    parentNode = parentNode.parentElement;
  }

  return textContent.trim();
}

function simulateTypingV2(
  element: HTMLElement,
  text: string,
  callback: () => void
) {
  element.innerHTML = ""; // Clear the content
  let index = 0;

  const typingInterval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text[index];
      index++;
    } else {
      clearInterval(typingInterval);
      callback();
    }
  }, 10); // Adjust typing speed here
}

// Function to update the status UI with typing simulation
export function updateStatus(action: string, reason: string, value: string) {
  const statusContent = document.querySelector(
    "#ai-status-content"
  ) as HTMLElement;
  if (statusContent) {
    const fullText = `
        ${action}
         ${reason}
      `;
    simulateTypingV2(statusContent, fullText, () => {});
  }
}
