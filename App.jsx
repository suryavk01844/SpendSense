import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HashRouter, Routes, Route, Navigate, NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, Target, LogOut, PanelLeft, Eye, EyeOff, Lightbulb, BarChart3, Bell, Settings as Cog } from "lucide-react";
import { supabase, makeApi, Ctx, useApp, syncAlerts } from "./lib";
import { Card, Btn, Input, Skel } from "./ui";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Budgets from "./Budgets";
import Goals from "./Goals";
import Insights from "./Insights";
import Analytics from "./Analytics";
import Notifications from "./Notifications";
import Settings from "./Settings";

class EB extends React.Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  render() { return this.state.e ? <Card>Something went wrong. <Btn onClick={() => location.reload()}>Reload</Btn></Card> : this.props.children; }
}

function Provider({ children }) {
  const [session, setSession] = useState(null), [ready, setReady] = useState(false), [demo, setDemo] = useState(false), [toast, setToast] = useState(null), [tick, setTick] = useState(0);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  const notify = useCallback((msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);
  const api = useMemo(() => makeApi(demo), [demo]);
  const user = demo ? { email: "demo@spendsense.app" } : session?.user;
  const logout = () => (demo ? setDemo(false) : supabase.auth.signOut());
  return (
    <Ctx.Provider value={{ ready, demo, setDemo, user, api, notify, logout, tick, bump: () => setTick((t) => t + 1) }}>
      {children}
      {toast && <div className={`fixed bottom-20 md:bottom-6 right-4 z-[60] px-4 py-3 rounded-xl text-sm shadow-lg ${toast.type === "err" ? "bg-red-500 text-white" : "bg-neon text-navy"}`}>{toast.msg}</div>}
    </Ctx.Provider>
  );
}

function AuthPage({ mode }) {
  const { user, setDemo, notify } = useApp();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false);
  const up = mode === "signup", set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (!supabase) return notify("Supabase isn't configured. Try demo mode.", "err");
    if (up && (f.password.length < 8 || f.password !== f.confirm || !f.terms || !f.name.trim())) return notify("Enter your name, an 8+ character matching password, and accept the terms.", "err");
    setBusy(true);
    const r = up ? await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    setBusy(false);
    if (r.error) return notify(r.error.message, "err");
    if (up) notify("Check your email to verify your account.");
  };
  const forgot = async () => {
    if (!f.email || !supabase) return notify("Enter your email first.", "err");
    const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + location.pathname });
    notify(error ? error.message : "Password reset link sent.", error ? "err" : "ok");
  };
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-3 border border-white/5">
        <h1 className="text-2xl font-bold text-neon">SpendSense</h1>
        <p className="text-xs text-muted">Track Smart. Spend Better. Save More.</p>
        {up && <Input placeholder="Full name" value={f.name} onChange={set("name")} required />}
        <Input type="email" placeholder="Email" value={f.email} onChange={set("email")} required />
        <div className="relative"><Input type={show ? "text" : "password"} placeholder="Password" value={f.password} onChange={set("password")} required />
          <button type="button" className="absolute right-3 top-2.5 text-muted" onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        {up && <Input type="password" placeholder="Confirm password" value={f.confirm} onChange={set("confirm")} required />}
        {up && <label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={f.terms} onChange={set("terms")} /> I accept the Terms and Privacy Policy</label>}
        <Btn className="w-full" disabled={busy}>{busy ? "Please wait…" : up ? "Create account" : "Log in"}</Btn>
        {!up && <button type="button" onClick={forgot} className="text-xs text-muted underline">Forgot password?</button>}
        <Btn type="button" v="ghost" className="w-full" onClick={() => setDemo(true)}>Try demo mode (sample data)</Btn>
        <p className="text-xs text-muted text-center">{up ? "Have an account?" : "New here?"} <Link className="text-neon" to={up ? "/login" : "/signup"}>{up ? "Log in" : "Sign up"}</Link></p>
        <p className="text-[10px] text-muted text-center">We never ask for bank passwords, UPI PINs or card details.</p>
      </form>
    </div>
  );
}

const NAV = [["/", "Dashboard", LayoutDashboard], ["/expenses", "Expenses", Receipt], ["/budgets", "Budgets", PiggyBank], ["/goals", "Goals", Target],
  ["/insights", "Insights", Lightbulb], ["/analytics", "Analytics", BarChart3], ["/notifications", "Alerts", Bell], ["/settings", "Settings", Cog]];
function Shell() {
  const { user, ready, demo, logout, api, tick } = useApp();
  const [min, setMin] = useState(false), [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user) return;
    syncAlerts(api).catch(() => {}).then(() => api.list("notifications")).then((n) => setUnread(n.filter((x) => !x.is_read).length)).catch(() => {});
  }, [api, user?.email, tick]);
  if (!ready) return <div className="p-8"><Skel /></div>;
  if (!user) return <Navigate to="/login" replace />;
  const cls = ({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${isActive ? "bg-neon text-navy font-semibold" : "text-muted hover:bg-white/5"}`;
  return (
    <div className="min-h-screen flex">
      <aside className={`hidden md:flex flex-col gap-1 bg-panel p-3 transition-all ${min ? "w-16" : "w-56"}`}>
        <button className="p-2 text-muted" onClick={() => setMin(!min)}><PanelLeft size={18} /></button>
        {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === "/"} className={cls}><Icon size={18} />{!min && label}{to === "/notifications" && unread > 0 && <span className="ml-auto bg-red-500 text-[10px] rounded-full px-1.5">{unread}</span>}</NavLink>)}
        <button onClick={logout} className="mt-auto flex items-center gap-3 px-3 py-2 text-sm text-muted"><LogOut size={18} />{!min && "Log out"}</button>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full space-y-4">
        {demo && <div className="bg-neon/10 border border-neon/30 text-neon text-xs rounded-xl px-3 py-2 flex justify-between">Demo mode: sample demonstration data, not saved. <button onClick={logout} className="underline">Exit</button></div>}
        <EB><Outlet /></EB>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-panel border-t border-white/10 flex overflow-x-auto gap-1 p-2">
        {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `relative min-w-[64px] flex flex-col items-center text-[10px] ${isActive ? "text-neon" : "text-muted"}`}><Icon size={20} />{label}{to === "/notifications" && unread > 0 && <span className="absolute top-0 right-3 bg-red-500 text-white rounded-full px-1">{unread}</span>}</NavLink>)}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Provider><HashRouter><Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} /><Route path="expenses" element={<Expenses />} />
        <Route path="budgets" element={<Budgets />} /><Route path="goals" element={<Goals />} />
        <Route path="insights" element={<Insights />} /><Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} /><Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></HashRouter></Provider>
  );
}
