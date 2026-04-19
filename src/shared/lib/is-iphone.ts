export const isIphone = () => {
  const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return isMobile;
};
