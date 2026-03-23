export interface ParsedCard {
  id: string
  question: string
  answer: string
  note: string
}

function uid() {
  return `${Date.now()}-${Math.random()}`
}

function clean(s: string) {
  return s.trim()
}

/** Mode 1: each line is "question ; answer" (configurable separator) */
export function parseDelimited(text: string, sep = ';'): ParsedCard[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(sep)
      if (idx === -1) return null
      const question = clean(line.slice(0, idx))
      const rest = line.slice(idx + sep.length)
      const parts = rest.split(sep)
      const answer = clean(parts[0] ?? '')
      const note = clean(parts[1] ?? '')
      if (!question || !answer) return null
      return { id: uid(), question, answer, note }
    })
    .filter((c): c is ParsedCard => c !== null)
}

/** Mode 2: two separate text areas — questions (one per line) + answers (one per line) */
export function parseTwoLists(questions: string, answers: string): ParsedCard[] {
  const qs = questions.split('\n').map(clean).filter(Boolean)
  const as = answers.split('\n').map(clean).filter(Boolean)
  const len = Math.min(qs.length, as.length)
  const cards: ParsedCard[] = []
  for (let i = 0; i < len; i++) {
    cards.push({ id: uid(), question: qs[i], answer: as[i], note: '' })
  }
  return cards
}

/** Mode 3: alternating lines — line 1 = question, line 2 = answer, repeat */
export function parseAlternating(text: string): ParsedCard[] {
  const lines = text.split('\n').map(clean).filter(Boolean)
  const cards: ParsedCard[] = []
  for (let i = 0; i + 1 < lines.length; i += 2) {
    cards.push({ id: uid(), question: lines[i], answer: lines[i + 1], note: '' })
  }
  return cards
}

// ── File parsing ─────────────────────────────────────────────────────────────

/** Returns raw rows (array of string arrays) from a .txt or .csv file */
export async function parseTxtFile(file: File): Promise<string[][]> {
  const text = await file.text()
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t|;/).map(clean))
}

/** Returns raw rows from an .xlsx / .xls file */
export async function parseXlsxFile(file: File): Promise<string[][]> {
  const { read, utils } = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
  return (data as string[][]).filter((row) => row.some((cell) => String(cell).trim()))
}

// ── Column mapping ────────────────────────────────────────────────────────────

export interface ColumnMap {
  question: number | null
  answer: number | null
  note: number | null
}

/** Map raw rows to ParsedCard[] using a column index map */
export function mapColumns(rows: string[][], colMap: ColumnMap): ParsedCard[] {
  const { question: qi, answer: ai, note: ni } = colMap
  if (qi === null || ai === null) return []
  return rows
    .map((row) => {
      const question = clean(String(row[qi] ?? ''))
      const answer = clean(String(row[ai] ?? ''))
      const note = ni !== null ? clean(String(row[ni] ?? '')) : ''
      if (!question || !answer) return null
      return { id: uid(), question, answer, note }
    })
    .filter((c): c is ParsedCard => c !== null)
}
