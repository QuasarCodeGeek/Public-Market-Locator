'use client'

import { useState } from 'react'

const STALL_W = 82
const STALL_H = 72
const GAP = 6

const blockOrigins: Record<string, { x: number; y: number }> = {
    A: { x: 10, y: 20 },
    B: { x: 240, y: 20 },
    C: { x: 10, y: 240 },
    D: { x: 240, y: 240 },
}

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

type Props = {
    stalls: Stall[]
    onSelectStall: (stall: Stall) => void
    selectedStallId: string | null
}

export default function MarketMap({ stalls, onSelectStall, selectedStallId }: Props) {
    return (
        <svg
        viewBox="0 0 420 420"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-lg mx-auto block"
        >
        {/* Pathways */}
        <rect x="190" y="0" width="40" height="420" fill="#D3D1C7" />
        <rect x="0" y="190" width="420" height="40" fill="#D3D1C7" />
        <rect x="190" y="190" width="40" height="40" fill="#B4B2A9" />
        <text x="210" y="214" textAnchor="middle" fontSize="12" fill="#888780">+</text>

        {/* Block Labels */}
        {['A', 'B', 'C', 'D'].map((block) => (
            <text
            key={block}
            x={blockOrigins[block].x + 82}
            y={blockOrigins[block].y + 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="#444441"
            >
            Block {block}
            </text>
        ))}

        {/* Stalls */}
        {stalls.map((stall) => {
            const origin = blockOrigins[stall.block]
            const x = origin.x + stall.col_num * (STALL_W + GAP)
            const y = origin.y + 14 + stall.row_num * (STALL_H + GAP)
            const isSelected = stall.id === selectedStallId
            const isOccupied = stall.store !== null

            return (
            <g
                key={stall.id}
                onClick={() => isOccupied && onSelectStall(stall)}
                style={{ cursor: isOccupied ? 'pointer' : 'default' }}
            >
                <rect
                x={x}
                y={y}
                width={STALL_W}
                height={STALL_H}
                rx={4}
                fill={isSelected ? '#185FA5' : isOccupied ? '#378ADD' : '#D3D1C7'}
                />
                <text
                x={x + STALL_W / 2}
                y={y + STALL_H / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill={isOccupied ? (isSelected ? '#B5D4F4' : '#E6F1FB') : '#888780'}
                pointerEvents="none"
                >
                {isOccupied && stall.store?.name
                    ? stall.store.name.split(' ').slice(0, 2).join(' ')
                    : isOccupied ? 'No Name' : 'Vacant'}
                </text>
            </g>
            )
        })}
        </svg>
    )
}