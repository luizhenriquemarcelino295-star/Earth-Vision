import type { Location } from './power'

/**
 * El Niño / La Niña. Fase predominante de cada ano pelo índice ONI (NOAA CPC) e
 * efeitos regionais qualitativos conhecidos (teleconexões). São tendências, não previsões.
 */
export const ensoDocs = 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php'
export const ensoOutlook = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/'
export type Phase = 'elnino' | 'lanina' | 'neutral'
export const phaseNames: Record<Phase, string> = { elnino: 'El Niño', lanina: 'La Niña', neutral: 'Neutral' }
export const yearPhase: Record<number, { phase: Phase; text: string }> = {
  2020: { phase: 'lanina', text: 'La Niña from the second half of the year' },
  2021: { phase: 'lanina', text: 'La Niña for most of the year' },
  2022: { phase: 'lanina', text: 'La Niña throughout the year (third consecutive year)' },
  2023: { phase: 'elnino', text: 'Strong El Niño from midyear' },
  2024: { phase: 'neutral', text: 'El Niño early in the year, neutral afterward' },
  2025: { phase: 'neutral', text: 'Neutral, with weak La Niña in some months' },
}
export interface EnsoImpact { region: string; elnino: number; lanina: number; elninoText: string; laninaText: string }
/** Fator de chuva/produtividade (1 = normal) em cada fase, por grande região. */
export function ensoImpact({ lat, lon }: Location): EnsoImpact {
  const inRange = (a: number, b: number, c: number, d: number) => lat >= a && lat <= b && lon >= c && lon <= d
  if (inRange(-40, -22, -66, -44)) return { region: 'Southern Brazil, Uruguay, and Argentina', elnino: 1.05, lanina: 0.8,
    elninoText: 'Above-normal rainfall can help summer crops but increase harvest and wheat risks.', laninaText: 'High risk of drought and yield losses in summer soybean and corn.' }
  if (inRange(-18, 5, -48, -34)) return { region: 'Northeastern Brazil', elnino: 0.75, lanina: 1.1,
    elninoText: 'Severe drought in semi-arid areas and irregular rainfall.', laninaText: 'Rainfall tends to be normal or above normal.' }
  if (inRange(-10, 6, -75, -48)) return { region: 'Northern Brazil / Amazon', elnino: 0.85, lanina: 1.05,
    elninoText: 'Less rain and more heat, with wildfire risk.', laninaText: 'Normal or above-normal rainfall.' }
  if (inRange(-24, -10, -62, -42)) return { region: 'Central-West and Southeastern Brazil', elnino: 0.95, lanina: 0.95,
    elninoText: 'More heat and an irregular rainy-season onset can affect second-season planting.', laninaText: 'Delayed rainfall and early-season dry spells.' }
  if (inRange(-35, -10, 10, 42)) return { region: 'Southern Africa', elnino: 0.75, lanina: 1.05,
    elninoText: 'Frequent summer drought.', laninaText: 'Normal or above-normal rainfall.' }
  if (inRange(-45, -10, 110, 155) || inRange(-10, 25, 70, 130)) return { region: 'South and Southeast Asia / Australia', elnino: 0.8, lanina: 1.05,
    elninoText: 'Weaker monsoon and drier conditions.', laninaText: 'Above-normal rainfall and flood risk.' }
  if (inRange(25, 50, -125, -70)) return { region: 'United States', elnino: 1.03, lanina: 0.92,
    elninoText: 'Wetter conditions in the South, with a weaker effect in the Midwest.', laninaText: 'Drier conditions in the South and Plains.' }
  return { region: 'Your region', elnino: 0.95, lanina: 0.97, elninoText: 'Weak or variable effects in this region.', laninaText: 'Weak or variable effects in this region.' }
}
