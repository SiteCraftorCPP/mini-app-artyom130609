import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../data/referrals.v1.json");

export type ReferralUser = {
  telegramUserId: number;
  telegramUsername?: string;
  balance: number;
  earned: number;
  invitedCount: number;
  referrerId: number | null;
};

export type ReferralTransaction = {
  id: string;
  telegramUserId: number;
  amount: number;
  type: "referral_bonus" | "admin_add" | "admin_sub";
  dateMs: number;
  desc: string;
};

type StoreShape = {
  v: 1;
  users: Record<string, ReferralUser>;
  transactions: ReferralTransaction[];
};

function loadStore(): StoreShape {
  try {
    if (existsSync(STORE_PATH)) {
      const json = readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object" && parsed.v === 1) {
        return parsed as StoreShape;
      }
    }
  } catch (e) {
    console.error("Failed to load referrals store", e);
  }
  return { v: 1, users: {}, transactions: [] };
}

function saveStore(s: StoreShape) {
  try {
    const dir = dirname(STORE_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save referrals store", e);
  }
}

export function getReferralUser(telegramUserId: number): ReferralUser {
  const s = loadStore();
  const uid = String(telegramUserId);
  if (!s.users[uid]) {
    s.users[uid] = {
      telegramUserId,
      balance: 0,
      earned: 0,
      invitedCount: 0,
      referrerId: null,
    };
    saveStore(s);
  }
  return s.users[uid];
}

export function setReferrer(telegramUserId: number, referrerId: number, username?: string) {
  if (telegramUserId === referrerId) return false;
  const s = loadStore();
  const uid = String(telegramUserId);
  const refId = String(referrerId);
  
  if (!s.users[uid]) {
    s.users[uid] = { telegramUserId, telegramUsername: username, balance: 0, earned: 0, invitedCount: 0, referrerId: null };
  }
  
  if (!s.users[refId]) {
    s.users[refId] = { telegramUserId: referrerId, balance: 0, earned: 0, invitedCount: 0, referrerId: null };
  }
  
  if (s.users[uid].referrerId === null) {
    s.users[uid].referrerId = referrerId;
    if (username) s.users[uid].telegramUsername = username;
    s.users[refId].invitedCount += 1;
    saveStore(s);
    return true;
  }
  return false;
}

export function addReferralBonus(buyerId: number, orderAmountRub: number, orderNumber: string) {
  const s = loadStore();
  const buyerStr = String(buyerId);
  const buyer = s.users[buyerStr];
  
  if (!buyer || !buyer.referrerId) return;
  
  const refIdStr = String(buyer.referrerId);
  const referrer = s.users[refIdStr];
  
  if (!referrer) return;

  const bonus = parseFloat((orderAmountRub * 0.05).toFixed(2));
  if (bonus <= 0) return;

  referrer.balance += bonus;
  referrer.earned += bonus;

  s.transactions.unshift({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    telegramUserId: referrer.telegramUserId,
    amount: bonus,
    type: "referral_bonus",
    dateMs: Date.now(),
    desc: `Бонус 5% с заказа ${orderNumber} от пользователя ${buyerId}`
  });

  if (s.transactions.length > 2000) s.transactions.length = 2000;
  
  saveStore(s);
}

export function changeBalanceAdmin(telegramUserId: number, amount: number, isAdd: boolean, adminUsername: string) {
  const s = loadStore();
  const uid = String(telegramUserId);
  if (!s.users[uid]) {
    s.users[uid] = { telegramUserId, balance: 0, earned: 0, invitedCount: 0, referrerId: null };
  }
  
  const user = s.users[uid];
  const actualAmount = isAdd ? amount : -amount;
  user.balance += actualAmount;
  if (user.balance < 0) user.balance = 0;

  s.transactions.unshift({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    telegramUserId,
    amount: actualAmount,
    type: isAdd ? "admin_add" : "admin_sub",
    dateMs: Date.now(),
    desc: `Изменение баланса админом ${adminUsername}`
  });

  if (s.transactions.length > 2000) s.transactions.length = 2000;

  saveStore(s);
  return user.balance;
}

export function getTopReferrals(limit: number = 10): ReferralUser[] {
  const s = loadStore();
  return Object.values(s.users)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, limit);
}

export function getTransactions(limit: number = 50, page: number = 0): { list: ReferralTransaction[], totalPages: number } {
  const s = loadStore();
  const totalPages = Math.ceil(s.transactions.length / limit);
  return {
    list: s.transactions.slice(page * limit, (page + 1) * limit),
    totalPages
  };
}

export function searchReferralUser(query: string): ReferralUser | null {
  const s = loadStore();
  const q = query.toLowerCase().replace("@", "");
  
  for (const u of Object.values(s.users)) {
    if (String(u.telegramUserId) === q || u.telegramUsername?.toLowerCase() === q) {
      return u;
    }
  }
  return null;
}

export function getAllReferralUsers(): ReferralUser[] {
  return Object.values(loadStore().users);
}
