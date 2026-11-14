import type { Location } from './power'

/**
 * El Niño / La Niña. Fase predominante de cada ano pelo índice ONI (NOAA CPC) e
 * efeitos regionais qualitativos conhecidos (teleconexões). São tendências, não previsões.
 */
export const ensoDocs = 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php'
export const ensoOutlook = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/'
export type Phase = 'elnino' | 'lanina' | 'neutral'
export const phaseNames: Record<Phase, string> = { elnino: 'El Niño', lanina: 'La Niña', neutral: 'Neutro' }
export const yearPhase: Record<number, { phase: Phase; text: string }> = {
  2020: { phase: 'lanina', text: 'La Niña a partir do 2º semestre' },
  2021: { phase: 'lanina', text: 'La Niña na maior parte do ano' },
  2022: { phase: 'lanina', text: 'La Niña o ano todo (3º ano seguido)' },
  2023: { phase: 'elnino', text: 'El Niño forte a partir do meio do ano' },
  2024: { phase: 'neutral', text: 'El Niño no início, neutro depois' },
  2025: { phase: 'neutral', text: 'Neutro, com La Niña fraca em alguns meses' },
}
export interface EnsoImpact { region: string; elnino: number; lanina: number; elninoText: string; laninaText: string }
/** Fator de chuva/produtividade (1 = normal) em cada fase, por grande região. */
export function ensoImpact({ lat, lon }: Location): EnsoImpact {
  const inRange = (a: number, b: number, c: number, d: number) => lat >= a && lat <= b && lon >= c && lon <= d
  if (inRange(-40, -22, -66, -44)) return { region: 'Sul do Brasil, Uruguai e Argentina', elnino: 1.05, lanina: 0.8,
    elninoText: 'Chuva acima do normal: bom para o verão, mas risco de excesso na colheita e no trigo.', laninaText: 'Risco alto de seca e quebra na soja e no milho de verão.' }
  if (inRange(-18, 5, -48, -34)) return { region: 'Nordeste do Brasil', elnino: 0.75, lanina: 1.1,
    elninoText: 'Seca forte no semiárido e chuvas irregulares.', laninaText: 'Chuvas tendem a ficar normais ou acima.' }
  if (inRange(-10, 6, -75, -48)) return { region: 'Norte do Brasil / Amazônia', elnino: 0.85, lanina: 1.05,
    elninoText: 'Menos chuva e mais calor, com risco de queimadas.', laninaText: 'Chuva normal ou acima.' }
  if (inRange(-24, -10, -62, -42)) return { region: 'Centro-Oeste e Sudeste do Brasil', elnino: 0.95, lanina: 0.95,
    elninoText: 'Calor maior e início das chuvas irregular; atenção à janela da safrinha.', laninaText: 'Atraso das chuvas e veranicos no início da safra.' }
  if (inRange(-35, -10, 10, 42)) return { region: 'África Austral', elnino: 0.75, lanina: 1.05,
    elninoText: 'Seca frequente no verão.', laninaText: 'Chuvas normais ou acima.' }
  if (inRange(-45, -10, 110, 155) || inRange(-10, 25, 70, 130)) return { region: 'Sul e Sudeste da Ásia / Austrália', elnino: 0.8, lanina: 1.05,
    elninoText: 'Monção mais fraca e seca.', laninaText: 'Chuva acima do normal e risco de enchentes.' }
  if (inRange(25, 50, -125, -70)) return { region: 'Estados Unidos', elnino: 1.03, lanina: 0.92,
    elninoText: 'Sul mais úmido; Meio-Oeste com impacto fraco.', laninaText: 'Sul e Planícies mais secos.' }
  return { region: 'Sua região', elnino: 0.95, lanina: 0.97, elninoText: 'Efeito fraco ou variável nesta região.', laninaText: 'Efeito fraco ou variável nesta região.' }
}
