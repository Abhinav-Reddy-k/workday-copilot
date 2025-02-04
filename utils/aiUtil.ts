import OpenAI from "openai";
import { getData } from "./storageUtil";

export enum LLM {
  Granite = "granite-3.1-8b-instruct",
  Gemma = "gemma-2-2b-it",
  Mistral = "mistral-7b-instruct-v0.3",
  HermesLlama = "hermes-3-llama-3.2-3b",
  Quen7b = "qwen2.5-7b-instruct",
  Deepseek = "deepseek-r1-distill-llama-8b",
}

// Utility function to create an OpenAI client with the latest config
async function getOpenAI(): Promise<OpenAI> {
  const baseURL = (await getData("baseUrl")) || "http://127.0.0.1:1234/v1";
  const apiKey = (await getData("apiKey")) || "lm-studio";
  return new OpenAI({
    baseURL,
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

// Utility function to get the latest model
async function getModel(): Promise<LLM> {
  const model = await getData("llmModel");
  return model ? (model as LLM) : LLM.HermesLlama; // Default if not set
}

// Unified text generation function
export async function generateText(
  prompt: string,
  useResumeData: boolean = false
): Promise<string> {
  try {
    const openai = await getOpenAI(); // Fetch the latest OpenAI client
    const model = await getModel(); // Fetch the latest model
    const temperature = parseFloat((await getData("temperature")) || "0.7");

    let fullPrompt = prompt;

    if (useResumeData) {
      const savedData = await getData("userData");
      const resumeData = `User's resume data: ${JSON.stringify(savedData)}`;
      fullPrompt = `${resumeData}\n${prompt}`;
    }

    const response = await openai.completions.create({
      model,
      prompt: fullPrompt,
      temperature,
    });

    return response.choices[0].text;
  } catch (error) {
    throw new Error(`Failed to connect to the llm server: ${error}`);
  }
}

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

export async function getSaveButtonId(): Promise<string> {
  const buttonData = getAllButtonsData();

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
  const result: {
    reason: string;
    dataAutomationId: string;
  } = JSON.parse(await generateText(prompt));

  // check if the dataAutomationId is valid
  const selectedButton = buttonData.find(
    (button) => button.dataAutomationId === result.dataAutomationId
  );

  if (selectedButton) {
    return result.dataAutomationId;
  } else {
    return await getSaveButtonId();
  }
}
