export const setCookie = (cookieName: string, number: string) => {
    document.cookie = `${cookieName}=${number}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
};
