export const getCookie = (cookieName: string) => {
  const cookieValue = document.cookie.replace(
    new RegExp(`(?:(?:^|.*;\\s*)${cookieName}\\s*\\=\\s*([^;]*).*$)|^.*$`),
    "$1",
  );
  return cookieValue ? cookieValue : null;
};
