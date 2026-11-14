export interface Location { lat: number; lon: number; name: string }
export const locations: Location[] = [
  { name: 'Sorriso, MT', lat: -12.55, lon: -55.71 },
  { name: 'Rio Verde, GO', lat: -17.79, lon: -50.92 },
  { name: 'Londrina, PR', lat: -23.31, lon: -51.16 },
  { name: 'Barreiras, BA', lat: -12.15, lon: -44.99 },
]
export const year = 2025
export const period = '01 jan a 31 dez 2025'
export const powerDocs = 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/'
export const challenge = 'https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/'
export const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const parameters = ['T2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'] as const
type Parameter = typeof parameters[number]
type Series = Record<string, number>
interface RawPower {
  header: { fill_value: number }
  properties: { parameter: Record<Parameter, Series> }
}
export interface Month {
  name: string
  rain: number | null
  temperature: number | null
  solar: number | null
}
export interface Climate {
  months: Month[]
  rain: number | null
  temperature: number | null
  solar: number | null
  dryMonths: number | null
  coverage: Record<Parameter, number>
  origin: 'live' | 'bundled'
  url: string
}
export function powerUrl({lat, lon}: Location) {
  return 'https://power.larc.nasa.gov/api/temporal/daily/point?' + new URLSearchParams({
    parameters: parameters.join(','), community: 'AG', latitude: String(lat), longitude: String(lon),
    start: year + '0101', end: year + '1231', format: 'JSON',
  })
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
export function parsePower(raw: unknown): Omit<Climate, 'origin' | 'url'> {
  const json = raw as Partial<RawPower> | null
  const source = json?.properties?.parameter
  if (!source || !parameters.every((key) => source[key] && typeof source[key] === 'object')) {
    throw new Error('A NASA POWER retornou uma série inválida.')
  }
  const samples = (key: Parameter, month: number, days: number) => Array.from({ length: days }, (_, day) => {
    const date = String(year) + String(month + 1).padStart(2, '0') + String(day + 1).padStart(2, '0')
    return source[key][date]
  }).filter((value) => Number.isFinite(value) && value !== (json?.header?.fill_value ?? -999) && value > -900 && (key === 'T2M' || value >= 0))
  const buckets = monthNames.map((name, month) => {
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return { name, days, rain: samples('PRECTOTCORR', month, days), temp: samples('T2M', month, days), solar: samples('ALLSKY_SFC_SW_DWN', month, days) }
  })
  const temp = buckets.flatMap((month) => month.temp)
  const solar = buckets.flatMap((month) => month.solar)
  const rain = buckets.flatMap((month) => month.rain)
  if (!temp.length && !solar.length && !rain.length) throw new Error('A NASA POWER não tem dados válidos para este ponto.')
  const days = sum(buckets.map((month) => month.days))
  const mean = (values: number[]) => values.length ? sum(values) / values.length : null
  const months = buckets.map((month) => ({
    name: month.name,
    rain: month.rain.length === month.days ? sum(month.rain) : null,
    temperature: mean(month.temp),
    solar: mean(month.solar),
  }))
  return {
    months,
    rain: rain.length === days ? sum(rain) : null,
    temperature: mean(temp),
    solar: mean(solar),
    dryMonths: rain.length === days ? months.filter((month) => month.rain !== null && month.rain < 60).length : null,
    coverage: { T2M: temp.length, PRECTOTCORR: rain.length, ALLSKY_SFC_SW_DWN: solar.length },
  }
}
export async function fetchClimate(location: Location, signal: AbortSignal): Promise<Climate> {
  const url = powerUrl(location)
  const load = async (source: string, requestSignal: AbortSignal) => {
    const response = await fetch(source, { signal: requestSignal })
    if (!response.ok) throw new Error('NASA POWER indisponível (HTTP ' + response.status + ').')
    return parsePower(await response.json())
  }
  try {
    return { ...await load(url, AbortSignal.any([signal, AbortSignal.timeout(12000)])), url, origin: 'live' }
  } catch (error) {
    if (signal.aborted || location.lat !== locations[0].lat || location.lon !== locations[0].lon) throw error
    return { ...await load(import.meta.env.BASE_URL + 'power-sorriso-2025.json', signal), url, origin: 'bundled' }
  }
}
export const format = (value: number | null, digits = 1) => value === null ? '—' :
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
