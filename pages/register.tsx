import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const { lang } = useLanguage();
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const labels = {
    title: lang === "en" ? "Bike Rental Registration" : "Registro para Alquiler de Bicicleta",
    name: lang === "en" ? "Full Name" : "Nombre Completo",
    dni: lang === "en" ? "DNI / ID" : "DNI / Identificación",
    email: "Email",
    phone: lang === "en" ? "Phone Number" : "Teléfono",
    address: lang === "en" ? "Address" : "Dirección",
    submit: lang === "en" ? "Register" : "Registrar",
    submitting: lang === "en" ? "Submitting..." : "Registrando...",
    success: lang === "en"
      ? "Registration successful! Thank you."
      : "¡Registro exitoso! Gracias.",
    error: lang === "en" ? "Error: " : "Error: ",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.from("users").insert([
      { name, dni, email, phone, address }
    ]);

    if (error) {
      setMessage(labels.error + error.message);
    } else {
      setMessage(labels.success);
      setName("");
      setDni("");
      setEmail("");
      setPhone("");
      setAddress("");
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-8 rounded shadow mt-8">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={labels.name}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder={labels.dni}
            value={dni}
            onChange={e => setDni(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="email"
            placeholder={labels.email}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="tel"
            placeholder={labels.phone}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder={labels.address}
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {submitting ? labels.submitting : labels.submit}
          </button>
        </form>
        {message && (
          <div className="mt-4 text-center text-green-700 font-semibold">{message}</div>
        )}
      </div>
    </Layout>
  );
}