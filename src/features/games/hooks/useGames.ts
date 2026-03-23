import { useMutation } from '@tanstack/react-query'
import { gamesApi } from '@/api'
import type { GameResultsRequest, SaveGameResultsRequest } from '@/types'

export function useGameResults() {
  return useMutation({
    mutationFn: (data: GameResultsRequest) => gamesApi.getResults(data),
  })
}

export function useSaveGameResults() {
  return useMutation({
    mutationFn: (data: SaveGameResultsRequest) => gamesApi.saveResults(data),
  })
}
