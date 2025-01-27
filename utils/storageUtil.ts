import { storage } from "wxt/storage";

// write a function to save data to chrome.storage with specific key
export const saveData = async (key: string, data: string) => {
  await storage.setItem(`local:${key}`, data);
};

// write a function to get data from chrome.storage with specific key
export const getData = async (key: string) => {
  return await storage.getItem<string>(`local:${key}`);
};
