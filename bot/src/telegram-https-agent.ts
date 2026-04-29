import dns from "node:dns";
import https from "node:https";
import net from "node:net";

import type { LookupOptions } from "node:dns";

/**
 * Для VPS с битым IPv6: резолвим только A-запись.
 * В Node 20+ при options.all === true колбэк lookup должен вернуть массив {address, family},
 * иначе — ERR_INVALID_IP_ADDRESS (см. nodejs/node#55762).
 */
export function createTelegramIPv4HttpsAgent(): https.Agent {
  return new https.Agent({
    keepAlive: true,
    maxSockets: 64,
    scheduling: "lifo",
    lookup(hostname, options: LookupOptions, callback) {
      if (net.isIPv4(hostname)) {
        if (options.all) {
          callback(null, [{ address: hostname, family: 4 }]);
        } else {
          callback(null, hostname, 4);
        }
        return;
      }
      if (net.isIPv6(hostname)) {
        const e = new Error("IPv6 literal with IPv4-only Telegram agent") as NodeJS.ErrnoException;
        (callback as unknown as (err: NodeJS.ErrnoException | null) => void)(e);
        return;
      }
      dns.lookup(hostname, { family: 4, all: false }, (err, address, family) => {
        if (err) {
          (callback as unknown as (err: NodeJS.ErrnoException | null) => void)(err);
          return;
        }
        if (typeof address !== "string" || address.length === 0) {
          const e = Object.assign(new Error(`DNS: нет A-записи для ${hostname}`), {
            code: "ENOTFOUND",
          }) as NodeJS.ErrnoException;
          (callback as unknown as (err: NodeJS.ErrnoException | null) => void)(e);
          return;
        }
        const fam = family === 6 ? 6 : 4;
        if (options.all) {
          callback(null, [{ address, family: fam }]);
        } else {
          callback(null, address, fam);
        }
      });
    },
  });
}
