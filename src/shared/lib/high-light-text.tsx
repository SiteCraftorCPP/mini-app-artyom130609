import type { ReactNode } from "react";

import { splitString } from "./slpit-string";

type HighlightedTextParams = {
  children: ReactNode;
  className?: string;
  highlight?: string | string[];
};
const getText = (children: ReactNode) => {
  if (typeof children === "number") {
    return children.toString();
  } else if (typeof children === "string") {
    return children;
  }
  return "";
};

export const HighlightText = ({
  children,
  className,
  highlight,
}: HighlightedTextParams): ReactNode => {
  const text = getText(children);

  if (!highlight || (Array.isArray(highlight) && highlight.length === 0)) {
    return splitString(text); // Возвращаем результат splitString, если ничего не выделено
  }

  const highlightArray = Array.isArray(highlight) ? highlight : [highlight];

  const escaped = highlightArray.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const highlighted = highlightArray.some(
      (h) => part.toLowerCase() === h.toLowerCase(),
    );

    // Если часть содержит переносы строк, разбиваем её
    const splitParts = splitString(part);

    return highlighted ? (
      <span key={index} className={className ? className : "text-red-500"}>
        {splitParts}
      </span>
    ) : (
      splitParts
    );
  });
};
