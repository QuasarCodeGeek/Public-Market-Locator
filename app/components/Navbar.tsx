'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Navbar() {
    const [user, setUser] = useState<null | { id: string }>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return
            setUser(user)

            if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            if (cancelled) return
            setRole(profile?.role ?? null)
            }

            if (cancelled) return
            setLoading(false)
        }

        init()
        return () => { cancelled = true }
    }, [])

    async function handleLogout() {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (loading) return null

    const navLinks = (
        <>
        {!user ? (
            <>
            <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                Sign in
            </Link>
            <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                Register
            </Link>
            </>
        ) : (
            <>
            {role === 'admin' && (
                <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                Admin
                </Link>
            )}
            <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                My Store
            </Link>
            <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                Map
            </Link>
            <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-600 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
            >
                Logout
            </button>
            </>
        )}
        </>
    )

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">

            <Link href="/" className="text-sm font-medium text-gray-900">
            🏪 Public Market
            </Link>

            <div className="hidden sm:flex items-center gap-3">
            {navLinks}
            </div>

            <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden flex flex-col gap-1.5 p-1"
            >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>

        </div>

        {menuOpen && (
            <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
            {navLinks}
            </div>
        )}
        </nav>
    )
}