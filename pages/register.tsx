import { useState } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/context/LanguageContext";
import PhoneInput from "react-phone-input-2";
import es from "react-phone-input-2/lang/es.json";
import "react-phone-input-2/lib/style.css";

// Helper function for DNI/NIE/Passport validation
function isValidId(id: string) {
  const dniRegex = /^\d{8}[A-Za-z]$/;
  const nieRegex = /^[XYZ]\d{7}[A-Za-z]$/;
  const passportRegex = /^[A-Za-z0-9]{3,9}$/;
  return dniRegex.test(id) || nieRegex.test(id) || passportRegex.test(id);
}

export default function RegisterPage() {
  const { lang } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const labels = {
    title: lang === "en" ? "Bike Rental Application" : "Solicitud de Alquiler de Bicicleta",
    firstName: lang === "en" ? "First Name" : "Nombre",
    lastName: lang === "en" ? "Last Name" : "Apellido",
    secondLastName: lang === "en" ? "Second Last Name (optional)" : "Segundo Apellido (opcional)",
    dni: lang === "en" ? "DNI / NIE / Passport" : "DNI / NIE / Pasaporte",
    email: "Email",
    phone: lang === "en" ? "Phone Number" : "Teléfono",
    address: lang === "en" ? "Address" : "Dirección",
    submit: lang === "en" ? "Submit Application" : "Enviar Solicitud",
    submitting: lang === "en" ? "Submitting..." : "Enviando...",
    success: lang === "en"
      ? "Application submitted! Await approval."
      : "¡Solicitud enviada! Espere aprobación.",
    error: lang === "en" ? "Error: " : "Error: ",
    invalidId: lang === "en"
      ? "Please enter a valid DNI, NIE, or Passport number."
      : "Por favor, introduce un DNI, NIE o número de pasaporte válido.",
    invalidPhone: lang === "en"
      ? "Please enter a valid phone number."
      : "Por favor, introduce un número de teléfono válido.",
  };

  // Combine names into a full name
  const fullName = [firstName, lastName, secondLastName].filter(Boolean).join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Validate DNI/NIE/Passport
    if (!isValidId(dni.trim())) {
      setMessage(labels.invalidId);
      setSubmitting(false);
      return;
    }

    // Validate phone number (basic: must be at least 8 digits after country code)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      setMessage(labels.invalidPhone);
      setSubmitting(false);
      return;
    }

    // Send to pending_users table via API route
    const res = await fetch("/api/pending-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        second_last_name: secondLastName,
        dni,
        email,
        phone,
        address,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(labels.error + (data.error || "Unknown error"));
    } else {
      setMessage(labels.success);
      setFirstName("");
      setLastName("");
      setSecondLastName("");
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
            placeholder={labels.firstName}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder={labels.lastName}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder={labels.secondLastName}
            value={secondLastName}
            onChange={e => setSecondLastName(e.target.value)}
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
          <PhoneInput
            country={"es"}
            value={phone}
            onChange={setPhone}
            inputProps={{
              required: true,
              name: "phone",
              placeholder: labels.phone,
              className: "border px-3 py-2 rounded w-full"
            }}
            containerClass="w-full"
            inputStyle={{
              width: "100%",
              paddingLeft: "48px", // Increase left padding for flag
              boxSizing: "border-box"
            }}
            enableSearch
            localization={lang === "es" ? es : undefined}
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