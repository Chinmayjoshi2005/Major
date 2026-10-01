"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Compass, Eye } from "lucide-react";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { NeoCard, NeoInput } from "@/components/neo-brutal/neo-card";
import {
  useAppStore,
  useSearchStore,
  useWorldStore,
  useNavigationStore,
  usePlayerStore,
} from "@/store";
import type { SearchResult } from "@/types";
import { DEFAULT_SPAWN } from "@/lib/campus/room-mesh-map";

export function SearchPanel() {
  const [localQuery, setLocalQuery] = useState("");
  const { query, results, isSearching, setQuery, setResults, setSearching, addRecentSearch, selectResult } =
    useSearchStore();
  const setMode = useAppStore((s) => s.setMode);
  const focusTarget = useWorldStore((s) => s.focusTarget);
  const setRoute = useNavigationStore((s) => s.setRoute);
  const startNavigation = useNavigationStore((s) => s.startNavigation);
  const setSpawnPoint = usePlayerStore((s) => s.setSpawnPoint);

  const performSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data.results);
        }
      } finally {
        setSearching(false);
      }
    },
    [setResults, setSearching]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(localQuery);
      performSearch(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setQuery, performSearch]);

  const handleViewLocation = (result: SearchResult) => {
    if (!result.position) return;
    selectResult(result);
    addRecentSearch(query);
    focusTarget({
      position: result.position,
      entityType: result.type === "department" ? "department" : result.type === "faculty" ? "faculty" : "room",
      entityId: result.id,
      meshNames: result.meshNames,
      label: result.title,
    });
  };

  const handleExplore = (result: SearchResult) => {
    handleViewLocation(result);
    setMode("explore");
  };

  const handleNavigate = async (result: SearchResult) => {
    selectResult(result);
    setMode("game");
    setSpawnPoint(DEFAULT_SPAWN);

    const to =
      result.type === "faculty"
        ? { type: "faculty" as const, id: result.id }
        : result.type === "room" || result.type === "lab" || result.type === "office"
          ? { type: "room" as const, roomNumber: result.roomNumber! }
          : { type: "position" as const, ...result.position! };

    const res = await fetch("/api/navigation/path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { type: "node", nodeId: "N-ENT-01" },
        to,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setRoute(json.data);
      startNavigation();
    }
  };

  return (
    <NeoCard className="campus-search-panel w-full max-w-md">
      <div className="campus-search-heading">
        <Search className="h-5 w-5" aria-hidden="true" />
        <div>
          <p className="campus-search-index">Directory / 01</p>
          <h2>Where are you going?</h2>
        </div>
      </div>

      <NeoInput
        aria-label="Search for faculty, rooms, or departments"
        placeholder="Faculty, room, department..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        autoFocus
      />

      <div className="campus-search-results mt-3 max-h-80 space-y-2 overflow-y-auto" aria-live="polite">
        <AnimatePresence>
          {isSearching && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="campus-searching text-sm"
            >
              Searching...
            </motion.p>
          )}
          {results.map((result) => (
            <motion.div
              key={`${result.type}-${result.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="campus-search-result p-3"
            >
              <p className="campus-result-title">{result.title}</p>
              <p className="campus-result-subtitle text-sm">{result.subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.position && (
                  <>
                    <NeoButton
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewLocation(result)}
                    >
                      <Eye className="mr-1 inline h-4 w-4" />
                      View
                    </NeoButton>
                    <NeoButton size="sm" onClick={() => handleExplore(result)}>
                      <MapPin className="mr-1 inline h-4 w-4" />
                      Explore
                    </NeoButton>
                    <NeoButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleNavigate(result)}
                    >
                      <Compass className="mr-1 inline h-4 w-4" />
                      Navigate
                    </NeoButton>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NeoCard>
  );
}
