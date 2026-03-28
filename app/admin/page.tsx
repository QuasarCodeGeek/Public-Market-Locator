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
    category: string
    type: string
    owner_id: string
    stall_id: string | null
    is_active: boolean
    profiles?: { full_name: string }
}

type Stall = {
    id: string
    row_num: number
    col_num: number
    floor: number
    blocks?: { name: string }
}

export default function AdminPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [stores, setStores] = useState<Store[]>([])
    const [stalls, setStalls] = useState<Stall[]>([])
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'stores' | 'users'>('stores')
    const [assigningStoreId, setAssigningStoreId] = useState<string | null>(null)
    const [selectedStallId, setSelectedStallId] = useState<string>('')
    const [saving, setSaving] = useState(false)
    
    const [storeSearch, setStoreSearch] = useState('')
    const [storeFilter, setStoreFilter] = useState<'all' | 'active' | 'inactive' | 'unassigned'>('all')
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'type'>('name')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [visibleCount, setVisibleCount] = useState(5)

    const [userSearch, setUserSearch] = useState('')
    const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'owner'>('all')
    const [userSortBy, setUserSortBy] = useState<'full_name' | 'role'>('full_name')
    const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('asc')
    const [visibleUserCount, setVisibleUserCount] = useState(5)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

        if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
        }

        setProfile(profileData)

        // Fetch all stores
        const { data: storesData } = await supabase
        .from('stores')
        .select('*')

        // Fetch all profiles separately
        const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')

        // Manually match owner name
        const storesWithOwner = (storesData ?? []).map((store) => ({
        ...store,
        profiles: profilesData?.find((p) => p.id === store.owner_id) ?? null
        }))

        // Fetch all vacant stalls
        const { data: stallsData } = await supabase
        .from('stalls')
        .select('*, blocks(name)')
        .order('floor')

        // Fetch all users
        const { data: usersData } = await supabase
        .from('profiles')
        .select('*')

        setStores(storesWithOwner)
        setStalls(stallsData ?? [])
        setUsers(usersData ?? [])
        setLoading(false)
    }

    async function handleAssignStall(storeId: string) {
        if (!selectedStallId) return
        setSaving(true)

        const { error } = await supabase
        .from('stores')
        .update({ stall_id: selectedStallId })
        .eq('id', storeId)

        if (!error) {
        setAssigningStoreId(null)
        setSelectedStallId('')
        fetchData()
        }

        setSaving(false)
    }

    async function handleToggleActive(store: Store) {
        await supabase
        .from('stores')
        .update({ is_active: !store.is_active })
        .eq('id', store.id)
        fetchData()
    }

    async function handleChangeRole(userId: string, newRole: string) {
        await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        fetchData()
    }

    // async function handleLogout() {
    //     await supabase.auth.signOut()
    //     window.location.href = '/login'
    // }

    function getStallLabel(stall: Stall) {
        return `${stall.blocks?.name} — Row ${stall.row_num + 1}, Col ${stall.col_num + 1} (Floor ${stall.floor})`
    }

    function getAssignedStallLabel(stall_id: string | null) {
        if (!stall_id) return null
        const stall = stalls.find(s => s.id === stall_id)
        if (!stall) return null
        return getStallLabel(stall)
    }

    const filteredStores = stores
    .filter((store) => {
        const matchesSearch =
        storeSearch.trim() === '' ? true :
        (store.name ?? '').toLowerCase().includes(storeSearch.toLowerCase()) ||
        (store.category ?? '').toLowerCase().includes(storeSearch.toLowerCase()) ||
        (store.profiles?.full_name ?? '').toLowerCase().includes(storeSearch.toLowerCase())

        const matchesFilter =
        storeFilter === 'all' ? true :
        storeFilter === 'active' ? store.is_active :
        storeFilter === 'inactive' ? !store.is_active :
        storeFilter === 'unassigned' ? !store.stall_id : true

        return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
        const aVal = (a[sortBy] ?? '').toLowerCase()
        const bVal = (b[sortBy] ?? '').toLowerCase()
        return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    const visibleStores = filteredStores.slice(0, visibleCount)

    const filteredUsers = users
    .filter((user) => {
        const matchesSearch = userSearch.trim() === '' ? true :
        (user.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase())

        const matchesFilter =
        userFilter === 'all' ? true : user.role === userFilter

        return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
        const aVal = (a[userSortBy] ?? '').toLowerCase()
        const bVal = (b[userSortBy] ?? '').toLowerCase()
        return userSortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    const visibleUsers = filteredUsers.slice(0, visibleUserCount)

    if (loading) return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
        </main>
    )

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-medium text-gray-900">Admin Panel</h1>
                    <p className="text-sm text-gray-500">Welcome, {profile?.full_name}</p>
                </div>
                {/* <button
                    onClick={handleLogout}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                    Logout
                </button> */}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                {(['stores', 'users'] as const).map((tab) => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-sm rounded-lg border transition-all capitalize ${
                        activeTab === tab
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    >
                    {tab === 'stores' ? `Stores (${stores.length})` : `Users (${users.length})`}
                    </button>
                ))}
                </div>

                {/* Stores Tab */}
                {activeTab === 'stores' && (
                    <div className="flex flex-col gap-3">

                        {/* Search */}
                        <div className="flex gap-2">
                        <input
                            type="text"
                            value={storeSearch}
                            onChange={(e) => {
                            setStoreSearch(e.target.value)
                            setVisibleCount(5)
                            }}
                            placeholder="Search stores..."
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                        />
                        <select
                            value={storeFilter}
                            onChange={(e) => {
                            setStoreFilter(e.target.value as any)
                            setVisibleCount(5)
                            }}
                            className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                        </div>

                        {/* Sort controls */}
                        <div className="flex gap-2 items-center">
                        <p className="text-xs text-gray-400">Sort by:</p>
                        {(['name', 'category', 'type'] as const).map((field) => (
                            <button
                            key={field}
                            onClick={() => {
                                if (sortBy === field) {
                                setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                                } else {
                                setSortBy(field)
                                setSortDir('asc')
                                }
                            }}
                            className={`text-xs px-2 py-1 rounded-lg border transition-all capitalize ${
                                sortBy === field
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                            >
                            {field} {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                            </button>
                        ))}
                        </div>

                        {/* Count */}
                        <p className="text-xs text-gray-400">
                        Showing {visibleStores.length} of {filteredStores.length} stores
                        </p>

                        {filteredStores.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No stores found.</p>
                        )}

                        {visibleStores.map((store) => (
                        <div key={store.id} className="bg-white border border-gray-200 rounded-xl p-4">
                            
                            <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{store.name}</p>
                                <p className="text-xs text-gray-400">{store.profiles?.full_name} · {store.category} | {store.type}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className={`text-xs px-2 py-0.5 rounded-md ${
                                store.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                {store.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                onClick={() => handleToggleActive(store)}
                                className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-0.5"
                                >
                                Toggle
                                </button>
                            </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 mt-2">
                            {store.stall_id ? (
                                <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    📍 {getAssignedStallLabel(store.stall_id)}
                                </p>
                                <button
                                    onClick={() => {
                                    setAssigningStoreId(store.id)
                                    setSelectedStallId('')
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                >
                                    Reassign
                                </button>
                                </div>
                            ) : (
                                <p className="text-xs text-amber-500 mb-2">⚠ No stall assigned</p>
                            )}

                            {assigningStoreId === store.id && (
                                <div className="flex gap-2 mt-2">
                                <select
                                    value={selectedStallId}
                                    onChange={(e) => setSelectedStallId(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                                >
                                    <option value="">Select a stall...</option>
                                    {stalls.map((stall) => (
                                    <option key={stall.id} value={stall.id}>
                                        {getStallLabel(stall)}
                                    </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleAssignStall(store.id)}
                                    disabled={saving || !selectedStallId}
                                    className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? '...' : 'Assign'}
                                </button>
                                <button
                                    onClick={() => setAssigningStoreId(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Cancel
                                </button>
                                </div>
                            )}

                            {!store.stall_id && assigningStoreId !== store.id && (
                                <button
                                onClick={() => {
                                    setAssigningStoreId(store.id)
                                    setSelectedStallId('')
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                                >
                                + Assign Stall
                                </button>
                            )}
                            </div>

                        </div>
                        ))}

                        {/* Load More */}
                        {visibleCount < filteredStores.length && (
                        <button
                            onClick={() => setVisibleCount(visibleCount + 5)}
                            className="w-full text-sm text-blue-500 hover:text-blue-700 border border-blue-200 rounded-xl py-2.5 hover:bg-blue-50 transition-colors"
                        >
                            Load more ({filteredStores.length - visibleCount} remaining)
                        </button>
                        )}

                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="flex flex-col gap-3">

                        {/* Search + Filter */}
                        <div className="flex gap-2">
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => {
                            setUserSearch(e.target.value)
                            setVisibleUserCount(5)
                            }}
                            placeholder="Search users..."
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                        />
                        <select
                            value={userFilter}
                            onChange={(e) => {
                            setUserFilter(e.target.value as any)
                            setVisibleUserCount(5)
                            }}
                            className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400"
                        >
                            <option value="all">All</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select>
                        </div>

                        {/* Sort controls */}
                        <div className="flex gap-2 items-center">
                        <p className="text-xs text-gray-400">Sort by:</p>
                        {(['full_name', 'role'] as const).map((field) => (
                            <button
                            key={field}
                            onClick={() => {
                                if (userSortBy === field) {
                                setUserSortDir(userSortDir === 'asc' ? 'desc' : 'asc')
                                } else {
                                setUserSortBy(field)
                                setUserSortDir('asc')
                                }
                            }}
                            className={`text-xs px-2 py-1 rounded-lg border transition-all capitalize ${
                                userSortBy === field
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                            >
                            {field === 'full_name' ? 'Name' : 'Role'} {userSortBy === field ? (userSortDir === 'asc' ? '↑' : '↓') : ''}
                            </button>
                        ))}
                        </div>

                        {/* Count */}
                        <p className="text-xs text-gray-400">
                        Showing {visibleUsers.length} of {filteredUsers.length} users
                        </p>

                        {filteredUsers.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No users found.</p>
                        )}

                        {visibleUsers.map((user) => (
                        <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                            <p className="text-sm font-medium text-gray-900">{user.full_name ?? 'No name'}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                            </div>
                            <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                            >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            </select>
                        </div>
                        ))}

                        {/* Load More */}
                        {visibleUserCount < filteredUsers.length && (
                        <button
                            onClick={() => setVisibleUserCount(visibleUserCount + 5)}
                            className="w-full text-sm text-blue-500 hover:text-blue-700 border border-blue-200 rounded-xl py-2.5 hover:bg-blue-50 transition-colors"
                        >
                            Load more ({filteredUsers.length - visibleUserCount} remaining)
                        </button>
                        )}

                    </div>
                )}

            </div>
        </main>
    )
}