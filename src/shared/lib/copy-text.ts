import { TEXT } from "../constants/text";

import { showSuccessMessage } from "./notify";

export const copyText = (text: string) => {
  const textToCopy = text;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showSuccessMessage(TEXT.notification.copied);
      })
      .catch(() => {
        console.error(
          "Ошибка копирования в буфер обмена, используется резервный сценарий.",
        );
        copyFallback(textToCopy);
      });
  } else {
    copyFallback(textToCopy);
  }
};

const copyFallback = (text: string) => {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, text.length);

  try {
    document.execCommand("copy");
    showSuccessMessage(TEXT.notification.copied);
  } catch (error) {
    console.error("Ошибка резервного копирования.", error);
  }

  document.body.removeChild(tempInput);
};
