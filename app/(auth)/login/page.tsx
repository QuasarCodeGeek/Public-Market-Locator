'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
    // const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        setLoading(true)
        setError('')

        const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        })

        console.log('Login result:', data, error) // ← add this

        if (error) {
        setError(error.message)
        setLoading(false)
        return
        }

        // Check role then redirect
        const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

        if (profile?.role === 'admin') {
        window.location.href = '/admin'
        } else {
        window.location.href = '/dashboard'
        }

        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6">
            
            <h1 className="text-lg font-medium text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500 mb-6">Public Market Store Locator</p>

            <div className="flex flex-col gap-3">
            <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
            </div>

            <div>
                <label className="text-xs text-gray-500 mb-1 block">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white text-sm rounded-lg py-2 mt-1 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                {loading ? 'Signing in...' : 'Sign in'}
            </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
            No account yet?{' '}
            <Link href="/register" className="text-blue-500 hover:underline">
                Register here
            </Link>
            </p>

        </div>
        </main>
    )
}