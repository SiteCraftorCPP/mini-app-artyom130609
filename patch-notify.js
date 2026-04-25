import fs from "fs";

const file = "bot/src/order-notify.ts";
let content = fs.readFileSync(file, "utf8");

// 1. Add getReferralUser to imports
if (!content.includes('import { getReferralUser }')) {
  content = content.replace(
    'import { addOrUpdateActiveOrder, type AdminOrderRow } from "./orders-store.js";',
    'import { addOrUpdateActiveOrder, type AdminOrderRow } from "./orders-store.js";\nimport { getReferralUser } from "./referrals-store.js";'
  );
}

// 2. Add /api/referral to CORS handler
const oldCors = `      (url === "/notify/virt-order-webapp" ||
        url === "/notify/sell-virt-webapp" ||
        url === "/notify/virt-order-success")`;
const newCors = `      (url === "/notify/virt-order-webapp" ||
        url === "/notify/sell-virt-webapp" ||
        url === "/notify/virt-order-success" ||
        url === "/api/referral")`;
content = content.replace(oldCors, newCors);

// 3. Add POST /api/referral route
const newRoute = `
    if (req.method === "POST" && url === "/api/referral") {
      if (!botToken) {
        res.writeHead(503, corsNotifyHeaders).end("no bot token");
        return;
      }
      try {
        const body = await readJsonBody<{ initData: string }>(req);
        if (typeof body.initData !== "string") {
          res.writeHead(400, corsNotifyHeaders).end("bad body");
          return;
        }
        const telegramUserId = getTelegramUserIdFromWebAppInitData(body.initData, botToken);
        if (telegramUserId === null) {
          res.writeHead(401, corsNotifyHeaders).end("bad initData");
          return;
        }
        
        const refUser = getReferralUser(telegramUserId);
        const botUsername = process.env.VITE_BOT_ADDRESS?.trim() || "MiniAppArtyom130609_BOT";
        const refLink = \`https://t.me/\${botUsername}?start=ref_\${telegramUserId}\`;

        res.writeHead(200, { "Content-Type": "application/json", ...corsNotifyHeaders });
        res.end(JSON.stringify({ 
          ok: true, 
          balance: refUser.balance, 
          earned: refUser.earned, 
          invitedCount: refUser.invitedCount,
          link: refLink
        }));
      } catch (e) {
        res.writeHead(500, corsNotifyHeaders).end("error");
      }
      return;
    }
`;

content = content.replace(
  `    if (req.method === "POST" && url === "/notify/sell-virt-webapp") {`,
  newRoute + `    if (req.method === "POST" && url === "/notify/sell-virt-webapp") {`
);

fs.writeFileSync(file, content, "utf8");
console.log("Patched order-notify.ts with referral API!");
