import type { Climate } from './power'

export const crops = {
  soybean: { name: 'Soja', family: 'leguminosa', water: 575, temperature: [20, 30] },
  corn: { name: 'Milho', family: 'gramínea', water: 650, temperature: [18, 30] },
  sorghum: { name: 'Sorgo', family: 'gramínea', water: 550, temperature: [20, 34] },
  beans: { name: 'Feijão', family: 'leguminosa', water: 400, temperature: [17, 28] },
  millet: { name: 'Milheto', family: 'gramínea', water: 550, temperature: [20, 34] },
} as const
export type Crop = keyof typeof crops
export const soils = { unknown: 'Não informado', sandy: 'Arenoso', loam: 'Textura média', clay: 'Argiloso' }
export const priorities = { balanced: 'Equilíbrio', water: 'Economia de água', soil: 'Saúde do solo', production: 'Produção' }
type Priority = keyof typeof priorities
export interface Farm {
  name: string; area: string; crop: Crop; soil: keyof typeof soils; irrigated: boolean; priority: Priority; month: number
}
export const defaultFarm: Farm = { name: '', area: '', crop: 'soybean', soil: 'unknown', irrigated: false, priority: 'balanced', month: 1 }
export const criteria = ['Água', 'Solo', 'Produção'] as const
export const weights: Record<Priority, readonly [number, number, number]> = {
  balanced: [.4, .35, .25], water: [.65, .2, .15], soil: [.2, .65, .15], production: [.2, .2, .6],
}
export const methodology = 'Triagem exploratória para uma janela de quatro meses que se repete ciclicamente no ano histórico. Água compara chuva com demanda indicativa do ciclo. Solo usa diversidade de famílias, cobertura e textura declarada. Produção combina adequação térmica média e finalidade da cultura. A nota final é uma média ponderada pela prioridade escolhida.'
export const limits = 'A NASA POWER fornece estimativas em grade regional. Chuva total não representa água disponível às raízes. O índice ignora perdas, estoque no solo, eventos extremos, custos, produtividade e volume de irrigação. Confirme janela de semeadura, cultivares e viabilidade local antes de decidir.'
export const fao = 'https://www.fao.org/4/s2022e/s2022e07.htm'
export const embrapa = 'https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1190579'
const profiles = [
  { id: 'production', name: 'Grãos comerciais', description: 'Mantém uma cultura de grãos na próxima janela.', alternatives: ['corn', 'soybean'] as Crop[], cover: 16, production: 34, benefit: 'Dá continuidade à produção de grãos com uma espécie diferente.', risk: 'Exige atenção à janela de cultivo e à comercialização.' },
  { id: 'soil', name: 'Cobertura do solo', description: 'Mantém palhada e protege a superfície do talhão.', alternatives: ['millet', 'sorghum'] as Crop[], cover: 37, production: 8, benefit: 'A palhada de gramíneas pode proteger o solo se os resíduos forem mantidos.', risk: 'Planeje a dessecação ou o manejo da cobertura antes da próxima safra.' },
  { id: 'water', name: 'Eficiência hídrica', description: 'Prioriza culturas com menor demanda indicativa de água.', alternatives: ['sorghum', 'beans'] as Crop[], cover: 20, production: 24, benefit: 'Abre espaço para uma espécie com menor demanda que o milho no modelo.', risk: 'Verifique a disponibilidade de sementes e o mercado regional.' },
]
export interface Strategy {
  id: string; name: string; description: string; sequence: string; benefit: string; risks: string[];
  waterNeed: number; windowRain: number | null; windowTemperature: number | null;
  scores: [number | null, number, number | null]; total: number | null
}
const cap = (score: number) => Math.min(100, Math.max(0, Math.round(score)))
export function compare(farm: Farm, climate: Climate | null): Strategy[] {
  const months = Array.from({ length: 4 }, (_, index) => climate?.months[(farm.month + index) % 12])
  const windowRain = months.every((month) => month?.rain != null) ? months.reduce((sum, month) => sum + (month?.rain ?? 0), 0) : null
  const hasTemperatures = (climate?.coverage.T2M ?? 0) === 365 && months.every((month) => month?.temperature != null)
  const windowTemperature = hasTemperatures ? months.reduce((sum, month) => sum + (month?.temperature ?? 0), 0) / 4 : null
  const current = crops[farm.crop]
  const used = new Set<Crop>([farm.crop])
  return profiles.map((profile): Strategy => {
    const next = profile.alternatives.find((crop) => !used.has(crop)) ?? profile.alternatives.find((crop) => crop !== farm.crop)!
    used.add(next)
    const crop = crops[next]
    const differentFamily = current.family !== crop.family
    const water = windowRain === null ? null : cap(windowRain / crop.water * 100)
    const textureBonus = farm.soil === 'sandy' && profile.id === 'soil' ? 10 : 0
    const soil = cap(30 + (differentFamily ? 22 : 0) + profile.cover + textureBonus)
    const [low, high] = crop.temperature
    const production = windowTemperature === null ? null : cap(60 + profile.production - Math.max(low - windowTemperature, windowTemperature - high, 0) * 8)
    const [waterWeight, soilWeight, productionWeight] = weights[farm.priority]
    const risks = [profile.risk]
    if (!differentFamily) risks.push('Repete a família botânica. Verifique pragas e doenças compartilhadas.')
    if (windowRain !== null && windowRain < crop.water) risks.push(farm.irrigated ?
      'A chuva histórica ficou abaixo da demanda indicativa. Confirme a capacidade de irrigação.' :
      'A chuva histórica ficou abaixo da demanda indicativa em sequeiro.')
    if (windowTemperature !== null && (windowTemperature < low || windowTemperature > high)) risks.push('Temperatura média fora da faixa usada pelo modelo.')
    return {
      id: profile.id, name: profile.name, description: profile.description, benefit: profile.benefit, risks,
      sequence: current.name + ' → ' + crop.name, waterNeed: crop.water, windowRain, windowTemperature,
      scores: [water, soil, production],
      total: water === null || production === null ? null : cap(water * waterWeight + soil * soilWeight + production * productionWeight),
    }
  }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1))
}
