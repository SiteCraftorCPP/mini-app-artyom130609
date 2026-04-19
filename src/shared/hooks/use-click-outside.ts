import { type RefObject, useEffect, useRef } from "react";

type UseClickOutsideParams = {
  onClickOutside: () => void;
  isListener?: boolean;
};

export const useClickOutside = <T extends HTMLElement>({
  onClickOutside,
  isListener = true,
}: UseClickOutsideParams): RefObject<T | null> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        event.target instanceof HTMLElement &&
        !ref.current.contains(event.target)
      ) {
        onClickOutside();
      }
    };

    if (isListener) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isListener, onClickOutside]);

  return ref;
};
