import { apiClient } from "@/lib/api-client"
import type { SearchResultItem } from "@/types"

export const searchApi = {
  semantic: (q: string, subject?: string) =>
    apiClient.get<{ query: string; mode: string; results: SearchResultItem[] }>("/search/semantic", {
      params: { q, subject },
    }),
  keyword: (q: string, subject?: string) =>
    apiClient.get<{ query: string; mode: string; results: SearchResultItem[] }>("/search/keyword", {
      params: { q, subject },
    }),
}
