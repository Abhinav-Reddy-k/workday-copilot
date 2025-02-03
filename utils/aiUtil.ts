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

class AIConfig {
  private static instance: AIConfig;
  private openai: OpenAI;
  private currentModel: LLM = LLM.HermesLlama;

  private constructor() {
    this.openai = new OpenAI({
      baseURL: "http://127.0.0.1:1234/v1",
      apiKey: "lm-studio",
      dangerouslyAllowBrowser: true,
    });
  }

  static getInstance(): AIConfig {
    if (!AIConfig.instance) {
      AIConfig.instance = new AIConfig();
    }
    return AIConfig.instance;
  }

  async init() {
    const baseURL = (await getData("baseUrl")) || "http://127.0.0.1:1234/v1";
    const apiKey = (await getData("apiKey")) || "lm-studio";
    const model = await getData("llmModel");

    this.openai = new OpenAI({
      baseURL,
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    if (model) {
      this.currentModel = model as LLM;
    }
  }

  getOpenAI(): OpenAI {
    return this.openai;
  }

  getModel(): LLM {
    return this.currentModel;
  }
}

const aiConfig = AIConfig.getInstance();

export async function generateTextBasedOnResume(prompt: string) {
  const savedData = await getData("userData");
  const temperature = (await getData("temperature")) || "0.7";
  const resumeData = `User's resume data: ${JSON.stringify(savedData)}`;
  const response = await aiConfig.getOpenAI().completions.create({
    model: aiConfig.getModel(),
    prompt: `${resumeData}\n${prompt}`,
    temperature: parseFloat(temperature),
  });
  return response.choices[0].text;
}

export async function generateText(prompt: string) {
  const response = await aiConfig.getOpenAI().completions.create({
    model: aiConfig.getModel(),
    prompt,
    max_tokens: 1000,
  });
  return response.choices[0].text;
}
