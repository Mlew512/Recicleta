import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type BikeOption = {
  id: number;
  brand_model: string;
  size: string;
  type: string;
  isCurrent?: boolean;
};

export function useBikeOptions(currentBikeId: number | null) {
  const [options, setOptions] = useState<BikeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        // Only Disponible bikes
        const { data: available, error: availErr } = await supabase
          .from("bikes")
          .select("id, brand_model, size, type")
          .eq("status", "Disponible");
        if (availErr) throw availErr;

        // Fetch current bike (even if not Disponible)
        let current: BikeOption | null = null;
        if (currentBikeId) {
          const { data: cur, error: curErr } = await supabase
            .from("bikes")
            .select("id, brand_model, size, type")
            .eq("id", currentBikeId)
            .maybeSingle();
          if (curErr) throw curErr;
          if (cur) current = { ...(cur as any), isCurrent: true };
        }

        // Build list: current first (if present), then available excluding current
        const filteredAvailable = (available || []).filter(
          (b) => (current ? b.id !== current.id : true)
        ) as BikeOption[];

        // Optional: sort available by brand/model
        filteredAvailable.sort((a, b) =>
          (a.brand_model || "").localeCompare(b.brand_model || "")
        );

        const list = current ? [current, ...filteredAvailable] : filteredAvailable;

        setOptions(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load bikes");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [currentBikeId]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, error, reload: load };
}