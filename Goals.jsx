import { useState } from "react";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useApp, useList, inr } from "./lib";
import { Card, Btn, Input, Field, Modal, Bar, Skel, Empty } from "./ui";

export default function Goals() {
  const { api, notify } = useApp();
  const [goals, load] = useList("savings_goals"), [f, setF] = useState(null), [add, setAdd] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = async (fn) => { try { await fn(); load(); } catch (e) { notify(e.message, "err"); } };
  const save = () => {
    if (!f.title?.trim() || !(+f.target_amount > 0) || +f.current_amount < 0) return notify("Enter a title and a target above 0.", "err");
    run(async () => { await api.save("savings_goals", { ...f, title: f.title.trim(), target_amount: +f.target_amount, current_amount: +f.current_amount || 0, target_date: f.target_date || null }); setF(null); });
  };
  const contribute = (g) => { const n = +add[g.id]; if (!(n > 0)) return notify("Enter an amount above 0.", "err"); run(async () => { await api.save("savings_goals", { id: g.id, current_amount: Number(g.current_amount) + n }); setAdd({ ...add, [g.id]: "" }); notify("Contribution added"); }); };
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-xl font-bold">Savings goals</h1><Btn onClick={() => setF({ title: "", target_amount: "", current_amount: 0, target_date: "" })}><Plus size={14} className="inline" /> New</Btn></div>
      {!goals ? <Skel /> : !goals.length ? <Empty text="No goals yet. Start with something small." /> : goals.map((g) => {
        const pct = Math.round((g.current_amount / g.target_amount) * 100);
        return (
          <Card key={g.id} className="space-y-2">
            <div className="flex justify-between"><p className="font-semibold">{g.title}</p><div className="flex gap-3"><button onClick={() => setF({ ...g, target_date: g.target_date || "" })}><Pencil size={16} className="text-muted" /></button><button onClick={() => confirm("Delete this goal?") && run(() => api.remove("savings_goals", g.id))}><Trash2 size={16} className="text-red-400" /></button></div></div>
            <Bar pct={pct} />
            <p className="text-xs text-muted flex justify-between"><span>{inr(g.current_amount)} of {inr(g.target_amount)} ({pct}%)</span><span>{inr(Math.max(0, g.target_amount - g.current_amount))} to go</span></p>
            <div className="flex gap-2"><Input type="number" min="0" placeholder="Add contribution (₹)" value={add[g.id] || ""} onChange={(e) => setAdd({ ...add, [g.id]: e.target.value })} /><Btn onClick={() => contribute(g)}>Add</Btn></div>
          </Card>);
      })}
      {f && (
        <Modal title={f.id ? "Edit goal" : "New goal"} onClose={() => setF(null)}>
          <Field label="Title"><Input value={f.title} onChange={set("title")} maxLength={80} /></Field>
          <Field label="Target amount (₹)"><Input type="number" min="0" value={f.target_amount} onChange={set("target_amount")} /></Field>
          <Field label="Current savings (₹)"><Input type="number" min="0" value={f.current_amount} onChange={set("current_amount")} /></Field>
          <Field label="Target date (optional)"><Input type="date" value={f.target_date} onChange={set("target_date")} /></Field>
          <Btn className="w-full" onClick={save}>Save</Btn>
        </Modal>)}
    </div>
  );
}
