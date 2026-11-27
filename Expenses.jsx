import { useState } from "react";
import { Sparkles, Pencil, Trash2, Plus } from "lucide-react";
import { useApp, useList, suggest, inr, today, CATS, PAY } from "../lib";
import { Card, Btn, Input, Select, Field, Modal, Skel, Empty } from "../ui";

function Form({ init, onSave, onClose }) {
  const [f, setF] = useState(init), set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={f.id ? "Edit expense" : "Add expense"} onClose={onClose}>
      <Field label="Title"><Input value={f.title} onChange={set("title")} maxLength={120} /></Field>
      <Field label="Amount (₹)"><Input type="number" min="0" step="0.01" value={f.amount} onChange={set("amount")} /></Field>
      <Field label="Category"><Select options={CATS} value={f.category} onChange={set("category")} /></Field>
      <Field label="Date"><Input type="date" value={f.transaction_date} onChange={set("transaction_date")} /></Field>
      <Field label="Payment method"><Select options={PAY} value={f.payment_method} onChange={set("payment_method")} /></Field>
      <Field label="Notes"><Input value={f.notes || ""} onChange={set("notes")} maxLength={500} /></Field>
      <Btn className="w-full" onClick={() => onSave(f)}>Save</Btn>
    </Modal>
  );
}
const blank = { title: "", amount: "", category: "Food", transaction_date: today(), payment_method: "UPI", notes: "" };

export default function Expenses() {
  const { api, notify, demo } = useApp();
  const [tx, load] = useList("transactions");
  const [q, setQ] = useState(""), [cat, setCat] = useState("All"), [form, setForm] = useState(null), [text, setText] = useState(""), [sug, setSug] = useState(null), [busy, setBusy] = useState(false);
  const analyze = async () => { setBusy(true); try { setSug(await suggest(text, demo)); } catch (e) { notify(e.message, "err"); } setBusy(false); };
  const save = async (row) => {
    if (!row.title.trim() || !(+row.amount > 0)) return notify("Enter a title and an amount above 0.", "err");
    try { await api.save("transactions", { ...row, title: row.title.trim(), amount: +row.amount, ...(demo && { is_demo: true }) }); notify("Expense saved"); setForm(null); setSug(null); setText(""); load(); }
    catch (e) { notify(e.message, "err"); }
  };
  const del = async (id) => { if (!confirm("Delete this expense?")) return; try { await api.remove("transactions", id); load(); } catch (e) { notify(e.message, "err"); } };
  const rows = (tx || []).filter((t) => (cat === "All" || t.category === cat) && t.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  const s = sug?.suggestion;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Expenses</h1><Btn onClick={() => setForm(blank)}><Plus size={14} className="inline" /> Add</Btn></div>
      <Card className="space-y-3">
        <p className="text-sm flex items-center gap-2"><Sparkles size={16} className="text-neon" />Smart entry</p>
        <div className="flex gap-2"><Input placeholder="e.g. ₹80 bus fare" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyze()} /><Btn onClick={analyze} disabled={busy}>{busy ? "Thinking…" : "Analyze"}</Btn></div>
        {s && (
          <div className="bg-panel rounded-xl p-3 text-sm space-y-1">
            <p className="text-xs text-muted">{sug.source === "ai" ? "AI suggestion" : "Fallback mode: keyword matching (AI unavailable)"}{sug.needs_review && " · please review"}</p>
            <p>Amount: {inr(s.amount)}</p><p>Description: {s.title}</p><p>Category: {s.category}</p><p>Date: {s.transaction_date}</p>
            <div className="flex gap-2 pt-2"><Btn onClick={() => save({ ...blank, ...s })}>Confirm</Btn><Btn v="ghost" onClick={() => setForm({ ...blank, ...s })}>Edit</Btn><Btn v="ghost" onClick={() => setSug(null)}>Cancel</Btn></div>
          </div>)}
      </Card>
      <div className="flex gap-2"><Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /><Select options={["All", ...CATS]} value={cat} onChange={(e) => setCat(e.target.value)} className="!w-40" /></div>
      {!tx ? <Skel /> : !rows.length ? <Empty text="No expenses found." /> : rows.map((t) => (
        <Card key={t.id} className="flex items-center justify-between gap-2">
          <div className="min-w-0"><p className="truncate">{t.title}</p><p className="text-xs text-muted">{t.category} · {t.payment_method} · {t.transaction_date}</p></div>
          <div className="flex items-center gap-3"><span className="font-semibold">{inr(t.amount)}</span><button onClick={() => setForm(t)}><Pencil size={16} className="text-muted" /></button><button onClick={() => del(t.id)}><Trash2 size={16} className="text-red-400" /></button></div>
        </Card>))}
      {form && <Form init={form} onSave={save} onClose={() => setForm(null)} />}
    </div>
  );
}
