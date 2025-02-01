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

export function updateStatus(action: string, reason: string, value: string) {
  console.log(`Updating status: ${action} - ${reason} - ${value}`);
  chrome.runtime.sendMessage({
    action: "updateStatus",
    payload: { action, reason, value },
  });
}

export const sectionHeadings: Record<string, string[]> = {
  Personal_Information: [
    "PERSONAL INFORMATION",
    "CONTACT INFORMATION",
    "BIOGRAPHY",
    "ABOUT ME",
    "PROFILE",
    "SUMMARY",
    "OBJECTIVE",
  ],
  Skills: [
    "SKILLS",
    "TECHNICAL SKILLS",
    "SOFT SKILLS",
    "HARD SKILLS",
    "CORE COMPETENCIES",
    "TOOLS & TECHNOLOGIES",
    "PROGRAMMING LANGUAGES",
  ],
  Experience: [
    "WORK EXPERIENCE",
    "EXPERIENCE",
    "INTERNSHIPS",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "CAREER HISTORY",
    "RELEVANT EXPERIENCE",
    "FREELANCE EXPERIENCE",
    "PROJECT EXPERIENCE",
  ],
  Projects: [
    "PROJECTS",
    "PERSONAL PROJECTS",
    "SIDE PROJECTS",
    "SIGNIFICANT PROJECTS",
    "TECHNICAL PROJECTS",
    "OPEN SOURCE CONTRIBUTIONS",
  ],
  Education: [
    "EDUCATION",
    "ACADEMIC BACKGROUND",
    "EDUCATIONAL QUALIFICATIONS",
    "DEGREES",
    "COURSEWORK",
  ],
  Certifications: [
    "CERTIFICATIONS",
    "LICENSES",
    "PROFESSIONAL DEVELOPMENT",
    "TRAININGS",
    "CREDENTIALS",
  ],
  Achievements: [
    "ACHIEVEMENTS",
    "AWARDS",
    "HONORS",
    "ACCOLADES",
    "RECOGNITION",
    "DISTINCTIONS",
  ],
  Publications: [
    "PUBLICATIONS",
    "RESEARCH PAPERS",
    "CONFERENCE PRESENTATIONS",
    "JOURNAL ARTICLES",
    "WHITE PAPERS",
    "BOOKS & CHAPTERS",
  ],
  Voluntary_Disclosures: ["VOLUNTARY DISCLOSURES"],
  Self_Identify: ["SELF IDEMTIFY", "PRONOUNS"],
  Miscellaneous: [
    "MISCELLANEOUS",
    "ADDITIONAL INFORMATION",
    "EXTRA INFORMATION",
    "OTHER DETAILS",
    "REFERENCES",
    "PORTFOLIO",
    "BLOG",
  ],
};

export function formatResume(resumeText: string): string {
  const lines = resumeText.split("\n");
  let formattedText = "";
  let currentSection: string | null = null;
  let completedSections: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip empty lines
    if (line === "") continue;

    // Detect section headings dynamically and assume only less than 3 words exist on that line
    for (const [formattedHeading, variations] of Object.entries(
      sectionHeadings
    )) {
      if (
        variations.some((heading) => line.toUpperCase().startsWith(heading)) &&
        !completedSections.includes(formattedHeading) &&
        line.split(" ").length < 3
      ) {
        currentSection = formattedHeading;
        formattedText += `\n${formattedHeading}\n`;
        // replace the heading with the formatted heading
        line = line.replace(new RegExp(`^(${variations.join("|")})`), "");
        completedSections.push(formattedHeading);
        break;
      }
    }

    if (/^[•\-]/.test(line)) {
      // Detect bullet points using • or -
      formattedText += `• ${line.replace(/^[•\-]/, "").trim()}\n`;
    } else if (currentSection === null) {
      // First few lines are assumed to be contact information or a summary
      if (i < 5) {
        formattedText += `Personal_Information\n${line}\n`;
        currentSection = "Personal_Information";
      } else {
        formattedText += `\nMiscellaneous\n${line}\n`;
        currentSection = "Miscellaneous";
      }
    } else {
      // Inside a section, maintain line structure while preventing excessive newlines
      if (line !== "") {
        formattedText += `${line}\n`;
      } else if (lines[i + 1]?.trim() !== "") {
        formattedText += `\n`; // Add a newline only if the next line is not empty
      }
    }
  }

  return formattedText.trim();
}
