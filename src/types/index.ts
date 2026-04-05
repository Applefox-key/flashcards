// ── Domain models ──────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  img?: string
  role: 'user' | 'admin'
  settings?: Record<string, unknown>
}

export interface Category {
  id: number
  name: string
  userid: number
}

export interface CollectionTag {
  id: number
  name: string
}

export interface Collection {
  id: number
  name: string
  note?: string
  userid: number
  categoryid?: number
  isPublic: boolean
  isFavorite: boolean
  category?: Category
  cardCount?: number
  tags?: CollectionTag[]
}

export interface Content {
  id: number
  question: string
  answer: string
  note?: string
  collectionid: number
  collectionname?: string
  imgQ?: string
  imgA?: string
  rate?: number
}

export interface PlaylistCollection {
  id: number
  name: string
  isMy: 0 | 1
}

export interface Playlist {
  id: number
  name: string
  userid?: number
  collections: PlaylistCollection[]
}

export interface GameResult {
  id: number
  contentid: number
  userid: number
  probability: number
}

// ── Enriched / compound types ───────────────────────────────────────

export interface CategoryWithCollections extends Category {
  collections: Collection[]
}

export interface CollectionWithContent extends Collection {
  content: Content[]
}


// ── Request / response shapes ───────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

/** Backend returns token + role; user must be fetched separately via GET /users */
export interface LoginResponse {
  token: string
  role: string
}

export interface CollectionCreateRequest {
  name: string
  note?: string
  categoryid?: number
}

export interface CollectionCreateWithCardsRequest extends CollectionCreateRequest {
  content: Array<{ question: string; answer: string; note?: string }>
}

export interface CardAddRequest {
  question: string
  answer: string
  note?: string
}

export interface CardEditRequest {
  id: number
  question?: string
  answer?: string
  note?: string
  rate?: number
  imgQ?: string
  imgA?: string
}

export interface MoveCardsRequest {
  contentIds: number[]
  newCollectionId: number
}

export interface GameResultsRequest {
  listid: number[]
  game: string
}

/** Keys are contentId strings, values are { [gameName]: probability } */
export interface SaveGameResultsRequest {
  newProb: Record<string, Record<string, number>>
}

export interface ApiError {
  error: string
}
