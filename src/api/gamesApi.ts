import apiClient from './axios'
import type { GameResult, GameResultsRequest, SaveGameResultsRequest } from '@/types'

export const gamesApi = {
  /** POST /gamesresult/get — fetch results for given content ids + game */
  getResults: async (data: GameResultsRequest): Promise<GameResult[]> => {
    const res = await apiClient.post('/gamesresult/get', data)
    return res.data.data as GameResult[]
  },

  /** POST /gamesresult — save updated probabilities */
  saveResults: async (data: SaveGameResultsRequest): Promise<void> => {
    await apiClient.post('/gamesresult', data)
  },
}
