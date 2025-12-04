import { useContext } from "react"
import { TracksContext } from "./TracksContext"

export function useTracks() {
    return useContext(TracksContext)
}