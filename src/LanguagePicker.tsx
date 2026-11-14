import { useId } from 'react'

export type Language = 'en-US' | 'pt-BR'
const storageKey = 'earthvision-language'

export function readLanguage(): Language {
  try {
    return localStorage.getItem(storageKey) === 'pt-BR' ? 'pt-BR' : 'en-US'
  } catch {
    return 'en-US'
  }
}

export function LanguagePicker({ language }: { language: Language }) {
  const id = useId()
  return <select className="language-picker"
    aria-label={language === 'pt-BR' ? 'Idioma' : 'Language'}
    value={language} onChange={(event) => {
      const selected = event.target.value as Language
      try { localStorage.setItem(storageKey, selected) } catch { /* The URL also stores the selected language. */ }
      const url = new URL(window.location.href)
      url.searchParams.set('lang', selected)
      window.location.assign(url)
    }}>
    <option value="en-US" lang="en-US">English (US)</option>
    <option value="pt-BR" lang="pt-BR">Português (Brasil)</option>
  </select>
}
