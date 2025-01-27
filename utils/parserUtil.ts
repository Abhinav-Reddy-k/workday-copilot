export function parseJsonResponse(input: string) {
  try {
    // Extract JSON content within the triple backticks
    const jsonMatch = input.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      throw new Error("No valid JSON content found.");
    }

    // Parse the extracted JSON
    const jsonData = JSON.parse(jsonMatch[1]);

    return jsonData;
  } catch (error: any) {
    console.error("Error parsing JSON:", error.message);
    return null;
  }
}

export function modalBasedJsonParser(aiResponse: string) {
  return JSON.parse(aiResponse);
}
