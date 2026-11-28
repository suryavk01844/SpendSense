import { useState } from "react";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useApp, useList, inr, range, CATS } from "./lib";
import { Card, Btn, Input, Select, Field, Modal, Bar, Skel, Empty } from "./ui";

const level = (p) => (p >= 100 ? ["Budget exceeded", "#F87171"] : p >= 90 ? ["90% used", "#FB923C"] : p >= 75 ? ["75% used", "#FACC15"] : p >= 50 ? ["50% used", "#60A5FA"] : ["On track", "#B6F36B"]);

export default function Budgets() {
  const { api, notify } = useApp();
  const [bud, load] = useList("budgets"), [tx] = useList("transactions"), [f, setF] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setPeriod = (e) => { const p = e.target.value; const [s, en] = p === "custom" ? [f.start_date, f.end_date] : range(p); setF({ ...f, period: p, start_date: s, end_date: en }); };
  const save = async () => {
    if (!(+f.amount > 0) || f.end_date < f.start_date) return notify("Enter an amount above 0 and a valid date range.", "err");
    try { await api.save("budgets", { ...f, amount: +f.amount, category: f.category === "Overall" ? null : f.category }); setF(null); load(); } catch (e) { notify(e.message, "err"); }
  };
  const del = async (id) => { if (confirm("Delete this budget?")) try { await api.remove("budgets", id); load(); } catch (e) { notify(e.message, "err"); } };
  const open = (b) => setF(b ? { ...b, category: b.category || "Overall" } : { category: "Overall", amount: "", period: "monthly", ...(() => { const [s, e] = range("monthly"); return { start_date: s, end_date: e }; })() });
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-xl font-bold">Budgets</h1><Btn onClick={() => open()}><Plus size={14} className="inline" /> New</Btn></div>
      {!bud || !tx ? <Skel /> : !bud.length ? <Empty text="No budgets yet. Create one to track your spending." /> : bud.map((b) => {
        const spent = tx.filter((t) => t.type !== "income" && t.transaction_date >= b.start_date && t.transaction_date <= b.end_date && (!b.category || t.category === b.category)).reduce((s, t) => s + Number(t.amount), 0);
        const pct = Math.round((spent / b.amount) * 100), [label, color] = level(pct);
        return (
          <Card key={b.id} className="space-y-2">
            <div className="flex justify-between"><div><p className="font-semibold">{b.category || "Overall"} · {b.period}</p><p className="text-xs text-muted">{b.start_date} to {b.end_date}</p></div>
              <div className="flex gap-3"><button onClick={() => open(b)}><Pencil size={16} className="text-muted" /></button><button onClick={() => del(b.id)}><Trash2 size={16} className="text-red-400" /></button></div></div>
            <Bar pct={pct} color={color} />
            <p className="text-xs flex justify-between"><span style={{ color }}>{label} ({pct}%)</span><span className="text-muted">{inr(spent)} of {inr(b.amount)} · {inr(Math.max(0, b.amount - spent))} left</span></p>
          </Card>);
      })}
      {f && (
        <Modal title={f.id ? "Edit budget" : "New budget"} onClose={() => setF(null)}>
          <Field label="Category"><Select options={["Overall", ...CATS]} value={f.category} onChange={set("category")} /></Field>
          <Field label="Amount (₹)"><Input type="number" min="0" value={f.amount} onChange={set("amount")} /></Field>
          <Field label="Period"><Select options={["monthly", "weekly", "custom"]} value={f.period} onChange={setPeriod} /></Field>
          <Field label="Start"><Input type="date" value={f.start_date} onChange={set("start_date")} disabled={f.period !== "custom"} /></Field>
          <Field label="End"><Input type="date" value={f.end_date} onChange={set("end_date")} disabled={f.period !== "custom"} /></Field>
          <Btn className="w-full" onClick={save}>Save</Btn>
        </Modal>)}
    </div>
  );
}
