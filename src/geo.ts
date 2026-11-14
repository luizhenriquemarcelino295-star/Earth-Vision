import type { Location } from './power'

/** Busca de cidades no mundo inteiro pela API pública de geocodificação do Open-Meteo (sem chave, com CORS). */
export const geocodingDocs = 'https://open-meteo.com/en/docs/geocoding-api'
export interface Place extends Location { country: string; region: string }
interface RawResult { name: string; latitude: number; longitude: number; country?: string; admin1?: string }

export function parsePlaces(raw: unknown): Place[] {
  const results = (raw as { results?: RawResult[] } | null)?.results ?? []
  return results.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).map((item) => ({
    name: [item.name, item.admin1].filter(Boolean).join(', ') + (item.country ? ' · ' + item.country : ''),
    lat: +item.latitude.toFixed(4), lon: +item.longitude.toFixed(4), country: item.country ?? '', region: item.admin1 ?? '',
  }))
}
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = 'https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: query.trim(), count: '6', language: 'pt', format: 'json' })
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Busca de cidades indisponível.')
  return parsePlaces(await response.json())
}
export function locateMe(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('Seu navegador não permite localização.')); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: +coords.latitude.toFixed(4), lon: +coords.longitude.toFixed(4), name: 'Minha localização' }),
      () => reject(new Error('Não foi possível obter sua localização. Busque pela cidade.')),
      { timeout: 10000 },
    )
  })
}
