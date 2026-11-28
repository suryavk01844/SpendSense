import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useList, inr, today, iso } from "../lib";
import { Card, Skel, Empty } from "../ui";

const COLORS = ["#B6F36B", "#60A5FA", "#F472B6", "#FACC15", "#A78BFA", "#34D399", "#FB923C", "#22D3EE", "#94A3B8"];
const tip = { contentStyle: { background: "#0B1220", border: "1px solid #ffffff22", borderRadius: 12 } };

export default function Dashboard() {
  const [tx] = useList("transactions"), [bud] = useList("budgets");
  if (!tx || !bud) return <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skel key={i} />)}</div>;
  const ex = tx.filter((t) => t.type !== "income"), sum = (a) => a.reduce((s, t) => s + Number(t.amount), 0);
  const now = new Date(), cur = iso(now).slice(0, 7), prev = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  const month = ex.filter((t) => t.transaction_date.startsWith(cur)), spent = sum(month), last = sum(ex.filter((t) => t.transaction_date.startsWith(prev)));
  const mb = bud.find((b) => !b.category && b.period === "monthly");
  const week = [6, 5, 4, 3, 2, 1, 0].map((i) => { const d = today(-i); return { day: d.slice(5), total: sum(ex.filter((t) => t.transaction_date === d)) }; });
  const cats = Object.entries(month.reduce((m, t) => ({ ...m, [t.category]: (m[t.category] || 0) + Number(t.amount) }), {})).map(([name, value]) => ({ name, value }));
  const change = last ? Math.round(((spent - last) / last) * 100) : null;
  const cards = [["Monthly expenses", inr(spent)], ["Remaining budget", mb ? inr(mb.amount - spent) : "Set a monthly budget"],
    ["Daily average", inr(spent / now.getDate())], ["Vs last month", change === null ? "No data yet" : `${change > 0 ? "+" : ""}${change}%`]];
  if (!tx.length) return <Empty text={<>No transactions yet. <Link className="text-neon" to="/expenses">Add your first expense</Link>.</>} />;
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Welcome back! Here's your financial overview.</h1></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{cards.map(([l, v]) => <Card key={l}><p className="text-xs text-muted">{l}</p><p className="text-lg font-bold mt-1">{v}</p></Card>)}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Card><p className="text-sm mb-2">Last 7 days</p><ResponsiveContainer height={180}><BarChart data={week}><XAxis dataKey="day" stroke="#94A3B8" fontSize={11} /><Tooltip {...tip} /><Bar dataKey="total" fill="#B6F36B" radius={6} /></BarChart></ResponsiveContainer></Card>
        <Card><p className="text-sm mb-2">This month by category</p>{cats.length ? <ResponsiveContainer height={180}><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>{cats.map((_, i) => <Cell key={i} fill={COLORS[i % 9]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer> : <p className="text-muted text-sm py-12 text-center">No spending this month.</p>}</Card>
      </div>
      <Card><p className="text-sm mb-2">Recent transactions</p>
        {[...tx].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 5).map((t) => (
          <div key={t.id} className="flex justify-between py-2 border-t border-white/5 text-sm"><div><p>{t.title}</p><p className="text-xs text-muted">{t.category} · {t.payment_method} · {t.transaction_date}</p></div><p className="font-semibold">{inr(t.amount)}</p></div>))}
      </Card>
    </div>
  );
}
