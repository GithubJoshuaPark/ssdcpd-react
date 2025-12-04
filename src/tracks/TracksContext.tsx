import { createContext } from "react"
import type { Track } from "../types_interfaces/track"

export interface TracksContextValue {
    tracks: Track[]
    filteredTracks: Track[]
    activeFilter: string
    setFilter: (filter: string) => void
    loading: boolean
}

export const TracksContext = createContext<TracksContextValue>({
    tracks: [],
    filteredTracks: [],
    activeFilter: '',
    setFilter: () => {},
    loading: false
})

