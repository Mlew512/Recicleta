import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface Membership {
  id: number;
  name: string;
  dni: string;
  email: string;
  start_date: string;
  end_date: string;
  cost: number;
}

export default function MembershipsPage() {
  const { lang } = useLanguage();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member form states
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      setMemberships([]);
    } else {
      setMemberships(data || []);
    }
    setLoading(false);
  };

  const labels = {
    title: lang === "en" ? "Memberships" : "Membresías",
    name: lang === "en" ? "Name" : "Nombre",
    dni: "DNI",
    email: "Email",
    start: lang === "en" ? "Start Date" : "Fecha Inicio",
    end: lang === "en" ? "Expiration" : "Vencimiento",
    cost: lang === "en" ? "Cost (€)" : "Costo (€)",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    noMembers: lang === "en" ? "No memberships found." : "No se encontraron membresías.",
    addMember: lang === "en" ? "Add Member" : "Agregar Miembro",
    addMembership: lang === "en" ? "Add Membership" : "Agregar Membresía",
    success: lang === "en"
      ? "Membership added! Valid for one year. Cost: €2."
      : "¡Membresía agregada! Válida por un año. Costo: €2.",
    error: lang === "en"
      ? "Error adding membership: "
      : "Error agregando membresía: ",
    info: lang === "en"
      ? "Membership is valid for one year and costs €2."
      : "La membresía es válida por un año y cuesta €2.",
    search: lang === "en"
      ? "Search by name, email, or DNI..."
      : "Buscar por nombre, email o DNI...",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage(null);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const { error } = await supabase.from("memberships").insert([
      {
        name,
        dni,
        email,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        cost: 2,
      },
    ]);

    if (error) {
      setMessage(labels.error + error.message);
    } else {
      setMessage(labels.success);
      setName("");
      setDni("");
      setEmail("");
      fetchMemberships();
    }
    setAdding(false);
  };

  // Filter memberships by search (name, email, dni)
  const filteredMemberships = memberships.filter(m =>
    (m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.dni?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto bg-white p-8 rounded shadow mt-8">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>
        <p className="mb-4 text-gray-700">{labels.info}</p>
        {/* Add Member Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded">
          <input
            type="text"
            placeholder={labels.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder={labels.dni}
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <input
            type="email"
            placeholder={labels.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {adding ? (lang === "en" ? "Adding..." : "Agregando...") : labels.addMembership}
          </button>
        </form>
        {message && (
          <div className="mb-6 text-center text-green-700 font-semibold">{message}</div>
        )}
        {/* Search Bar */}
        <input
          type="text"
          placeholder={labels.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 mb-4 w-full md:w-1/2"
        />
        {/* Memberships Table */}
        {loading ? (
          <p>{labels.loading}</p>
        ) : filteredMemberships.length === 0 ? (
          <p className="text-gray-500">{labels.noMembers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-2 border">{labels.name}</th>
                  <th className="p-2 border">{labels.dni}</th>
                  <th className="p-2 border">{labels.email}</th>
                  <th className="p-2 border">{labels.end}</th>
                  <th className="p-2 border">{labels.cost}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-100">
                    <td className="border p-2">{m.name}</td>
                    <td className="border p-2">{m.dni}</td>
                    <td className="border p-2">{m.email}</td>
                    <td className="border p-2">{m.end_date}</td>
                    <td className="border p-2">{m.cost}</td>
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