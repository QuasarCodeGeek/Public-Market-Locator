'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

type Profile = {
    id: string
    full_name: string
    role: string
}

type Store = {
    id: string
    name: string
    description: string
    category: string
    type: 'goods' | 'service'
    tin_number: string
    operating_hours: string
    is_active: boolean
    stall_id: string | null
}

export default function DashboardPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [store, setStore] = useState<Store | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [type, setType] = useState<'goods' | 'service'>('goods')
    const [tin, setTin] = useState('')
    const [hours, setHours] = useState('')

    useEffect(() => {
        let cancelled = false

        async function init() {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) { router.push('/login'); return }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (cancelled) return
        setProfile(profileData)

        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', user.id)
            .single()

        if (cancelled) return
        if (storeData) {
            setStore(storeData)
            setName(storeData.name ?? '')
            setDescription(storeData.description ?? '')
            setCategory(storeData.category ?? '')
            setType(storeData.type ?? 'goods')
            setTin(storeData.tin_number ?? '')
            setHours(storeData.operating_hours ?? '')
        }

        if (cancelled) return
        setLoading(false)
        }

        init()
        return () => { cancelled = true }
    }, [router])

    async function handleSave() {
        setSaving(true)
        setError('')
        setSuccess(false)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const payload = {
        name,
        description,
        category,
        type,
        tin_number: tin,
        operating_hours: hours,
        owner_id: user.id,
        }

        let saveError

        if (store) {
        const { error: updateError } = await supabase
            .from('stores')
            .update(payload)
            .eq('id', store.id)
        saveError = updateError
        } else {
        const { error: insertError } = await supabase
            .from('stores')
            .insert(payload)
        saveError = insertError
        }

        if (saveError) {
        setError(saveError.message)
        } else {
        setSuccess(true)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
            const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', currentUser.id)
            .single()
            if (storeData) setStore(storeData)
        }
        }

        setSaving(false)
    }

    if (loading) return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
        </main>
    )

    return (
        <main className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-8">

            <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-lg font-medium text-gray-900">
                {profile?.full_name ?? 'Store Owner'}
                </h1>
                <p className="text-sm text-gray-500">Store Owner Dashboard</p>
            </div>
            </div>

            {!store?.stall_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-amber-700">
                Your store has not been assigned to a stall yet. Please wait for the admin to assign your stall location.
                </p>
            </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">
                {store ? 'Edit Store Info' : 'Create Your Store'}
            </h2>

            <div className="flex flex-col gap-4">

                <div>
                <label className="text-xs text-gray-500 mb-1 block">Store Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aling Nena Dry Goods"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                </div>

                <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your store..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                />
                </div>

                <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Dry Goods, Seafood, Tailoring..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                </div>

                <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <div className="flex gap-2">
                    {(['goods', 'service'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-all capitalize ${
                        type === t
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {t}
                    </button>
                    ))}
                </div>
                </div>

                <div>
                <label className="text-xs text-gray-500 mb-1 block">TIN Number</label>
                <input
                    type="text"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    placeholder="000-000-000-000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                </div>

                <div>
                <label className="text-xs text-gray-500 mb-1 block">Operating Hours</label>
                <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 6am–6pm"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {success && <p className="text-xs text-green-500">Store saved successfully! ✅</p>}

                <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white text-sm rounded-lg py-2 mt-1 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                {saving ? 'Saving...' : store ? 'Save Changes' : 'Create Store'}
                </button>

            </div>
            </div>

        </div>
        </main>
    )
}