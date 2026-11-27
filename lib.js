import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const CATS = ["Food","Travel","Shopping","Education","Entertainment","Health","Subscriptions","Personal care","Other"];
export const PAY = ["UPI","Cash","Debit card","Credit card","Other"];
export const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o); return iso(d); };
export const range = (p) => {
  const d = new Date();
  if (p === "weekly") { const s = new Date(d); s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const e = new Date(s); e.setDate(s.getDate() + 6); return [iso(s), iso(e)]; }
  return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
};
export const Ctx = createContext();
export const useApp = () => useContext(Ctx);

// ---- Demo mode: in-memory sample data, clearly labelled in the UI ----
const T = (title, amount, category, o, payment_method) => ({ id: crypto.randomUUID(), title, amount, type: "expense", category, transaction_date: today(-o), payment_method, notes: "Demonstration data", is_demo: true });
const [ms, me] = range("monthly");
const demo = {
  notifications: [],
  transactions: [T("College bus", 80, "Travel", 0, "UPI"), T("Lunch", 120, "Food", 1, "Cash"), T("Stationery", 150, "Education", 2, "Cash"),
    T("Movie ticket", 250, "Entertainment", 3, "UPI"), T("Snacks", 60, "Food", 4, "Cash"), T("Mobile recharge", 299, "Subscriptions", 5, "UPI"),
    T("Online course", 499, "Education", 6, "Debit card"), T("Shopping", 350, "Shopping", 7, "UPI")],
  budgets: [{ id: "b1", category: null, amount: 3000, period: "monthly", start_date: ms, end_date: me },
    { id: "b2", category: "Food", amount: 400, period: "monthly", start_date: ms, end_date: me }],
  savings_goals: [{ id: "g1", title: "Laptop", target_amount: 40000, current_amount: 8000, target_date: null },
    { id: "g2", title: "Emergency Savings", target_amount: 10000, current_amount: 2000, target_date: null }],
};

export const makeApi = (isDemo) => ({
  async list(t) {
    if (isDemo) return [...demo[t]];
    const { data, error } = await supabase.from(t).select("*");
    if (error) throw error; return data;
  },
  async save(t, row) {
    if (isDemo) { demo[t] = row.id ? demo[t].map((r) => (r.id === row.id ? { ...r, ...row } : r)) : [...demo[t], { ...row, id: crypto.randomUUID() }]; return; }
    const { error } = await (row.id ? supabase.from(t).update(row).eq("id", row.id) : supabase.from(t).insert(row));
    if (error) throw error;
  },
  async remove(t, id) {
    if (isDemo) { demo[t] = demo[t].filter((r) => r.id !== id); return; }
    const { error } = await supabase.from(t).delete().eq("id", id);
    if (error) throw error;
  },
});

export function useList(t) {
  const { api, notify } = useApp();
  const [rows, setRows] = useState(null);
  const load = useCallback(() => api.list(t).then(setRows).catch((e) => { notify(e.message, "err"); setRows([]); }), [api, t, notify]);
  useEffect(() => { load(); }, [load]);
  return [rows, load];
}

// ---- AI suggestion: Edge Function first, local keyword fallback otherwise ----
const KW = { Food: "lunch|dinner|breakfast|snack|tea|coffee|food|canteen", Travel: "bus|metro|cab|auto|fuel|train|fare",
  Shopping: "shopping|clothes|shoes|amazon|flipkart", Education: "course|book|stationery|exam|fees|pen",
  Entertainment: "movie|game|concert|party", Health: "medicine|doctor|pharmacy|gym", Subscriptions: "netflix|spotify|recharge|subscription",
  "Personal care": "salon|haircut|skincare" };
function local(text) {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) throw new Error("No amount found. Try “₹120 lunch”.");
  const l = text.toLowerCase();
  const category = Object.keys(KW).find((c) => new RegExp(KW[c]).test(l)) || "Other";
  const title = text.replace(/₹?\s*\d+(\.\d+)?/, "").replace(/yesterday|today/i, "").trim() || "Expense";
  return { source: "fallback", needs_review: category === "Other", suggestion: { amount: +m[1], title: title[0].toUpperCase() + title.slice(1),
    category, transaction_date: today(l.includes("yesterday") ? -1 : 0), payment_method: /upi/.test(l) ? "UPI" : /cash/.test(l) ? "Cash" : "Other" } };
}
export async function suggest(text, isDemo) {
  if (text.trim().length < 2 || text.length > 200) throw new Error("Enter 2–200 characters.");
  if (!isDemo && supabase) {
    try { const { data, error } = await supabase.functions.invoke("categorize-expense", { body: { text } }); if (!error && data?.suggestion) return data; } catch { /* use fallback */ }
  }
  return local(text);
}

export const budgetSpent = (b, tx) => tx.filter((t) => t.type !== "income" && t.transaction_date >= b.start_date && t.transaction_date <= b.end_date && (!b.category || t.category === b.category)).reduce((s, t) => s + Number(t.amount), 0);

// Creates in-app alerts from real data (deduplicated by title + message).
export async function syncAlerts(api) {
  const [tx, bud, goals, notes] = await Promise.all(["transactions", "budgets", "savings_goals", "notifications"].map((t) => api.list(t)));
  const have = new Set(notes.map((n) => n.title + "|" + n.message)), add = [];
  for (const b of bud) {
    const pct = (budgetSpent(b, tx) / b.amount) * 100, lv = [100, 90, 75, 50].find((l) => pct >= l);
    if (!lv) continue;
    const name = b.category || "Overall";
    add.push({ type: "budget", title: lv === 100 ? `Budget exceeded: ${name}` : `Budget warning: ${name}`,
      message: lv === 100 ? `Your ${name} ${b.period} budget (${b.start_date} to ${b.end_date}) has been exceeded.` : `You have used over ${lv}% of your ${name} ${b.period} budget (${b.start_date} to ${b.end_date}).` });
  }
  for (const g of goals) {
    const lv = g.current_amount >= g.target_amount ? 100 : g.current_amount >= g.target_amount / 2 ? 50 : 0;
    if (lv) add.push({ type: "savings", title: lv === 100 ? `Goal reached: ${g.title}` : `Halfway there: ${g.title}`, message: `${g.title} is at ${lv}% of its target.` });
  }
  for (const n of add) if (!have.has(n.title + "|" + n.message)) await api.save("notifications", { ...n, is_read: false, created_at: new Date().toISOString() });
}
