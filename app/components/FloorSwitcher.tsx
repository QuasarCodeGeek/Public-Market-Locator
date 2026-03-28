type Props = {
    currentFloor: number
    onChange: (floor: number) => void
}

export default function FloorSwitcher({ currentFloor, onChange }: Props) {
    return (
        <div className="flex gap-2 mb-4">
        {[1, 2].map((floor) => (
            <button
            key={floor}
            onClick={() => onChange(floor)}
            className={`px-4 py-1.5 text-sm rounded-md border transition-all ${
                currentFloor === floor
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            >
            Floor {floor}
            </button>
        ))}
        </div>
    )
}