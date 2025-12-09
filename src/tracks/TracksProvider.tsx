import { useEffect, useState } from "react";
import { getAllTracks } from "../services/firebaseService";
import type { Track, TrackCategory } from "../types_interfaces/track";
import { TracksContext } from "./TracksContext";

interface Props {
  children: React.ReactNode;
}

export const TracksProvider: React.FC<Props> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | TrackCategory>(
    "all"
  );
  const [loading, setLoading] = useState(true);

  // Firebase에서 tracks 불러오기
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllTracks();
      if (data) {
        setTracks(data);
        setFilteredTracks(data);
        setLoading(false);
      } else {
        console.error("Failed to load tracks");
        setLoading(false);
      }
    }
    load();
  }, []);

  // 필터 변경 시 자동 재계산
  const setFilter = (filter: string) => {
    // 타입 안전하게 캐스팅
    const f = filter === "all" ? "all" : (filter as TrackCategory);

    setActiveFilter(f);

    if (f === "all") {
      setFilteredTracks(tracks);
      return;
    }

    const filtered = tracks.filter(t => String(t.category ?? "").includes(f));
    setFilteredTracks(filtered);
  };

  return (
    <TracksContext.Provider
      value={{
        tracks,
        filteredTracks,
        activeFilter,
        setFilter,
        loading,
      }}
    >
      {children}
    </TracksContext.Provider>
  );
};
