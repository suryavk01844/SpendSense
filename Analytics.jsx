import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useList, inr, today, iso } from "./lib";
import { Card, Btn, Input, Select, Skel, Empty, Bar as Prog } from "../ui";

const n = new Date();
const PRESETS = { Today: () => [today(), today()], "Last 7 days": () => [today(-6), today()], "Last 30 days": () => [today(-29), today()],
  "This month": () => [iso(new Date(n.getFullYear(), n.getMonth(), 1)), today()], "This year": () => [`${n.getFullYear()}-01-01`, today()] };

export default function Analytics() {
  const [tx] = useList("transactions"), [p, setP] = useState("Last 30 days"), [from, setFrom] = useState(today(-29)), [to, setTo] = useState(today());
  if (!tx) return <Skel />;
  const [a, b] = p === "Custom" ? [from, to] : PRESETS[p]();
  const list = tx.filter((t) => t.type !== "income" && t.transaction_date >= a && t.transaction_date <= b).sort((x, y) => x.transaction_date.localeCompare(y.transaction_date));
  const total = list.reduce((s, t) => s + Number(t.amount), 0), monthly = (new Date(b) - new Date(a)) / 864e5 > 62;
  const by = (f) => list.reduce((m, t) => ({ ...m, [f(t)]: (m[f(t)] || 0) + Number(t.amount) }), {});
  const trend = Object.entries(by((t) => (monthly ? t.transaction_date.slice(0, 7) : t.transaction_date.slice(5)))).map(([k, v]) => ({ k, v }));
  const cats = Object.entries(by((t) => t.category)).sort((x, y) => y[1] - x[1]);
  const csv = () => {
    const esc = (v) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [["Date", "Title", "Amount", "Category", "Payment method", "Notes"], ...list.map((t) => [t.transaction_date, t.title, t.amount, t.category, t.payment_method, t.notes])];
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }));
    el.download = `spendsense-${a}-to-${b}.csv`; el.click(); URL.revokeObjectURL(el.href);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Analytics</h1>
        <div className="flex gap-2"><Btn v="ghost" onClick={csv} disabled={!list.length}><Download size={14} className="inline" /> CSV</Btn><Btn v="ghost" onClick={() => window.print()}><Printer size={14} className="inline" /> PDF</Btn></div></div>
      <div className="flex gap-2 flex-wrap"><Select options={[...Object.keys(PRESETS), "Custom"]} value={p} onChange={(e) => setP(e.target.value)} className="!w-40" />
        {p === "Custom" && <><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-40" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-40" /></>}</div>
      {!list.length ? <Empty text="No expenses in this period." /> : <>
        <div className="grid grid-cols-2 gap-3"><Card><p className="text-xs text-muted">Total ({a} to {b})</p><p className="text-lg font-bold">{inr(total)}</p></Card><Card><p className="text-xs text-muted">Transactions</p><p className="text-lg font-bold">{list.length}</p></Card></div>
        <Card><p className="text-sm mb-2">Spending trend</p><ResponsiveContainer height={180}><BarChart data={trend}><XAxis dataKey="k" stroke="#94A3B8" fontSize={11} /><Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #ffffff22", borderRadius: 12 }} /><Bar dataKey="v" fill="#B6F36B" radius={6} /></BarChart></ResponsiveContainer></Card>
        <Card className="space-y-3"><p className="text-sm">Category breakdown</p>{cats.map(([c, v]) => <div key={c} className="space-y-1"><p className="text-xs flex justify-between"><span>{c}</span><span className="text-muted">{inr(v)} · {Math.round((v / total) * 100)}%</span></p><Prog pct={(v / total) * 100} /></div>)}</Card></>}
      <p className="text-xs text-muted">Exports contain only your own records. Income tracking is not available yet.</p>
    </div>
  );
}
