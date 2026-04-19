import { isMobileDevice } from "../lib/is-mobile-device";

export const scrollToInput = (ref: React.RefObject<HTMLDivElement | null>) => {
  const isPhone = isMobileDevice();

  if (ref.current && isPhone) {
    const topPosition =
      ref.current.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({
      top: topPosition,
      behavior: "smooth",
    });
  }
};
