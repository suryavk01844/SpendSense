import { motion } from "framer-motion";
import { X } from "lucide-react";
export const Card = ({ className = "", ...p }) => <div className={`bg-card rounded-2xl p-4 border border-white/5 ${className}`} {...p} />;
export const Btn = ({ v, className = "", ...p }) => (
  <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${v === "ghost" ? "bg-white/5 hover:bg-white/10" : v === "danger" ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-neon text-navy hover:brightness-110"} ${className}`} {...p} />
);
const base = "w-full bg-panel border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-neon";
export const Input = ({ className = "", ...p }) => <input className={`${base} ${className}`} {...p} />;
export const Select = ({ options, className = "", ...p }) => <select className={`${base} ${className}`} {...p}>{options.map((o) => <option key={o}>{o}</option>)}</select>;
export const Field = ({ label, children }) => <label className="block text-xs text-muted space-y-1"><span>{label}</span>{children}</label>;
export const Skel = () => <div className="h-24 rounded-2xl bg-card animate-pulse" />;
export const Bar = ({ pct, color = "#B6F36B" }) => (
  <div className="h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} /></div>
);
export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4" onClick={onClose}>
    <div className="bg-panel rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center"><h3 className="font-semibold">{title}</h3><button onClick={onClose}><X size={18} /></button></div>
      {children}
    </div>
  </div>
);
export const Empty = ({ text }) => <Card className="text-center text-muted py-10">{text}</Card>;
