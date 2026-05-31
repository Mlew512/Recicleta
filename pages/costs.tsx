import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface CostItem {
  id: number;
  description: string;
  amount: number;
  category: string | null;
  note: string | null;
  created_at: string;
  created_by_email: string | null;
}

export default function CostsPage() {
  const { lang } = useLanguage();
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("costs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setCosts(data || []);
    }
    setLoading(false);
  };

  const labels = {
    title: lang === "en" ? "Costs" : "Costos",
    description: lang === "en" ? "Description" : "Descripción",
    amount: lang === "en" ? "Amount (€)" : "Monto (€)",
    category: lang === "en" ? "Category (optional)" : "Categoría (opcional)",
    note: lang === "en" ? "Note (optional)" : "Nota (opcional)",
    addCost: lang === "en" ? "Add Cost" : "Agregar costo",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    noCosts: lang === "en" ? "No costs recorded yet." : "Aún no hay costos registrados.",
    success: lang === "en" ? "Cost added!" : "¡Costo agregado!",
    error: lang === "en" ? "Error adding cost:" : "Error agregando costo:",
    date: lang === "en" ? "Date" : "Fecha",
    enteredBy: lang === "en" ? "Entered by" : "Registrado por",
    total: lang === "en" ? "Total" : "Total",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!description.trim() || amount === "" || Number(amount) <= 0) {
      setMessage(lang === "en" ? "Please add a description and valid amount." : "Por favor agrega descripción y monto válido.");
      return;
    }

    setAdding(true);
    const { data: userData } = await supabase.auth.getUser();
    const createdByEmail = userData.user?.email || null;

    const costData = {
      description: description.trim(),
      amount: typeof amount === "string" ? parseFloat(amount) : amount,
      category: category.trim() || null,
      note: note.trim() || null,
      created_at: new Date().toISOString(),
      created_by_email: createdByEmail,
    };

    const { error } = await supabase.from("costs").insert([costData]);
    if (error) {
      setMessage(`${labels.error} ${error.message}`);
    } else {
      setMessage(labels.success);
      setDescription("");
      setAmount("");
      setCategory("");
      setNote("");
      fetchCosts();
    }

    setAdding(false);
  };

  const getUserName = (email: string | null) => {
    if (!email) return lang === "en" ? "Unknown" : "Desconocido";
    return email.split("@")[0];
  };

  const costsTotal = costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>

        <form onSubmit={handleSubmit} className="grid gap-4 mb-8 bg-gray-50 p-4 rounded shadow-sm">
          <div>
            <label className="block font-semibold mb-1">{labels.description}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{labels.amount}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
              min={0}
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{labels.category}</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{labels.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {adding ? (lang === "en" ? "Adding..." : "Agregando...") : labels.addCost}
          </button>
        </form>

        {message && (
          <div className="mb-6 text-center text-green-700 font-semibold">{message}</div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">{lang === "en" ? "Total cost recorded:" : "Costo total registrado:"}</div>
          <div className="text-xl font-bold">€{costsTotal.toFixed(2)}</div>
        </div>

        {loading ? (
          <div>{labels.loading}</div>
        ) : costs.length === 0 ? (
          <p className="text-gray-500">{labels.noCosts}</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.description}</th>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.amount}</th>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.category}</th>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.note}</th>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.date}</th>
                  <th className="p-2 border text-sm font-semibold text-gray-700">{labels.enteredBy}</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-50">
                    <td className="border p-2 text-sm">{cost.description}</td>
                    <td className="border p-2 text-sm">€{cost.amount.toFixed(2)}</td>
                    <td className="border p-2 text-sm">{cost.category || "—"}</td>
                    <td className="border p-2 text-sm">{cost.note || "—"}</td>
                    <td className="border p-2 text-sm">{new Date(cost.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 text-sm">{getUserName(cost.created_by_email)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
