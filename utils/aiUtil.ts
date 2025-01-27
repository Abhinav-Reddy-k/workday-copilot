import OpenAI from "openai";
const openai = new OpenAI({
  baseURL: "http://127.0.0.1:1234/v1",
  apiKey: "lm-studio",
  dangerouslyAllowBrowser: true,
});

export enum LLM {
  Granite = "granite-3.1-8b-instruct",
  Gemma = "gemma-2-2b-it",
  Mistral = "mistral-7b-instruct-v0.3",
  HermesLlama = "hermes-3-llama-3.2-3b",
  Quen7b = "qwen2.5-7b-instruct",
  Deepseek = "deepseek-r1-distill-llama-8b",
}

export const model = LLM.HermesLlama;

export async function generateTextBasedOnResume(prompt: string) {
  console.log("Generating text with prompt:", prompt);
  const savedData = await getData("userData");
  const resumeData = `User's resume data: ${JSON.stringify(savedData)}`;
  const response = await openai.completions.create({
    model,
    prompt: `${resumeData}\n${prompt}`,
  });
  console.log("Generated text:", response.choices[0].text);
  return response.choices[0].text; // Output the generated text
}

export async function generateText(prompt: string) {
  console.log("Generating text with prompt:", prompt);
  const response = await openai.completions.create({
    model,
    prompt,
  });
  console.log("Generated text:", response.choices[0].text);
  return response.choices[0].text; // Output the generated text
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

let chatHistory: ChatMessage[] = []; // This will hold the context for the chat

// Function to generate a text response based on the provided prompt and chat history
export async function generateTextV2(prompt: string) {
  const savedData = await getData("userData");
  const resumeData = `User's resume data: ${JSON.stringify(savedData)}`;
  // Add the initial message (user's resume data or context) as the first entry in the chat history
  if (chatHistory.length === 0) {
    chatHistory.push({ role: "system", content: resumeData }); // System message to set context
  }

  // Add the new user prompt to the chat history
  chatHistory.push({ role: "user", content: prompt });

  // Make the API call to OpenAI with the chat history
  const response = await openai.chat.completions.create({
    model, // Or another chat model
    messages: chatHistory,
  });

  // Get the assistant's response from the API
  const assistantResponse = response.choices[0].message.content as string;

  // Add the assistant's response to the chat history for future context
  chatHistory.push({ role: "assistant", content: assistantResponse! });

  return assistantResponse;
}

// Function to continue the conversation with a new message
export async function continueChat(newPrompt: string) {
  // Add the new user message to the chat history
  chatHistory.push({ role: "user", content: newPrompt });

  // Get the assistant's response to continue the conversation
  const assistantResponse = await generateTextBasedOnResume(newPrompt);

  return assistantResponse;
}
