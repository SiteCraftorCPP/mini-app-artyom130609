import { Fragment, type ReactNode, createElement } from "react";

export function splitString(str: string): ReactNode {
  if (str.indexOf("\n") === -1) {
    return str;
  }

  const lines = str.split("\n");

  const newSrt = lines.map((line, index) => {
    if (index === lines.length - 1) {
      return line;
    }

    return createElement(Fragment, { key: index }, line, createElement("br"));
  });

  return newSrt;
}
