'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import MarketMap from './components/MarketMap'
import StallPanel from './components/StallPanel'
import FloorSwitcher from './components/FloorSwitcher'

type Store = {
  name: string
  category: string
  description: string
  operating_hours: string
  type: 'goods' | 'service'
}

type Stall = {
  id: string
  block: string
  row_num: number
  col_num: number
  floor: number
  store: Store | null
}

type StallRow = {
  id: string
  row_num: number
  col_num: number
  floor: number
  blocks: { name: string }[] | null
}

type StoreRow = {
  stall_id: string | null
  name: string
  category: string
  description: string
  operating_hours: string
  type: 'goods' | 'service'
}

async function loadStalls(floor: number): Promise<Stall[]> {
  const { data: stallsData } = await supabase
    .from('stalls')
    .select('id, row_num, col_num, floor, blocks(name)')
    .eq('floor', floor)

  const { data: storesData } = await supabase
    .from('stores')
    .select('stall_id, name, category, description, operating_hours, type')
    .eq('is_active', true)

  const storesByStallId: Record<string, StoreRow> = {}
  storesData?.forEach((store: StoreRow) => {
    if (store.stall_id) storesByStallId[store.stall_id] = store
  })

  return (stallsData ?? []).map((s: StallRow) => ({
    id: s.id,
    row_num: s.row_num,
    col_num: s.col_num,
    floor: s.floor,
    block: Array.isArray(s.blocks)
      ? s.blocks[0]?.name?.replace('Block ', '') ?? 'A'
      : (s.blocks as unknown as { name: string } | null)?.name?.replace('Block ', '') ?? 'A',
    store: storesByStallId[s.id] ?? null,
  }))
}

export default function Home() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setSelectedStall(null)
      const data = await loadStalls(currentFloor)
      if (cancelled) return
      setStalls(data)
      setLoading(false)
    }

    init()

    const channel = supabase
      .channel('market-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, async () => {
        const data = await loadStalls(currentFloor)
        if (!cancelled) setStalls(data)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, async () => {
        const data = await loadStalls(currentFloor)
        if (!cancelled) setStalls(data)
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [currentFloor])

  const query = search.toLowerCase().trim()
  const isSearching = query !== ''
  const searchResults = isSearching
    ? stalls
        .filter(s => s.store !== null)
        .filter(s =>
          s.store!.name.toLowerCase().includes(query) ||
          s.store!.category.toLowerCase().includes(query) ||
          s.store!.description.toLowerCase().includes(query)
        )
    : []

  function handleSelectSearchResult(stall: Stall) {
    setSearch('')
    setCurrentFloor(stall.floor)
    setSelectedStall(stall)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">

        <h1 className="text-xl font-medium text-gray-900 mb-1">
          Store Locator Map
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Find stores and services in the market
        </p>

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores, categories..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          )}

          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-sm z-10 overflow-hidden">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No stores found for &quot;{search}&quot;
                </p>
              ) : (
                searchResults.map((stall) => (
                  <button
                    key={stall.id}
                    onClick={() => handleSelectSearchResult(stall)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {stall.store!.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stall.store!.category} · Block {stall.block} · Floor {stall.floor}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <FloorSwitcher
          currentFloor={currentFloor}
          onChange={setCurrentFloor}
        />

        {loading ? (
          <div className="text-sm text-gray-400 text-center py-12">
            Loading map...
          </div>
        ) : (
          <MarketMap
            stalls={stalls}
            onSelectStall={setSelectedStall}
            selectedStallId={selectedStall?.id ?? null}
          />
        )}

        <StallPanel stall={selectedStall} />

      </div>
    </main>
  )
}