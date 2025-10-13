import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import { useLanguage } from "@/context/LanguageContext"

interface User {
  id: number
  name: string
  dni: string
  email: string
  phone?: string
  address?: string
}

export default function UsersPage() {
  const { lang } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<{ name: string; dni: string; email: string; phone?: string; address?: string }>({
    name: '',
    dni: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('users').select('*').order('id', { ascending: true })
    if (error) console.error('Error fetching users:', error)
    else {
      setUsers(data || [])
      setFilteredUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (search.trim() === '') setFilteredUsers(users)
    else {
      const term = search.toLowerCase()
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name?.toLowerCase().includes(term) ||
            u.dni?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.phone?.toLowerCase().includes(term) ||
            u.address?.toLowerCase().includes(term)
        )
      )
    }
  }, [search, users])

  const handleEdit = (user: User) => setEditingUser(user)

  const handleSave = async (user: User) => {
    const { error } = await supabase.from('users').update(user).eq('id', user.id)
    if (error) alert((lang === "en" ? 'Error updating user: ' : 'Error actualizando usuario: ') + error.message)
    else {
      setEditingUser(null)
      fetchUsers()
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('users').insert([newUser])
    if (error) alert((lang === "en" ? 'Error adding user: ' : 'Error agregando usuario: ') + error.message)
    else {
      setNewUser({ name: '', dni: '', email: '' })
      fetchUsers()
    }
  }

  // Labels for both languages
  const labels = {
    title: lang === "en" ? "Users" : "Usuarios",
    searchPlaceholder: lang === "en"
      ? "Search by name, email, dni, phone or address"
      : "Buscar por nombre, email, DNI, teléfono o dirección",
    addUser: lang === "en" ? "Add User" : "Agregar Usuario",
    name: lang === "en" ? "Name" : "Nombre",
    dni: "DNI",
    email: "Email",
    phone: lang === "en" ? "Phone" : "Teléfono",
    address: lang === "en" ? "Address" : "Dirección",
    actions: lang === "en" ? "Actions" : "Acciones",
    loading: lang === "en" ? "Loading..." : "Cargando...",
    noUsers: lang === "en" ? "No users found" : "No se encontraron usuarios",
    save: lang === "en" ? "Save" : "Guardar",
    cancel: lang === "en" ? "Cancel" : "Cancelar",
    edit: lang === "en" ? "Edit" : "Editar",
    viewRentals: lang === "en" ? "View Rentals" : "Ver alquileres",
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">{labels.title}</h1>

        {/* Search */}
        <input
          type="text"
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 mb-4 w-full md:w-1/2"
        />

        {/* Add User Form */}
        <form onSubmit={handleAddUser} className="mb-8 p-4 bg-white shadow-md rounded-lg flex flex-wrap gap-2">
          <input
            type="text"
            placeholder={labels.name}
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
            className="border border-gray-300 px-3 py-2 rounded-md flex-1"
          />
          <input
            type="text"
            placeholder={labels.dni}
            value={newUser.dni}
            onChange={(e) => setNewUser({ ...newUser, dni: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded-md flex-1"
          />
          <input
            type="email"
            placeholder={labels.email}
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="border border-gray-300 px-3 py-2 rounded-md flex-1"
          />
          <input
            type="text"
            placeholder={labels.phone}
            value={newUser.phone || ""}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded-md flex-1"
          />
          <input
            type="text"
            placeholder={labels.address}
            value={newUser.address || ""}
            onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded-md flex-1"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            {labels.addUser}
          </button>
        </form>

        {/* Users Table (desktop only) */}
        <div className="hidden md:block overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">{labels.name}</th>
                <th className="p-3 border">{labels.dni}</th>
                <th className="p-3 border">{labels.email}</th>
                <th className="p-3 border">{labels.phone}</th>
                <th className="p-3 border">{labels.address}</th>
                <th className="p-3 border">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">{labels.loading}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">{labels.noUsers}</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="border p-2 text-center">{user.id}</td>
                    <td className="border p-2">
                      <a
                        href={`/rentals?user=${user.id}`}
                        className="text-blue-600 underline"
                        title={labels.viewRentals}
                      >
                        {editingUser?.id === user.id ? (
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, name: e.target.value })
                            }
                            className="border px-2 py-1 rounded w-full"
                          />
                        ) : (
                          user.name
                        )}
                      </a>
                    </td>
                    <td className="border p-2">{user.dni}</td>
                    <td className="border p-2">
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, email: e.target.value })
                          }
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="border p-2">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.phone || ""}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, phone: e.target.value })
                          }
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        user.phone || "-"
                      )}
                    </td>
                    <td className="border p-2">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.address || ""}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, address: e.target.value })
                          }
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        user.address || "-"
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {editingUser?.id === user.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(editingUser)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            {labels.save}
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                          >
                            {labels.cancel}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          {labels.edit}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (mobile only) */}
        <div className="block md:hidden">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-white rounded shadow p-4 mb-4 border">
              <div className="font-bold text-lg mb-2">
                <a
                  href={`/rentals?user=${u.id}`}
                  className="text-blue-600 underline"
                  title={labels.viewRentals}
                >
                  {u.name}
                </a>
              </div>
              {editingUser?.id === u.id ? (
                <>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="border px-2 py-1 rounded w-full mb-1"
                    placeholder={labels.name}
                  />
                  <input
                    type="text"
                    value={editingUser.dni}
                    onChange={e => setEditingUser({ ...editingUser, dni: e.target.value })}
                    className="border px-2 py-1 rounded w-full mb-1"
                    placeholder={labels.dni}
                  />
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="border px-2 py-1 rounded w-full mb-1"
                    placeholder={labels.email}
                  />
                  <input
                    type="text"
                    value={editingUser.phone || ""}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="border px-2 py-1 rounded w-full mb-1"
                    placeholder={labels.phone}
                  />
                  <input
                    type="text"
                    value={editingUser.address || ""}
                    onChange={e => setEditingUser({ ...editingUser, address: e.target.value })}
                    className="border px-2 py-1 rounded w-full mb-1"
                    placeholder={labels.address}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSave(editingUser)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      {labels.save}
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                    >
                      {labels.cancel}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm mb-1">
                    <b>DNI:</b> {u.dni}
                  </div>
                  <div className="text-sm mb-1">
                    <b>Email:</b> {u.email}
                  </div>
                  <div className="text-sm mb-1">
                    <b>{labels.phone}:</b> {u.phone || "-"}
                  </div>
                  <div className="text-sm mb-1">
                    <b>{labels.address}:</b> {u.address || "-"}
                  </div>
                  <button
                    onClick={() => handleEdit(u)}
                    className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    {labels.edit}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
