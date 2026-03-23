import { useState, useRef } from 'react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { CardPreviewTable } from './CardPreviewTable'
import { parseTxtFile, parseXlsxFile, mapColumns } from '@/utils/parseCards'
import { useBulkAddCards } from './hooks/useContent'
import { useToast } from '@/hooks/useToast'
import type { ParsedCard, ColumnMap } from '@/utils/parseCards'

type Step = 'upload' | 'map' | 'preview'

interface Props {
  open: boolean
  onClose: () => void
  collectionId: number
}

export function FileImportModal({ open, onClose, collectionId }: Props) {
  const toast = useToast()
  const bulkAdd = useBulkAddCards()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [colMap, setColMap] = useState<ColumnMap>({ question: 0, answer: 1, note: null })
  const [cards, setCards] = useState<ParsedCard[]>([])
  const [fileName, setFileName] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let rows: string[][]
      if (ext === 'xlsx' || ext === 'xls') {
        rows = await parseXlsxFile(file)
        setRawRows(rows)
        setColMap({ question: 0, answer: 1, note: null })
        setStep('map')
      } else {
        // .txt / .csv — auto-parse with default mapping
        rows = await parseTxtFile(file)
        if (rows.length === 0) {
          toast.error('No data found in file.')
          setLoading(false)
          return
        }
        const parsed = mapColumns(rows, { question: 0, answer: 1, note: rows[0].length > 2 ? 2 : null })
        if (parsed.length === 0) {
          toast.error('Could not parse cards. Each line needs at least two columns.')
          setLoading(false)
          return
        }
        setCards(parsed)
        setStep('preview')
      }
    } catch {
      toast.error('Failed to read file.')
    } finally {
      setLoading(false)
    }
  }

  function handleApplyMap() {
    const parsed = mapColumns(rawRows, colMap)
    if (parsed.length === 0) {
      toast.error('No valid cards with current column mapping.')
      return
    }
    setCards(parsed)
    setStep('preview')
  }

  function handleSave() {
    const list = cards
      .filter((c) => c.question.trim() && c.answer.trim())
      .map(({ question, answer, note }) => ({ question, answer, note: note || undefined }))

    if (list.length === 0) {
      toast.error('No valid cards to save.')
      return
    }

    bulkAdd.mutate(
      { collectionId, list },
      {
        onSuccess: () => {
          toast.success(`${list.length} card${list.length !== 1 ? 's' : ''} added`)
          handleClose()
        },
        onError: () => toast.error('Failed to add cards'),
      }
    )
  }

  function handleClose() {
    onClose()
    setStep('upload')
    setRawRows([])
    setCards([])
    setFileName('')
    setColMap({ question: 0, answer: 1, note: null })
    if (fileRef.current) fileRef.current.value = ''
  }

  // Header row for column selector (first row of file)
  const headerRow = rawRows[0] ?? []

  return (
    <Modal open={open} onClose={handleClose} title="Import from file" size="xl">
      {step === 'upload' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Supported: <strong>.txt</strong>, <strong>.csv</strong> (tab/semicolon separated),{' '}
            <strong>.xlsx</strong> / <strong>.xls</strong>
          </p>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-gray-500 text-sm">Click to select a file</p>
            <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />
          {loading && <p className="text-sm text-indigo-600 text-center">Reading file…</p>}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            <strong>{fileName}</strong> — {rawRows.length} rows detected. Map columns:
          </p>

          {/* Preview of first 3 rows */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto max-h-40">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {headerRow.map((_, i) => (
                      <th key={i} className="px-3 py-1.5 text-left text-gray-500 font-medium">
                        Col {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rawRows.slice(0, 4).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1 text-gray-700 truncate max-w-[12rem]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column mapping selects */}
          <div className="grid grid-cols-3 gap-3">
            {(['question', 'answer', 'note'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                  {field} column{field === 'note' ? ' (optional)' : ''}
                </label>
                <select
                  value={colMap[field] ?? ''}
                  onChange={(e) =>
                    setColMap((prev) => ({
                      ...prev,
                      [field]: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {field === 'note' && <option value="">— none —</option>}
                  {headerRow.map((_, i) => (
                    <option key={i} value={i}>
                      Col {i + 1} — "{String(rawRows[0]?.[i] ?? '').slice(0, 20)}"
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('upload')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Choose different file
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleApplyMap}
                disabled={colMap.question === null || colMap.answer === null}
              >
                Preview →
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Review and edit cards before saving:
          </p>
          <CardPreviewTable cards={cards} onChange={setCards} />
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(rawRows.length > 0 ? 'map' : 'upload')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} loading={bulkAdd.isPending} disabled={cards.length === 0}>
                Save {cards.length} card{cards.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
