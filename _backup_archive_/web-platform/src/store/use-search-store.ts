import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchResult } from "@/types";

interface SearchState {
  query: string;
  results: SearchResult[];
  selectedResult: SearchResult | null;
  isSearching: boolean;
  recentSearches: string[];

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  selectResult: (result: SearchResult | null) => void;
  setSearching: (searching: boolean) => void;
  addRecentSearch: (query: string) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: "",
      results: [],
      selectedResult: null,
      isSearching: false,
      recentSearches: [],

      setQuery: (query) => set({ query }),
      setResults: (results) => set({ results }),
      selectResult: (result) => set({ selectedResult: result }),
      setSearching: (searching) => set({ isSearching: searching }),
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 8),
        })),
      clearResults: () => set({ results: [], selectedResult: null }),
    }),
    {
      name: "campus-guide-search",
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
