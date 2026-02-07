import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Recovery links come as URL hash: #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setErrorMsg("Missing recovery tokens. Please open the link from the email again.");
        setReady(true);
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        setErrorMsg(error.message);
      }

      setReady(true);
    };

    init();
  }, []);

  const handleReset = async () => {
    setErrorMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("Password updated!");
    window.location.href = "/";
  };

  if (!ready) return <div>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Set New Password</h2>

      {errorMsg && (
        <p style={{ color: "red", marginTop: 10 }}>
          {errorMsg}
        </p>
      )}

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginTop: 12, padding: 10, width: 320 }}
      />

      <button onClick={handleReset} style={{ marginTop: 12 }}>
        Update Password
      </button>
    </div>
  );
}
