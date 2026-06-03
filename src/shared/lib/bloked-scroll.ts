export const blokedScroll = (isBloked: boolean) => {
  if (isBloked) {
    document.body.style.overflow = "hidden";
    document.body.style.maxHeight = "100vh";
  } else {
    document.body.style.overflow = "";
    document.body.style.maxHeight = "";
  }
};
