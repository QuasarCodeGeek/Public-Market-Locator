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
    store: Store | null
}

type Props = {
    stall: Stall | null
}

export default function StallPanel({ stall }: Props) {
    if (!stall || !stall.store) {
        return (
        <div className="mt-4 p-4 border border-gray-200 rounded-xl text-sm text-gray-400">
            Click a stall to view store details.
        </div>
        )
    }

    const { store } = stall

    return (
        <div className="mt-4 p-4 border border-gray-200 rounded-xl">
        <h2 className="text-base font-medium text-gray-900">{store.name}</h2>
        <p className="text-sm text-gray-500 mb-2">Block {stall.block}</p>
        <div className="flex gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
            {store.category}
            </span>
            <span className="text-xs px-2 py-1 rounded-md bg-teal-100 text-teal-800">
            {store.type === 'service' ? 'Service' : 'Goods'}
            </span>
        </div>
        <p className="text-sm text-gray-600">{store.description}</p>
        <p className="text-xs text-gray-400 mt-2">Hours: {store.operating_hours}</p>
        </div>
    )
}