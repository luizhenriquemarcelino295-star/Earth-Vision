export interface Location { lat: number; lon: number; name: string }
export const locations: Location[] = [
  { name: 'Sorriso, MT', lat: -12.55, lon: -55.71 },
  { name: 'Rio Verde, GO', lat: -17.79, lon: -50.92 },
  { name: 'Londrina, PR', lat: -23.31, lon: -51.16 },
  { name: 'Barreiras, BA', lat: -12.15, lon: -44.99 },
]
export const year = 2025
export const years = [2025, 2024, 2023, 2022, 2021, 2020]
export const periodOf = (y: number) => '01 jan a 31 dez ' + y
export const period = periodOf(year)
export const powerDocs = 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/'
export const challenge = 'https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/'
export const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const parameters = ['T2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'] as const
/** Parâmetros extras da NASA POWER (comunidade AG). Opcionais: a cópia local antiga não os contém. */
export const extraParameters = ['GWETROOT', 'GWETTOP', 'T2M_MAX', 'T2M_MIN', 'RH2M'] as const
type Parameter = typeof parameters[number]
type Extra = typeof extraParameters[number]
export const heatThreshold = 35
export const frostThreshold = 2
export const heavyRainThreshold = 50
/** Evapotranspiração de referência (Hargreaves-Samani, forma com radiação): mm/dia. */
export const referenceEt = (temperature: number, solar: number) => Math.max(0, 0.0135 * (temperature + 17.8) * solar * 0.408)
type Series = Record<string, number>
interface RawPower {
  header: { fill_value: number }
  properties: { parameter: Record<Parameter, Series> & Partial<Record<Extra, Series>> }
}
export interface Month {
  name: string
  rain: number | null
  temperature: number | null
  solar: number | null
  /** Umidade do solo na zona radicular (0–1), MERRA-2/GMAO via NASA POWER */
  soilMoisture: number | null
  /** Dias com máxima acima de 35 °C */
  heatDays: number | null
  tMax: number | null
  tMin: number | null
  humidity: number | null
  /** Dias com mínima abaixo de 2 °C (risco de geada) */
  frostDays: number | null
  /** Dias com chuva ≥ 50 mm (chuva extrema / erosão) */
  heavyRainDays: number | null
  /** Evapotranspiração de referência do mês (mm) */
  eto: number | null
}
export interface Climate {
  months: Month[]
  rain: number | null
  temperature: number | null
  solar: number | null
  dryMonths: number | null
  soilMoisture: number | null
  heatDays: number | null
  frostDays: number | null
  heavyRainDays: number | null
  eto: number | null
  coverage: Record<Parameter, number>
  origin: 'live' | 'bundled'
  url: string
  year: number
}
export function powerUrl({lat, lon}: Location, year = 2025) {
  return 'https://power.larc.nasa.gov/api/temporal/daily/point?' + new URLSearchParams({
    parameters: [...parameters, ...extraParameters].join(','), community: 'AG', latitude: String(lat), longitude: String(lon),
    start: year + '0101', end: year + '1231', format: 'JSON',
  })
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
export function parsePower(raw: unknown, year = 2025): Omit<Climate, 'origin' | 'url' | 'year'> {
  const json = raw as Partial<RawPower> | null
  const source = json?.properties?.parameter
  if (!source || !parameters.every((key) => source[key] && typeof source[key] === 'object')) {
    throw new Error('A NASA POWER retornou uma série inválida.')
  }
  const samples = (key: Parameter | Extra, month: number, days: number) => Array.from({ length: days }, (_, day) => {
    const date = String(year) + String(month + 1).padStart(2, '0') + String(day + 1).padStart(2, '0')
    return source[key]?.[date] as number
  }).filter((value) => Number.isFinite(value) && value !== (json?.header?.fill_value ?? -999) && value > -900 && (key.startsWith('T2M') || value >= 0))
  const buckets = monthNames.map((name, month) => {
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return { name, days, rain: samples('PRECTOTCORR', month, days), temp: samples('T2M', month, days), solar: samples('ALLSKY_SFC_SW_DWN', month, days),
      wet: samples('GWETROOT', month, days).filter((value) => value <= 1), tMax: samples('T2M_MAX', month, days),
      tMin: samples('T2M_MIN', month, days), humidity: samples('RH2M', month, days) }
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
    soilMoisture: mean(month.wet),
    heatDays: month.tMax.length ? month.tMax.filter((value) => value > heatThreshold).length : null,
    tMax: mean(month.tMax),
    tMin: mean(month.tMin),
    humidity: mean(month.humidity),
    frostDays: month.tMin.length ? month.tMin.filter((value) => value < frostThreshold).length : null,
    heavyRainDays: month.rain.length ? month.rain.filter((value) => value >= heavyRainThreshold).length : null,
    eto: month.temp.length && month.solar.length ? referenceEt(mean(month.temp)!, mean(month.solar)!) * month.days : null,
  }))
  const wet = buckets.flatMap((month) => month.wet)
  const tMax = buckets.flatMap((month) => month.tMax)
  return {
    months,
    rain: rain.length === days ? sum(rain) : null,
    temperature: mean(temp),
    solar: mean(solar),
    dryMonths: rain.length === days ? months.filter((month) => month.rain !== null && month.rain < 60).length : null,
    soilMoisture: mean(wet),
    heatDays: tMax.length ? tMax.filter((value) => value > heatThreshold).length : null,
    frostDays: months.every((m) => m.frostDays !== null) ? sum(months.map((m) => m.frostDays!)) : null,
    heavyRainDays: rain.length ? rain.filter((value) => value >= heavyRainThreshold).length : null,
    eto: months.every((m) => m.eto !== null) ? sum(months.map((m) => m.eto!)) : null,
    coverage: { T2M: temp.length, PRECTOTCORR: rain.length, ALLSKY_SFC_SW_DWN: solar.length },
  }
}
export async function fetchClimate(location: Location, signal: AbortSignal, year = 2025): Promise<Climate> {
  const url = powerUrl(location, year)
  const load = async (source: string, requestSignal: AbortSignal) => {
    const response = await fetch(source, { signal: requestSignal })
    if (!response.ok) throw new Error('NASA POWER indisponível (HTTP ' + response.status + ').')
    return parsePower(await response.json(), year)
  }
  try {
    return { ...await load(url, AbortSignal.any([signal, AbortSignal.timeout(12000)])), url, year, origin: 'live' }
  } catch (error) {
    if (signal.aborted || year !== 2025 || Math.abs(location.lat - locations[0].lat) > 0.25 || Math.abs(location.lon - locations[0].lon) > 0.25) throw error
    return { ...await load(import.meta.env.BASE_URL + 'power-sorriso-2025.json', signal), url, year, origin: 'bundled' }
  }
}
export const format = (value: number | null, digits = 1) => value === null ? '—' :
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)

/** Cenário "e se": muda a chuva (%) e a temperatura (°C) de todos os meses. */
export function applyScenario(climate: Climate, rainPercent: number, temperatureDelta: number): Climate {
  if (!rainPercent && !temperatureDelta) return climate
  const factor = 1 + rainPercent / 100
  const months = climate.months.map((m) => ({
    ...m,
    rain: m.rain === null ? null : m.rain * factor,
    temperature: m.temperature === null ? null : m.temperature + temperatureDelta,
    tMax: m.tMax === null ? null : m.tMax + temperatureDelta,
    eto: m.eto === null || m.temperature === null ? m.eto : m.eto * (m.temperature + temperatureDelta + 17.8) / (m.temperature + 17.8),
    heatDays: m.heatDays === null ? null : Math.min(31, Math.round(m.heatDays * (1 + temperatureDelta * 0.6) + temperatureDelta * 2)),
    soilMoisture: m.soilMoisture === null ? null : Math.min(1, Math.max(0, m.soilMoisture * (1 + rainPercent / 250))),
  }))
  const total = (key: 'rain' | 'eto' | 'heatDays') => months.every((m) => m[key] !== null) ? sum(months.map((m) => m[key]!)) : null
  return { ...climate, months, rain: total('rain'), eto: total('eto'), heatDays: total('heatDays'),
    temperature: climate.temperature === null ? null : climate.temperature + temperatureDelta,
    dryMonths: months.every((m) => m.rain !== null) ? months.filter((m) => m.rain! < 60).length : null }
}
