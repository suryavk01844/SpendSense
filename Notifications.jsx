import { Trash2, CheckCheck } from "lucide-react";
import { useApp, useList } from "./lib";
import { Card, Btn, Skel, Empty } from "./ui";

export default function Notifications() {
  const { api, notify, bump } = useApp();
  const [list, load] = useList("notifications");
  const run = async (fn) => { try { await fn(); await load(); bump(); } catch (e) { notify(e.message, "err"); } };
  if (!list) return <Skel />;
  const rows = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Notifications</h1>
        <Btn v="ghost" disabled={!rows.some((r) => !r.is_read)} onClick={() => run(async () => { for (const r of rows.filter((x) => !x.is_read)) await api.save("notifications", { id: r.id, is_read: true }); })}><CheckCheck size={14} className="inline" /> Mark all read</Btn></div>
      {!rows.length ? <Empty text="You're all caught up. Budget and savings alerts will show up here." /> : rows.map((r) => (
        <Card key={r.id} className={`flex justify-between gap-3 ${r.is_read ? "opacity-60" : "border-neon/40"}`}>
          <div className="text-sm"><p className="font-semibold">{r.title}</p><p className="text-muted">{r.message}</p><p className="text-[10px] text-muted mt-1">{new Date(r.created_at).toLocaleString()}</p></div>
          <div className="flex flex-col gap-2 items-end">{!r.is_read && <button className="text-xs text-neon" onClick={() => run(() => api.save("notifications", { id: r.id, is_read: true }))}>Mark read</button>}
            <button onClick={() => run(() => api.remove("notifications", r.id))}><Trash2 size={16} className="text-red-400" /></button></div>
        </Card>))}
    </div>
  );
}
