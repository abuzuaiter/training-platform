'use client'
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Training Platform</h1>
            <p className="text-sm text-gray-500">Super Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">Super Admin</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 font-medium transition">Sign out</button>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-500 mb-8">Manage organizations, users, and courses</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/organizations"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">🏢</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Organizations</h3><p className="text-sm text-gray-500">Add and manage organizations</p></div></Link>
          <Link href="/users"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">👥</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Users</h3><p className="text-sm text-gray-500">View and manage all users</p></div></Link>
          <Link href="/invitations"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">✉️</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Invitations</h3><p className="text-sm text-gray-500">Send and manage invitations</p></div></Link>
          <Link href="/courses"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">📚</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Courses</h3><p className="text-sm text-gray-500">Create and manage courses</p></div></Link>
          <Link href="/subscriptions"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">💳</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Subscriptions</h3><p className="text-sm text-gray-500">Track and manage subscriptions</p></div></Link>
          <Link href="/customers">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🧑‍🤝‍🧑</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">All Customers</h3>
              <p className="text-sm text-gray-500">View all customers across organizations</p>
            </div>
          </Link>
          <Link href="/plans"><div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"><div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4"><span className="text-2xl">📦</span></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Plans</h3><p className="text-sm text-gray-500">Manage organization plans</p></div></Link>
        </div>
      </div>
    </div>
  );
}
