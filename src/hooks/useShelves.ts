import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Shelf = {
  id: string;
  name: string;
  description?: string | null;
};

export function useShelves() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("shelves")
      .select("id,name,description")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setShelves([]);
      setLoading(false);
      return;
    }

    setShelves((data ?? []) as Shelf[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Shelf>();
    shelves.forEach((s) => m.set(s.id, s));
    return m;
  }, [shelves]);

  return { shelves, byId, loading, error, reload: load };
}