import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

interface PendingUser {
  id: number;
  name: string;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export default function PendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PendingUser>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const lang = router.locale === "es" ? "es" : "en";

  const labels = {
    title: lang === "en" ? "Pending Users" : "Usuarios pendientes",
    name: lang === "en" ? "Name" : "Nombre",
    dni: "DNI",
    email: "Email",
    phone: lang === "en" ? "Phone" : "Teléfono",
    address: lang === "en" ? "Address" : "Dirección",
    created: lang === "en" ? "Submitted" : "Enviado",
    edit: lang === "en" ? "Edit" : "Editar",
    save: lang === "en" ? "Save" : "Guardar",
    cancel: lang === "en" ? "Cancel" : "Cancelar",
    approve: lang === "en" ? "Approve" : "Aprobar",
    reject: lang === "en" ? "Reject" : "Rechazar",
    noPending: lang === "en" ? "No pending users." : "No hay usuarios pendientes.",
    error: lang === "en" ? "Error:" : "Error:",
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  async function fetchPendingUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("pending_users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setPendingUsers(data || []);
    setLoading(false);
  }

  async function handleApprove(user: PendingUser) {
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase
      .from("users")
      .insert([{
        name: user.name,
        dni: user.dni,
        email: user.email,
        phone: user.phone,
        address: user.address
      }]);
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    await supabase.from("pending_users").delete().eq("id", user.id);
    await fetchPendingUsers();
  }

  async function handleReject(user: PendingUser) {
    setLoading(true);
    setError(null);
    await supabase.from("pending_users").delete().eq("id", user.id);
    await fetchPendingUsers();
  }

  function startEdit(user: PendingUser) {
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      dni: user.dni,
      email: user.email,
      phone: user.phone,
      address: user.address
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(user: PendingUser) {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("pending_users")
      .update({
        name: editForm.name,
        dni: editForm.dni,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address
      })
      .eq("id", user.id);
    if (updateError) setError(updateError.message);
    setEditingId(null);
    setEditForm({});
    await fetchPendingUsers();
    setLoading(false);
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-2 md:p-6">
        <h1 className="text-2xl font-bold mb-6">{labels.title}</h1>
        {error && <div className="text-red-600 mb-4">{labels.error} {error}</div>}
        {loading ? (
          <div className="text-gray-600">{lang === "en" ? "Loading..." : "Cargando..."}</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-gray-600">{labels.noPending}</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white shadow rounded-lg">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="p-2 border">{labels.name}</th>
                    <th className="p-2 border">{labels.dni}</th>
                    <th className="p-2 border">{labels.email}</th>
                    <th className="p-2 border">{labels.phone}</th>
                    <th className="p-2 border">{labels.address}</th>
                    <th className="p-2 border">{labels.created}</th>
                    <th className="p-2 border">{lang === "en" ? "Actions" : "Acciones"}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100">
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editForm.name || ""}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editForm.dni || ""}
                            onChange={e => setEditForm({ ...editForm, dni: e.target.value })}
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.dni
                        )}
                      </td>
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editForm.phone || ""}
                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.phone || "-"
                        )}
                      </td>
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editForm.address || ""}
                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.address || "-"
                        )}
                      </td>
                      <td className="border p-2">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="border p-2">
                        {editingId === user.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(user)}
                              className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              {labels.save}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-400 text-white px-3 py-1 rounded"
                            >
                              {labels.cancel}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded"
                            >
                              {labels.edit}
                            </button>
                            <button
                              onClick={() => handleApprove(user)}
                              className="bg-green-600 text-white px-3 py-1 rounded"
                            >
                              {labels.approve}
                            </button>
                            <button
                              onClick={() => handleReject(user)}
                              className="bg-red-600 text-white px-3 py-1 rounded"
                            >
                              {labels.reject}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden">
              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-white rounded shadow p-4 mb-4 border">
                  <div className="font-bold text-lg mb-2">{user.name}</div>
                  <div className="text-sm mb-1"><b>{labels.dni}:</b> {user.dni}</div>
                  <div className="text-sm mb-1"><b>{labels.email}:</b> {user.email}</div>
                  <div className="text-sm mb-1"><b>{labels.phone}:</b> {user.phone || "-"}</div>
                  <div className="text-sm mb-1"><b>{labels.address}:</b> {user.address || "-"}</div>
                  <div className="text-sm mb-1"><b>{labels.created}:</b> {new Date(user.created_at).toLocaleString()}</div>
                  {editingId === user.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                        placeholder={labels.name}
                      />
                      <input
                        type="text"
                        value={editForm.dni || ""}
                        onChange={e => setEditForm({ ...editForm, dni: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                        placeholder={labels.dni}
                      />
                      <input
                        type="email"
                        value={editForm.email || ""}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                        placeholder={labels.email}
                      />
                      <input
                        type="text"
                        value={editForm.phone || ""}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                        placeholder={labels.phone}
                      />
                      <input
                        type="text"
                        value={editForm.address || ""}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                        placeholder={labels.address}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(user)}
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          {labels.save}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {labels.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        {labels.edit}
                      </button>
                      <button
                        onClick={() => handleApprove(user)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        {labels.approve}
                      </button>
                      <button
                        onClick={() => handleReject(user)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        {labels.reject}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}