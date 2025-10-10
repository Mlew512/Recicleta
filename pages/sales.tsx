import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface Sale {
  id: number;
  item: string;
  amount: number;
  quantity: number;
  buyer_name?: string;
  buyer_email?: string;
  sale_date: string;
}

export default function SalesPage() {
  const { lang } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isDonation, setIsDonation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data } = await supabase.from("sales").select("*");
    // if you want to log errors:
    // const { data, error } = await supabase.from("sales").select("*");
    // if (error) console.error(error);
    setSales(data || []);
    setLoading(false);
  };

  const labels = {
    title: lang === "en" ? "Sales & Donations" : "Ventas y Donaciones",
    item: lang === "en" ? "Item" : "Artículo",
    amount: lang === "en" ? "Amount (€)" : "Monto (€)",
    quantity: lang === "en" ? "Quantity" : "Cantidad",
    buyerName: lang === "en" ? "Buyer Name (optional)" : "Nombre del comprador (opcional)",
    buyerEmail: lang === "en" ? "Buyer Email (optional)" : "Email del comprador (opcional)",
    donation: lang === "en" ? "Donation" : "Donación",
    sale: lang === "en" ? "Sale" : "Venta",
    addSale: lang === "en" ? "Add Sale/Donation" : "Agregar Venta/Donación",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    noSales: lang === "en" ? "No sales or donations found." : "No se encontraron ventas o donaciones.",
    success: lang === "en" ? "Sale/Donation registered!" : "¡Venta/Donación registrada!",
    error: lang === "en" ? "Error registering: " : "Error registrando: ",
    date: lang === "en" ? "Date" : "Fecha",
    anon: lang === "en" ? "Anonymous" : "Anónimo",
    type: lang === "en" ? "Type" : "Tipo",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage(null);

    const saleData = {
      item: isDonation ? labels.donation : item,
      amount: typeof amount === "string" ? parseFloat(amount) : amount,
      quantity: isDonation ? 1 : quantity,
      buyer_name: buyerName.trim() ? buyerName : null,
      buyer_email: buyerEmail.trim() ? buyerEmail : null,
      sale_date: new Date().toISOString().split("T")[0],
    };

    const { error } = await supabase.from("sales").insert([saleData]);
    if (error) {
      setMessage(labels.error + error.message);
    } else {
      setMessage(labels.success);
      setItem("");
      setAmount("");
      setQuantity(1);
      setBuyerName("");
      setBuyerEmail("");
      setIsDonation(false);
      fetchSales();
    }
    setAdding(false);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow mt-8">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>
        {/* Add Sale/Donation Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded">
          <div className="flex items-center gap-2 w-full">
            <input
              type="checkbox"
              checked={isDonation}
              onChange={() => setIsDonation(!isDonation)}
              id="donation"
            />
            <label htmlFor="donation" className="font-semibold">{labels.donation}</label>
          </div>
          {!isDonation && (
            <input
              type="text"
              placeholder={labels.item}
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded flex-1"
            />
          )}
          <input
            type="number"
            placeholder={labels.amount}
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            required
            min={0}
            step="0.01"
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          {!isDonation && (
            <input
              type="number"
              placeholder={labels.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              min={1}
              className="border border-gray-300 px-3 py-2 rounded flex-1"
            />
          )}
          <input
            type="text"
            placeholder={labels.buyerName}
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <input
            type="email"
            placeholder={labels.buyerEmail}
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {adding ? (lang === "en" ? "Registering..." : "Registrando...") : labels.addSale}
          </button>
        </form>
        {message && (
          <div className="mb-6 text-center text-green-700 font-semibold">{message}</div>
        )}
        {/* Sales Table */}
        {loading ? (
          <p>{labels.loading}</p>
        ) : sales.length === 0 ? (
          <p className="text-gray-500">{labels.noSales}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-2 border">{labels.type}</th>
                  <th className="p-2 border">{labels.item}</th>
                  <th className="p-2 border">{labels.amount}</th>
                  <th className="p-2 border">{labels.quantity}</th>
                  <th className="p-2 border">{labels.buyerName}</th>
                  <th className="p-2 border">{labels.buyerEmail}</th>
                  <th className="p-2 border">{labels.date}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-100">
                    <td className="border p-2">{s.item === labels.donation ? labels.donation : labels.sale}</td>
                    <td className="border p-2">{s.item}</td>
                    <td className="border p-2">{s.amount}</td>
                    <td className="border p-2">{s.quantity}</td>
                    <td className="border p-2">{s.buyer_name || labels.anon}</td>
                    <td className="border p-2">{s.buyer_email || labels.anon}</td>
                    <td className="border p-2">{s.sale_date}</td>
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
