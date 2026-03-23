import type { Category, Collection, Content, CategoryWithCollections, Playlist } from '@/types'

export const DEMO_USER = {
  id: 999,
  name: 'Demo User',
  email: 'demo',
  role: 'user' as const,
  img: '',
}

export const DEMO_CATEGORIES: Category[] = [
  { id: 1, name: 'english', userid: 999 },
  { id: 2, name: 'history', userid: 999 },
  { id: 3, name: 'science', userid: 999 },
]

export const DEMO_COLLECTIONS: Collection[] = [
  { id: 1, name: 'Common Idioms', note: 'Popular English idioms', userid: 999,
    categoryid: 1, isPublic: true, isFavorite: true, cardCount: 5,
    category: { id: 1, name: 'english', userid: 999 } },
  { id: 2, name: 'Phrasal Verbs', note: '', userid: 999,
    categoryid: 1, isPublic: false, isFavorite: false, cardCount: 4,
    category: { id: 1, name: 'english', userid: 999 } },
  { id: 3, name: 'World War II', note: 'Key events and dates', userid: 999,
    categoryid: 2, isPublic: true, isFavorite: false, cardCount: 4,
    category: { id: 2, name: 'history', userid: 999 } },
  { id: 4, name: 'The Solar System', note: '', userid: 999,
    categoryid: 3, isPublic: false, isFavorite: true, cardCount: 4,
    category: { id: 3, name: 'science', userid: 999 } },
]

export const DEMO_CONTENT: Record<number, Content[]> = {
  1: [
    { id: 101, question: 'Break a leg', answer: 'Good luck', note: 'Used before performances', collectionid: 1, rate: 4, imgQ: '', imgA: '' },
    { id: 102, question: 'Bite the bullet', answer: 'Endure a painful situation', note: '', collectionid: 1, rate: 3, imgQ: '', imgA: '' },
    { id: 103, question: 'Hit the nail on the head', answer: 'Be exactly right', note: '', collectionid: 1, rate: 5, imgQ: '', imgA: '' },
    { id: 104, question: 'Under the weather', answer: 'Feeling ill', note: '', collectionid: 1, rate: 2, imgQ: '', imgA: '' },
    { id: 105, question: 'Cost an arm and a leg', answer: 'Very expensive', note: '', collectionid: 1, rate: 0, imgQ: '', imgA: '' },
  ],
  2: [
    { id: 201, question: 'Give up', answer: 'To stop trying', note: '', collectionid: 2, rate: 3, imgQ: '', imgA: '' },
    { id: 202, question: 'Run out of', answer: 'To have no more of something', note: '', collectionid: 2, rate: 4, imgQ: '', imgA: '' },
    { id: 203, question: 'Look forward to', answer: 'To be excited about something in the future', note: '', collectionid: 2, rate: 2, imgQ: '', imgA: '' },
    { id: 204, question: 'Put off', answer: 'To postpone', note: '', collectionid: 2, rate: 0, imgQ: '', imgA: '' },
  ],
  3: [
    { id: 301, question: 'When did World War II begin?', answer: '1939', note: 'Germany invaded Poland', collectionid: 3, rate: 5, imgQ: '', imgA: '' },
    { id: 302, question: 'When did World War II end?', answer: '1945', note: '', collectionid: 3, rate: 4, imgQ: '', imgA: '' },
    { id: 303, question: 'What was the name of the Allied invasion of Normandy?', answer: 'Operation Overlord (D-Day)', note: 'June 6, 1944', collectionid: 3, rate: 3, imgQ: '', imgA: '' },
    { id: 304, question: 'Who was the Prime Minister of the UK during WWII?', answer: 'Winston Churchill', note: '', collectionid: 3, rate: 5, imgQ: '', imgA: '' },
  ],
  4: [
    { id: 401, question: 'How many planets are in the Solar System?', answer: '8', note: 'Pluto was reclassified in 2006', collectionid: 4, rate: 5, imgQ: '', imgA: '' },
    { id: 402, question: 'What is the largest planet?', answer: 'Jupiter', note: '', collectionid: 4, rate: 4, imgQ: '', imgA: '' },
    { id: 403, question: 'What is the closest planet to the Sun?', answer: 'Mercury', note: '', collectionid: 4, rate: 3, imgQ: '', imgA: '' },
    { id: 404, question: 'How long does light take to travel from the Sun to Earth?', answer: 'About 8 minutes', note: '', collectionid: 4, rate: 2, imgQ: '', imgA: '' },
  ],
}

export const DEMO_CATEGORIES_WITH_COLLECTIONS: CategoryWithCollections[] = [
  { id: 1, name: 'english', userid: 999, collections: [DEMO_COLLECTIONS[0], DEMO_COLLECTIONS[1]] },
  { id: 2, name: 'history', userid: 999, collections: [DEMO_COLLECTIONS[2]] },
  { id: 3, name: 'science', userid: 999, collections: [DEMO_COLLECTIONS[3]] },
]

export const DEMO_PLAYLISTS: Playlist[] = [
  {
    id: 1,
    name: 'Language Practice',
    userid: 999,
    collections: [
      { id: 1, name: 'Common Idioms', isMy: 1 },
      { id: 2, name: 'Phrasal Verbs', isMy: 1 },
    ],
  },
]
