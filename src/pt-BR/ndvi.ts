import type { Location } from './power'
import { monthNames } from './power'

/**
 * Índice de vegetação NDVI do MODIS/Terra (MOD13Q1, 250 m, compostos de 16 dias),
 * distribuído pelo NASA LP DAAC e servido pela API REST do ORNL DAAC (sem credenciais, com CORS).
 */
export const ndviDocs = 'https://modis.ornl.gov/data/modis_webservice.html'
export const ndviProduct = 'https://lpdaac.usgs.gov/products/mod13q1v061/'
const base = 'https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset'
export interface NdviMonth { name: string; ndvi: number | null }
export interface Ndvi { months: NdviMonth[]; mean: number | null; peak: number | null; low: number | null; composites: number; url: string }
interface RawSubset { scale?: string | number; subset?: { calendar_date: string; band: string; data: number[] }[] }

// A API limita cada requisição a 10 datas; 23 compostos por ano → três janelas.
const ranges = [[1, 145], [161, 305], [321, 365]]
const doy = (year: number, day: number) => 'A' + year + String(day).padStart(3, '0')
export function ndviUrls({ lat, lon }: Location, year = 2025) {
  return ranges.map(([start, end]) => base + '?' + new URLSearchParams({
    latitude: String(lat), longitude: String(lon), band: '250m_16_days_NDVI',
    startDate: doy(year, start), endDate: doy(year, end), kmAboveBelow: '0', kmLeftRight: '0',
  }))
}
export function parseNdvi(raws: unknown[], url = ''): Ndvi {
  const buckets: number[][] = monthNames.map(() => [])
  let composites = 0
  for (const raw of raws) {
    const json = raw as RawSubset | null
    const scale = Number(json?.scale ?? 0.0001) || 0.0001
    for (const item of json?.subset ?? []) {
      const value = item.data?.[0]
      // -3000 é o valor de preenchimento do MOD13Q1; NDVI válido entre -0,2 e 1.
      if (!Number.isFinite(value) || value <= -2000) continue
      const ndvi = value * scale
      const month = new Date(item.calendar_date + 'T00:00:00Z').getUTCMonth()
      if (ndvi < -0.2 || ndvi > 1 || !Number.isInteger(month)) continue
      buckets[month].push(ndvi)
      composites++
    }
  }
  if (!composites) throw new Error('O MODIS não retornou NDVI válido para este ponto.')
  const months = buckets.map((values, index) => ({ name: monthNames[index], ndvi: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null }))
  const valid = months.flatMap((month) => month.ndvi === null ? [] : [month.ndvi])
  return { months, mean: valid.reduce((a, b) => a + b, 0) / valid.length, peak: Math.max(...valid), low: Math.min(...valid), composites, url }
}
export async function fetchNdvi(location: Location, signal: AbortSignal, year = 2025): Promise<Ndvi> {
  const urls = ndviUrls(location, year)
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(20000)])
  const raws = await Promise.all(urls.map(async (url) => {
    const response = await fetch(url, { signal: requestSignal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('MODIS NDVI indisponível (HTTP ' + response.status + ').')
    return response.json()
  }))
  return parseNdvi(raws, urls[0])
}
