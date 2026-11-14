import type { Location } from './power'

/**
 * Relevo pelo SRTM (Shuttle Radar Topography Mission, NASA), 30 m, via API pública OpenTopoData.
 * Mede a altitude no ponto e a ~500 m em quatro direções para estimar a declividade.
 */
export const srtmDocs = 'https://www.earthdata.nasa.gov/data/instruments/srtm'
export interface Terrain { elevation: number; slope: number; erosion: 'baixo' | 'médio' | 'alto' }
const offset = 0.0045 // ≈ 500 m em latitude
export function terrainUrl({ lat, lon }: Location) {
  const dLon = offset / Math.max(0.2, Math.cos(lat * Math.PI / 180))
  const points = [[lat, lon], [lat + offset, lon], [lat - offset, lon], [lat, lon + dLon], [lat, lon - dLon]]
  return 'https://api.opentopodata.org/v1/srtm30m?locations=' + points.map(([a, b]) => a.toFixed(5) + ',' + b.toFixed(5)).join('|')
}
export function erosionClass(slope: number): Terrain['erosion'] { return slope < 3 ? 'baixo' : slope < 8 ? 'médio' : 'alto' }
export function parseTerrain(raw: unknown): Terrain {
  const values = ((raw as { results?: { elevation: number | null }[] } | null)?.results ?? []).map((r) => r.elevation)
  if (values.length < 5 || values.some((v) => v === null || !Number.isFinite(v))) throw new Error('SRTM sem dados para este ponto.')
  const [center, n, s, e, w] = values as number[]
  const slope = Math.max(Math.abs(n - s), Math.abs(e - w)) / 1000 * 100
  return { elevation: Math.round(center), slope: +slope.toFixed(1), erosion: erosionClass(slope) }
}
export async function fetchTerrain(location: Location, signal: AbortSignal): Promise<Terrain> {
  const response = await fetch(terrainUrl(location), { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) })
  if (!response.ok) throw new Error('SRTM indisponível.')
  return parseTerrain(await response.json())
}
