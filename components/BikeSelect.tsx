import React from "react";
import { useBikeOptions } from "@/hooks/useBikeOptions";

type Props = {
  currentBikeId: number | null;        // bike currently assigned to the rental
  value: number | null;                // controlled selected bike id
  onChange: (id: number | null) => void;
  label?: string;
  className?: string;
};

export default function BikeSelect({
  currentBikeId,
  value,
  onChange,
  label = "Bike",
  className,
}: Props) {
  const { options, loading } = useBikeOptions(currentBikeId);

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="border px-3 py-2 rounded w-full"
        disabled={loading}
      >
        <option value="">{loading ? "Loading..." : "Select a bike…"}</option>
        {options.map((b) => (
          <option key={b.id} value={b.id}>
            {b.brand_model} • {b.type} • {b.size}
            {b.isCurrent ? " • *current" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}