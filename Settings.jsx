import { useState, useEffect } from "react";
import { supabase, useApp } from "../lib";
import { Card, Btn, Input, Field } from "../ui";

export default function Settings() {
  const { user, demo, notify, logout } = useApp();
  const [name, setName] = useState(demo ? "Demo Student" : ""), [conf, setConf] = useState("");
  useEffect(() => {
    if (demo || !supabase || !user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => data && setName(data.full_name || ""));
  }, [demo, user?.id]);
  const saveName = async () => {
    if (demo) return notify("Profile changes are disabled in demo mode.", "err");
    const { error } = await supabase.from("profiles").update({ full_name: name.trim().slice(0, 100) }).eq("id", user.id);
    notify(error ? error.message : "Profile saved", error ? "err" : "ok");
  };
  const reset = async () => {
    if (demo) return notify("Not available in demo mode.", "err");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: location.origin + location.pathname });
    notify(error ? error.message : "Password reset email sent.", error ? "err" : "ok");
  };
  const del = async () => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) return notify("Couldn't delete the account. Please try again.", "err");
    await supabase.auth.signOut();
  };
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card className="space-y-3"><p className="font-semibold text-sm">Profile</p>
        <Field label="Display name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></Field>
        <Field label="Email"><Input value={user.email} disabled /></Field>
        <Field label="Currency"><Input value="INR (₹)" disabled /></Field>
        <Btn onClick={saveName}>Save profile</Btn></Card>
      <Card className="space-y-3"><p className="font-semibold text-sm">Account</p>
        <Btn v="ghost" onClick={reset}>Send password reset email</Btn> <Btn v="ghost" onClick={logout}>Log out</Btn></Card>
      {!demo && <Card className="space-y-3 border-red-500/30"><p className="font-semibold text-sm text-red-300">Delete account</p>
        <p className="text-xs text-muted">Permanently deletes your account and all your data. Type DELETE to confirm.</p>
        <Input value={conf} onChange={(e) => setConf(e.target.value)} /><Btn v="danger" disabled={conf !== "DELETE"} onClick={del}>Delete my account</Btn></Card>}
      <p className="text-xs text-muted">Light theme and notification preferences are not available yet.</p>
    </div>
  );
}
