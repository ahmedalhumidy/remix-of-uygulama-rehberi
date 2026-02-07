import { useEffect(() => {
  const init = async () => {
    // 🔥 This line converts the email link token into a real session
    await supabase.auth.getSessionFromUrl({ storeSession: true });

    setReady(true);
  };

  init();
}, []);

import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await supabase.auth.getSession();
      setReady(true);
    };
    init();
  }, []);

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      alert("Password updated!");
      window.location.href = "/";
    } else {
      alert(error.message);
    }
  };

  if (!ready) return <div>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Set New Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleReset}>Update Password</button>
    </div>
  );
}
