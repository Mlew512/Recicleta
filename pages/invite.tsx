import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";

export default function InvitePage() {
  const router = useRouter();
  const lang = router.locale === "es" ? "es" : "en";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const labels = {
    title: lang === "en" ? "Set Your Password" : "Establece tu contraseña",
    email: lang === "en" ? "Email" : "Correo electrónico",
    noEmail: lang === "en" ? "No email found." : "No se encontró correo.",
    password: lang === "en" ? "New Password" : "Nueva contraseña",
    confirm: lang === "en" ? "Confirm Password" : "Confirmar contraseña",
    setPassword: lang === "en" ? "Set Password" : "Establecer contraseña",
    mismatch: lang === "en" ? "Passwords do not match." : "Las contraseñas no coinciden.",
    success: lang === "en" ? "Password set! Redirecting..." : "¡Contraseña establecida! Redirigiendo...",
  };

  useEffect(() => {
    // Get email from session
    const getEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email || "");
    };
    getEmail();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage(labels.mismatch);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(labels.success);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{labels.title}</h1>
        <div className="mb-4 text-center text-gray-700 font-semibold">
          {email ? `${labels.email}: ${email}` : labels.noEmail}
        </div>
        <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={labels.password}
            className="border px-3 py-2 rounded"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder={labels.confirm}
            className="border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {labels.setPassword}
          </button>
        </form>
        {message && <div className="mt-4 text-center text-green-700 font-semibold">{message}</div>}
      </div>
    </Layout>
  );
}