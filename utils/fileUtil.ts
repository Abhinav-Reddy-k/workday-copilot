export function downloadTextFile(text: string): void {
  // Create a blob with the text content
  const blob = new Blob([text], { type: "text/plain" });

  // Create a link element
  const link = document.createElement("a");

  // Set the download attribute with the desired filename
  link.download = "atsresume.txt";

  // Create a URL for the blob and set it as the href of the link
  link.href = window.URL.createObjectURL(blob);

  // Programmatically click the link to trigger the download
  link.click();

  // Clean up the URL object
  window.URL.revokeObjectURL(link.href);
}
