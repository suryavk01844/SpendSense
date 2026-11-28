import { Lightbulb } from "lucide-react";
import { useList, inr, today, budgetSpent } from "./lib";
import { Card, Skel, Empty } from "./ui";

export default function Insights() {
  const [tx] = useList("transactions"), [bud] = useList("budgets");
  if (!tx || !bud) return <Skel />;
  const ex = tx.filter((t) => t.type !== "income"), sum = (a) => a.reduce((s, t) => s + Number(t.amount), 0);
  const win = (a, b) => ex.filter((t) => t.transaction_date >= today(-a) && t.transaction_date <= today(-b));
  const wk = win(6, 0), pw = win(13, 7), mo = win(29, 0), out = [];
  const count = (a, f) => { const m = {}; a.forEach((t) => (m[t.category] = (m[t.category] || 0) + f(t))); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
  const top = count(wk, (t) => Number(t.amount))[0];
  if (top) out.push(`${top[0]} is your highest spending category this week (${inr(top[1])}).`);
  if (sum(pw) > 0 && wk.length) { const c = Math.round(((sum(wk) - sum(pw)) / sum(pw)) * 100); out.push(`Your spending ${c >= 0 ? "increased" : "decreased"} by ${Math.abs(c)}% compared with the previous 7 days.`); }
  if (mo.length) out.push(`Your average daily spending over the last 30 days is ${inr(sum(mo) / 30)}.`);
  const fr = count(mo, () => 1)[0];
  if (fr) out.push(`You buy most often in ${fr[0]} (${fr[1]} transactions in 30 days).`);
  if (mo.length >= 5) { const avg = sum(mo) / mo.length; mo.filter((t) => t.amount > avg * 2.5).forEach((t) => out.push(`Unusual spending: "${t.title}" (${inr(t.amount)}) is far above your typical ${inr(avg)} per transaction.`)); }
  const sub = sum(mo.filter((t) => t.category === "Subscriptions"));
  if (sum(mo) && sub / sum(mo) > 0.2) out.push(`Subscriptions make up ${Math.round((sub / sum(mo)) * 100)}% of your last 30 days of spending. Consider reviewing them.`);
  bud.forEach((b) => { const p = Math.round((budgetSpent(b, tx) / b.amount) * 100); if (p >= 75) out.push(`Your ${b.category || "overall"} ${b.period} budget is ${p >= 100 ? "exceeded" : `${p}% used`}.`); });
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Insights</h1>
      {!out.length ? <Empty text="Add a few expenses to see insights." /> : out.map((t, i) => <Card key={i} className="flex gap-3 text-sm"><Lightbulb size={18} className="text-neon shrink-0" />{t}</Card>)}
      <p className="text-xs text-muted">Calculated directly from your transactions (no AI used here). These are suggestions, not financial advice.</p>
    </div>
  );
}
