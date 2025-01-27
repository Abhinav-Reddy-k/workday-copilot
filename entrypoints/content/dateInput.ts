export const handleDateInput = async (
  inputElement: HTMLElement,
  labelText: string
): Promise<void> => {
  inputElement?.click();
  await delay(1000);
  const toodaysDate = document.querySelector<HTMLElement>(
    '[data-automation-id="datePickerSelectedToday"]'
  );
  toodaysDate?.click();
};
