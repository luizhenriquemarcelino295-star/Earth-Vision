import { readLanguage } from './LanguagePicker'

const requested = new URLSearchParams(window.location.search).get('lang')
const language = requested === 'pt-BR' || requested === 'en-US' ? requested : readLanguage()
document.documentElement.lang = language

if (language === 'pt-BR') {
  document.title = 'EarthVision | Planejamento agrícola'
  void import('./pt-BR/main')
} else {
  void import('./main')
}
