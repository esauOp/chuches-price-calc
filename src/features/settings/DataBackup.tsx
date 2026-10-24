import { DownloadIcon, RotateCcwIcon, UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { exportData, useAppStore } from '@/store/useAppStore'

export function DataBackup() {
  const importData = useAppStore((s) => s.importData)
  const resetAll = useAppStore((s) => s.resetAll)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function download() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chuches-price-calc-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function upload(file: File) {
    try {
      const result = importData(JSON.parse(await file.text()))
      setStatus(result.ok ? { ok: true, text: 'Backup restored.' } : { ok: false, text: `Invalid backup — ${result.error}` })
    } catch {
      setStatus({ ok: false, text: 'That file is not valid JSON.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Data & backup</h2>
        <p className="text-sm text-muted-foreground">
          Everything is stored only in this browser. Export a backup regularly, or to move your data to another device.
        </p>
      </div>
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>
            <DownloadIcon /> Export backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <UploadIcon /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Importing replaces all current profiles, settings and quotes.</p>
        {status && <p className={status.ok ? 'text-sm text-success' : 'text-sm text-destructive'}>{status.text}</p>}
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3 border-destructive/30 p-5">
        <div>
          <p className="font-medium">Reset everything</p>
          <p className="text-sm text-muted-foreground">Restore the example profiles and delete all quotes.</p>
        </div>
        <Button variant="outline" className="text-destructive" onClick={() => setConfirmReset(true)}>
          <RotateCcwIcon /> Reset
        </Button>
      </Card>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
            <DialogDescription>All profiles, settings and saved quotes will be replaced with the defaults. Export a backup first if unsure.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                resetAll()
                setConfirmReset(false)
                setStatus(null)
              }}
            >
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
