export const REGEX = {
  BASE64: /^[A-Za-z0-9+/]+={0,2}$/,
  DOT: /\.$/,
  NUMBER: /[\d\\.,]/,
  FB: /^https:\/\/(m\.)?facebook/,
  HTTPS: /^https:\/\//,
  OK: /^https:\/\/(m\.)?ok/,
  TELEGRAM: /^https:\/\/t\.me/,
  URL: /^(http:\/\/|https:\/\/)?(www\.)?([a-zA-Z0-9\-\\.]+)\.[a-zA-Z]{2,}(\/.*)?$/,
  VK: /^https:\/\/(m\.)?vk/,
} as const;
