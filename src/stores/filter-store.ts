import { create } from 'zustand'

interface FilterState {
  // Search
  search: string
  setSearch: (search: string) => void

  // Sorting
  sortBy: string
  sortOrder: 'asc' | 'desc'
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void

  // Filters
  filters: Record<string, string | string[]>
  setFilter: (key: string, value: string | string[]) => void
  removeFilter: (key: string) => void
  clearFilters: () => void

  // Pagination
  page: number
  limit: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void

  // Reset all
  reset: () => void
}

const initialState = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  filters: {},
  page: 1,
  limit: 20,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  // Search
  setSearch: (search) => set({ search, page: 1 }), // Reset page on search

  // Sorting
  setSort: (sortBy, sortOrder) =>
    set((state) => ({
      sortBy,
      sortOrder: sortOrder ?? state.sortOrder,
      page: 1, // Reset page on sort
    })),

  // Filters
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1, // Reset page on filter
    })),

  removeFilter: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.filters
      return { filters: rest, page: 1 }
    }),

  clearFilters: () => set({ filters: {}, search: '', page: 1 }),

  // Pagination
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),

  // Reset
  reset: () => set(initialState),
}))
