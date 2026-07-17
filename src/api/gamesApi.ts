import apiClient from './axios'
import type { GameResult, GameResultsRequest, SaveGameResultsRequest, CollectionProbs } from '@/types'

export const gamesApi = {
  /** POST /gamesresult/get — fetch results for given content ids + game */
  getResults: async (data: GameResultsRequest): Promise<GameResult[]> => {
    const res = await apiClient.post('/gamesresult/get', data)
    const raw = res.data.data
    // Server may return array [{contentid, probability}] or legacy object {"id": prob}
    if (Array.isArray(raw)) return raw as GameResult[]
    return Object.entries(raw as Record<string, number>).map(([id, probability]) => ({
      id: 0,
      userid: 0,
      contentid: Number(id),
      probability,
    }))
  },

  /** POST /gamesresult — save updated probabilities */
  saveResults: async (data: SaveGameResultsRequest): Promise<void> => {
    await apiClient.post('/gamesresult', data)
  },

  /** GET /gamesresult/collection/:id — all probabilities for every card in a collection */
  getCollectionProbs: async (collectionId: number): Promise<CollectionProbs> => {
    const res = await apiClient.get(`/gamesresult/collection/${collectionId}`)
    return (res.data.data ?? {}) as CollectionProbs
  },
}
