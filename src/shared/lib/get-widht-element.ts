import type { Ref } from "react";

export const getWidthElement = (element: Ref<HTMLElement>): number => {
  if (
    element &&
    "current" in element &&
    element.current instanceof HTMLElement
  ) {
    return element.current.offsetWidth;
  }
  return 0;
};
