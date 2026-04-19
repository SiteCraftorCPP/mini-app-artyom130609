import { REGEX } from "@/shared/constants/regex";

export const amountValidateNumber = (event: KeyboardEvent) => {
  const inputElement =
    event.currentTarget instanceof HTMLInputElement
      ? event.currentTarget
      : null;

  if (!inputElement) return;

  if (
    !REGEX.NUMBER.test(event.key) &&
    event.key !== "Backspace" &&
    event.key !== "Delete"
  ) {
    event.preventDefault();
  }

  if (event.key === "," || event.key === ".") {
    if (inputElement.value.includes(",") || inputElement.value.includes(".")) {
      event.preventDefault();
    }

    if (inputElement.value === "") {
      event.preventDefault();
      inputElement.value = "0.";
    } else {
      event.preventDefault();
      inputElement.value += ".";
      if (
        inputElement.value.includes(",") ||
        inputElement.value.includes(".")
      ) {
        if (countDots(inputElement.value) > 1) {
          inputElement.value = inputElement.value = inputElement.value.replace(
            REGEX.DOT,
            "",
          );
          return;
        }
      }
    }
  }
};

function countDots(str: string) {
  return str.split(".").length - 1;
}

export const amountValidateIntegerNumber = (event: KeyboardEvent) => {
  const inputElement =
    event.currentTarget instanceof HTMLInputElement
      ? event.currentTarget
      : null;

  if (!inputElement) return;

  if (
    !REGEX.NUMBER.test(event.key) &&
    event.key !== "Backspace" &&
    event.key !== "Delete"
  ) {
    event.preventDefault();
  }

  if (event.key === "," || event.key === ".") {
    event.preventDefault();
    if (inputElement.value.includes(",") || inputElement.value.includes(".")) {
      return;
    }
  }
};
