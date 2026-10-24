import { CalculatorIcon, HistoryIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { TooltipProvider } from './components/ui/tooltip'
import { CalculatorPage } from './features/calculator/CalculatorPage'
import { QuotesPage } from './features/quotes/QuotesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useAppStore } from './store/useAppStore'

type Tab = 'calculator' | 'quotes' | 'settings'

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage unavailable; theme just won't persist
    }
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('calculator')
  const quoteCount = useAppStore((s) => s.quotes.length)

  return (
    <TooltipProvider delayDuration={200}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-h-screen">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="" className="size-8" />
              <div className="hidden leading-tight sm:block">
                <p className="font-semibold">Chuches Price Calc</p>
                <p className="text-xs text-muted-foreground">3D print pricing</p>
              </div>
            </div>
            <TabsList className="mx-auto sm:mx-0 sm:ml-auto">
              <TabsTrigger value="calculator">
                <CalculatorIcon />
                <span className="hidden sm:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="quotes">
                <HistoryIcon />
                <span className="hidden sm:inline">Quotes</span>
                {quoteCount > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-xs text-primary">{quoteCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <SettingsIcon />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <TabsContent value="calculator">
            <CalculatorPage />
          </TabsContent>
          <TabsContent value="quotes">
            <QuotesPage onOpen={() => setTab('calculator')} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>
        </main>
      </Tabs>
    </TooltipProvider>
  )
}
