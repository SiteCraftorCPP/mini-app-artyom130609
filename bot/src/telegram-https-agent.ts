import dns from "node:dns";
import https from "node:https";

/**
 * Для VPS с битым IPv6-маршрутом: все запросы к Telegram API идут на A-запись.
 * node-fetch (через baseFetchConfig.agent в grammy) использует этот Agent.
 */
export function createTelegramIPv4HttpsAgent(): https.Agent {
  return new https.Agent({
    keepAlive: true,
    maxSockets: 64,
    scheduling: "lifo",
    lookup(hostname, _opts, cb) {
      dns.lookup(hostname, { family: 4, all: false }, cb);
    },
  });
}
