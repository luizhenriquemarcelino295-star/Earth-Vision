import type { Climate } from './power'
import type { Ndvi } from './ndvi'
import { ensoImpact, type EnsoImpact } from './enso'

/**
 * Culturas com dados indicativos (Brasil). Água: necessidade no ciclo (FAO/Embrapa).
 * Produtividade, preço e custo são valores de referência que o usuário pode alterar.
 */
export interface CropInfo {
  name: string; family: string; kind: 'grão' | 'cobertura' | 'fibra'; description: string
  water: number; temperature: readonly [number, number]; cycle: number; plant: readonly number[]
  yield: number; unit: string; price: number; cost: number; fixesNitrogen: boolean; droughtTolerant: boolean
}
export const crops = {
  soybean: { name: 'Soja', family: 'leguminosa', kind: 'grão', description: 'Leguminosa que fixa nitrogênio do ar no solo. Principal safra de verão, sensível à seca no enchimento de grãos.', water: 550, temperature: [20, 30], cycle: 4, plant: [8, 9, 10, 11], yield: 60, unit: 'sc', price: 120, cost: 4200, fixesNitrogen: true, droughtTolerant: false },
  corn: { name: 'Milho', family: 'gramínea', kind: 'grão', description: 'Gramínea de alto potencial produtivo e muita palhada. Exige água no florescimento e bastante nitrogênio.', water: 600, temperature: [18, 30], cycle: 5, plant: [0, 1, 2, 8, 9, 10, 11], yield: 110, unit: 'sc', price: 60, cost: 5000, fixesNitrogen: false, droughtTolerant: false },
  sorghum: { name: 'Sorgo', family: 'gramínea', kind: 'grão', description: 'Parecido com o milho, porém mais resistente à seca e ao calor. Boa opção de safrinha tardia.', water: 450, temperature: [20, 34], cycle: 4, plant: [0, 1, 2, 3], yield: 80, unit: 'sc', price: 50, cost: 2600, fixesNitrogen: false, droughtTolerant: true },
  beans: { name: 'Feijão', family: 'leguminosa', kind: 'grão', description: 'Ciclo curto (cerca de 90 dias) e bom preço. Fixa nitrogênio, mas sofre com calor no florescimento.', water: 350, temperature: [17, 28], cycle: 3, plant: [0, 1, 2, 3, 4, 9, 10, 11], yield: 30, unit: 'sc', price: 250, cost: 4500, fixesNitrogen: true, droughtTolerant: false },
  wheat: { name: 'Trigo', family: 'gramínea', kind: 'grão', description: 'Cereal de inverno para regiões frias ou com irrigação. Quebra o ciclo de pragas da soja.', water: 450, temperature: [10, 24], cycle: 4, plant: [3, 4, 5], yield: 55, unit: 'sc', price: 80, cost: 3800, fixesNitrogen: false, droughtTolerant: false },
  cotton: { name: 'Algodão', family: 'malvácea', kind: 'fibra', description: 'Cultura de alto valor e alto custo, de ciclo longo. Exige manejo intensivo de pragas.', water: 700, temperature: [20, 32], cycle: 6, plant: [10, 11, 0], yield: 300, unit: '@', price: 130, cost: 12000, fixesNitrogen: false, droughtTolerant: false },
  millet: { name: 'Milheto', family: 'gramínea', kind: 'cobertura', description: 'Planta de cobertura rústica que cresce com pouca chuva. Raízes profundas descompactam o solo.', water: 400, temperature: [20, 34], cycle: 3, plant: [1, 2, 3, 4, 7, 8, 9], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: true },
  crotalaria: { name: 'Crotalária', family: 'leguminosa', kind: 'cobertura', description: 'Adubo verde que fixa nitrogênio e reduz nematoides. Muito usada antes da soja ou do milho.', water: 350, temperature: [20, 32], cycle: 3, plant: [1, 2, 3, 8, 9, 10], yield: 0, unit: 'sc', price: 0, cost: 450, fixesNitrogen: true, droughtTolerant: true },
  brachiaria: { name: 'Braquiária', family: 'gramínea', kind: 'cobertura', description: 'Capim que forma palhada duradoura e pode virar pasto (integração lavoura-pecuária).', water: 400, temperature: [18, 35], cycle: 4, plant: [0, 1, 2, 3], yield: 0, unit: 'sc', price: 0, cost: 350, fixesNitrogen: false, droughtTolerant: true },
  oat: { name: 'Aveia', family: 'gramínea', kind: 'cobertura', description: 'Cobertura de inverno para regiões frias. Protege o solo e controla plantas daninhas.', water: 350, temperature: [8, 22], cycle: 3, plant: [3, 4, 5], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: false },
} satisfies Record<string, CropInfo>
export type Crop = keyof typeof crops
export const cropList = Object.keys(crops) as Crop[]

export const soils = {
  unknown: { name: 'Não sei', text: 'Usaremos valores médios.' },
  sandy: { name: 'Arenoso', text: 'Seca rápido e perde nutrientes. Palhada e cobertura fazem muita diferença.' },
  loam: { name: 'Textura média', text: 'Equilíbrio entre drenagem e retenção de água.' },
  clay: { name: 'Argiloso', text: 'Segura mais água, mas pode compactar. Raízes profundas ajudam.' },
}
export type Soil = keyof typeof soils

export const priorities = {
  balanced: { name: 'Equilíbrio', text: 'Um pouco de tudo', icon: '⚖️' },
  profit: { name: 'Lucro', text: 'Maior retorno por hectare', icon: '💰' },
  water: { name: 'Economizar água', text: 'Culturas que pedem menos chuva', icon: '💧' },
  soil: { name: 'Saúde do solo', text: 'Palhada, matéria orgânica e cobertura', icon: '🌱' },
  risk: { name: 'Menos risco climático', text: 'Proteção contra seca, calor e El Niño', icon: '🛡️' },
  inputs: { name: 'Menos adubo', text: 'Aproveitar o nitrogênio das leguminosas', icon: '🧪' },
  production: { name: 'Produção de grãos', text: 'Manter o talhão produzindo grão', icon: '🌾' },
}
export type Priority = keyof typeof priorities
export const criteria = ['Água', 'Solo', 'Clima', 'Lucro'] as const
/** Pesos de água, solo, clima e lucro. */
export const weights: Record<Priority, readonly [number, number, number, number]> = {
  balanced: [.25, .25, .25, .25], profit: [.15, .1, .2, .55], water: [.55, .15, .15, .15], soil: [.15, .55, .15, .15],
  risk: [.3, .1, .45, .15], inputs: [.15, .45, .15, .25], production: [.2, .1, .3, .4],
}

export function seasonOf(month: number) {
  if (month >= 8) return { name: 'Safra de verão', text: 'Início das chuvas: época das culturas principais.' }
  if (month <= 3) return { name: 'Safrinha (2ª safra)', text: 'Plantio logo após a colheita de verão, com as últimas chuvas.' }
  return { name: 'Inverno / entressafra', text: 'Pouca chuva na maior parte do Brasil: cobertura ou culturas de inverno.' }
}

export interface Farm {
  name: string; area: string; crop: Crop; soil: Soil; irrigated: boolean; priority: Priority; month: number
  prices: Partial<Record<Crop, { yield?: number; price?: number; cost?: number }>>
}
export const defaultFarm: Farm = { name: '', area: '100', crop: 'soybean', soil: 'unknown', irrigated: false, priority: 'balanced', month: 1, prices: {} }
export const nitrogenSaving = 350 // R$/ha de adubo nitrogenado poupado na cultura seguinte (≈ 50 kg N/ha)
export const methodology = 'Para cada cultura que pode ser plantada no mês escolhido, o EarthVision olha os meses do ciclo no ano histórico da NASA POWER. Água compara a chuva do ciclo com a necessidade da cultura e é ajustada pela umidade do solo (MERRA-2). Solo valoriza trocar de família, plantas de cobertura, fixação de nitrogênio e o NDVI do MODIS (solo descoberto). Clima mede o quanto a temperatura fica fora da faixa ideal e quantos dias passam de 35 °C. Lucro usa produtividade × preço − custo, mais a economia de adubo deixada por leguminosas. A nota final pondera esses quatro pontos conforme a prioridade.'
export const limits = 'Os dados da NASA são estimativas regionais (grade de ~50 km). Preços, custos e produtividades são referências editáveis. El Niño e La Niña mostram tendências, não previsões. Confirme com o agrônomo antes de decidir.'
export const fao = 'https://www.fao.org/4/s2022e/s2022e07.htm'
export const embrapa = 'https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1190579'

const cap = (score: number) => Math.min(100, Math.max(0, Math.round(score)))
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
export function economics(farm: Farm, crop: Crop) {
  const base = crops[crop], custom = farm.prices[crop] ?? {}
  const yieldHa = custom.yield ?? base.yield, price = custom.price ?? base.price, cost = custom.cost ?? base.cost
  return { yieldHa, price, cost, revenue: yieldHa * price, profit: yieldHa * price - cost, unit: base.unit }
}

export interface Strategy {
  id: Crop; name: string; kind: string; description: string; sequence: string; reasons: string[]; risks: string[]
  months: string; waterNeed: number; windowRain: number | null; windowTemperature: number | null
  windowSoilMoisture: number | null; windowHeatDays: number | null; windowNdvi: number | null
  scores: [number | null, number, number | null, number]; total: number | null
  profitHa: number; revenueHa: number; costHa: number; nSaving: number; waterSaved: number
}
const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
export function candidates(farm: Farm) {
  return cropList.filter((crop) => crop !== farm.crop && crops[crop].plant.includes(farm.month))
}
export function compare(farm: Farm, climate: Climate | null, ndvi: Ndvi | null = null, top = 3): Strategy[] {
  const current = crops[farm.crop]
  const currentProfit = economics(farm, farm.crop).profit
  return candidates(farm).map((id): Strategy => {
    const crop: CropInfo = crops[id]
    const months = Array.from({ length: crop.cycle }, (_, i) => (farm.month + i) % 12)
    const data = months.map((m) => climate?.months[m])
    const windowRain = climate && data.every((m) => m?.rain != null) ? data.reduce((s, m) => s + (m?.rain ?? 0), 0) : null
    const windowTemperature = climate && data.every((m) => m?.temperature != null) ? mean(data.map((m) => m!.temperature!)) : null
    const soilValues = data.flatMap((m) => m?.soilMoisture == null ? [] : [m.soilMoisture])
    const windowSoilMoisture = soilValues.length === months.length ? mean(soilValues) : null
    const windowHeatDays = climate && data.every((m) => m?.heatDays != null) ? data.reduce((s, m) => s + (m?.heatDays ?? 0), 0) : null
    const windowNdvi = ndvi ? mean(months.flatMap((m) => ndvi.months[m]?.ndvi == null ? [] : [ndvi.months[m].ndvi!])) : null
    const differentFamily = crop.family !== current.family
    const cover = crop.kind === 'cobertura'

    const moistureFactor = windowSoilMoisture === null ? 1 : 0.85 + 0.3 * Math.min(1, Math.max(0, (windowSoilMoisture - 0.3) / 0.5))
    let water = windowRain === null ? null : cap(windowRain / crop.water * 100 * moistureFactor)
    if (water !== null && farm.irrigated) water = Math.max(water, 80)
    const soil = cap(30 + (differentFamily ? 22 : 0) + (cover ? 25 : 8) + (crop.fixesNitrogen ? 12 : 0)
      + (farm.soil === 'sandy' && cover ? 10 : 0) + (farm.soil === 'clay' && (id === 'millet' || id === 'brachiaria') ? 6 : 0)
      + (windowNdvi !== null && windowNdvi < 0.4 && cover ? 8 : 0))
    const [low, high] = crop.temperature
    const climateScore = windowTemperature === null ? null :
      cap(100 - Math.max(low - windowTemperature, windowTemperature - high, 0) * 12 - Math.min(30, (windowHeatDays ?? 0) * (crop.droughtTolerant ? 0.3 : 0.7)) + (crop.droughtTolerant ? 5 : 0))
    const eco = economics(farm, id)
    const nSaving = crop.fixesNitrogen ? nitrogenSaving : 0
    const profitScore = cap(45 + (eco.profit + nSaving) / 80)
    const scores: Strategy['scores'] = [water, soil, climateScore, profitScore]
    const w = weights[farm.priority]
    const total = water === null || climateScore === null ? null : cap(water * w[0] + soil * w[1] + climateScore * w[2] + profitScore * w[3] + (farm.priority === 'inputs' && crop.fixesNitrogen ? 8 : 0) - (farm.priority === 'production' && cover ? 15 : 0))

    const reasons: string[] = []
    if (differentFamily) reasons.push('Troca de família (' + current.family + ' → ' + crop.family + '): quebra o ciclo de pragas e doenças.')
    if (crop.fixesNitrogen) reasons.push('Fixa nitrogênio: economia estimada de R$ ' + nitrogenSaving + '/ha em adubo na próxima cultura.')
    if (cover) reasons.push('Cobre o solo e forma palhada, reduzindo erosão e perda de água.')
    if (crop.droughtTolerant) reasons.push('Tolera bem seca e calor.')
    if (eco.profit > 0) reasons.push('Lucro estimado de R$ ' + Math.round(eco.profit).toLocaleString('pt-BR') + '/ha.')
    const risks: string[] = []
    if (!differentFamily) risks.push('Mesma família da cultura atual: atenção a pragas e doenças em comum.')
    if (windowRain !== null && windowRain < crop.water) risks.push(farm.irrigated ? 'Chuva abaixo da necessidade: será preciso irrigar.' : 'Chuva histórica abaixo da necessidade da cultura (' + Math.round(windowRain) + ' de ' + crop.water + ' mm).')
    if (windowSoilMoisture !== null && windowSoilMoisture < 0.4) risks.push('Solo historicamente seco nesta época (NASA MERRA-2).')
    if (windowHeatDays !== null && windowHeatDays >= 10) risks.push(windowHeatDays + ' dias acima de 35 °C no ciclo: risco no florescimento.')
    if (windowTemperature !== null && (windowTemperature < low || windowTemperature > high)) risks.push('Temperatura média fora da faixa ideal (' + low + '–' + high + ' °C).')
    if (windowNdvi !== null && windowNdvi < 0.4 && !cover) risks.push('Satélite (MODIS) mostra solo pouco coberto nesta época; considere cobertura depois.')
    if (cover) risks.push('Não gera venda de grão: o retorno vem do solo e da próxima safra.')
    return {
      id, name: crop.name, kind: crop.kind, description: crop.description, sequence: current.name + ' → ' + crop.name, reasons, risks,
      months: monthShort[months[0]] + '–' + monthShort[months[months.length - 1]], waterNeed: crop.water,
      windowRain, windowTemperature, windowSoilMoisture, windowHeatDays, windowNdvi, scores, total,
      profitHa: eco.profit, revenueHa: eco.revenue, costHa: eco.cost, nSaving, waterSaved: Math.max(0, current.water - crop.water),
    }
  }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1) || b.scores[3] - a.scores[3]).slice(0, top)
}

/** Problemas da região a partir dos dados da NASA. */
export function regionProblems(climate: Climate | null, ndvi: Ndvi | null, impact: EnsoImpact, soil: Soil) {
  const problems: { title: string; text: string; level: 'alto' | 'médio' }[] = []
  if (climate?.dryMonths != null && climate.dryMonths >= 4) problems.push({ title: 'Estação seca longa', text: climate.dryMonths + ' meses com menos de 60 mm de chuva. A janela de plantio é curta.', level: climate.dryMonths >= 6 ? 'alto' : 'médio' })
  const monthlyRain = climate?.months.map((m) => m.rain ?? 0) ?? []
  if (climate?.rain && Math.max(...monthlyRain) > climate.rain * 0.22) problems.push({ title: 'Chuva concentrada', text: 'Muita chuva em poucos meses aumenta erosão e perda de nutrientes.', level: 'médio' })
  if (climate?.heatDays != null && climate.heatDays >= 20) problems.push({ title: 'Calor extremo', text: climate.heatDays + ' dias acima de 35 °C no ano: risco de abortamento de flores.', level: climate.heatDays >= 60 ? 'alto' : 'médio' })
  if (climate?.soilMoisture != null && climate.soilMoisture < 0.45) problems.push({ title: 'Solo seco', text: 'Umidade média do solo baixa (NASA MERRA-2). Palhada ajuda a guardar água.', level: 'médio' })
  if (climate?.rain != null && climate.rain < 700) problems.push({ title: 'Pouca chuva no ano', text: Math.round(climate.rain) + ' mm no ano: prefira culturas tolerantes à seca.', level: 'alto' })
  if (ndvi?.low != null && ndvi.low < 0.35) problems.push({ title: 'Solo descoberto parte do ano', text: 'O satélite MODIS mostra pouca vegetação em alguns meses. Plantas de cobertura protegem o solo.', level: 'médio' })
  if (impact.elnino < 0.9 || impact.lanina < 0.9) problems.push({ title: 'Sensível a El Niño / La Niña', text: impact.elnino < impact.lanina ? 'El Niño: ' + impact.elninoText : 'La Niña: ' + impact.laninaText, level: 'alto' })
  if (soil === 'sandy') problems.push({ title: 'Solo arenoso', text: 'Retém pouca água e nutrientes; manter palhada é essencial.', level: 'médio' })
  return problems
}

/** Plano de 3 anos (6 safras): cultura atual na 1ª safra e rotação na 2ª, comparado a cultura atual + pousio. */
export type Scenario = 'neutral' | 'elnino' | 'lanina'
export interface PlanSeason { label: string; crop: string; soil: number; baselineSoil: number; profit: Record<Scenario, number>; baseline: number }
export function longTermPlan(farm: Farm, strategies: Strategy[], climate: Climate | null, impact: EnsoImpact) {
  const area = Math.max(0, Number(farm.area) || 0) || 1
  const cash = strategies.find((s) => s.kind !== 'cobertura') ?? null
  const cover = strategies.find((s) => s.kind === 'cobertura') ?? null
  const rotation = [cash ?? cover, cover ?? cash, cash ?? cover].filter(Boolean) as Strategy[]
  const current = economics(farm, farm.crop)
  const drought = climate?.dryMonths != null && climate.dryMonths >= 5 ? 0.95 : 1
  const factors: Record<Scenario, number> = { neutral: 1, elnino: impact.elnino, lanina: impact.lanina }
  const seasons: PlanSeason[] = []
  let soil = 50, baselineSoil = 50, nCredit = 0, baseline = 0
  const totals: Record<Scenario, number> = { neutral: 0, elnino: 0, lanina: 0 }
  for (let i = 0; i < 6; i++) {
    const year = Math.floor(i / 2)
    const second = i % 2 === 1
    const item = second ? rotation[year] : null
    if (second && !item) continue
    const profit = second ? item!.profitHa : current.profit + nCredit
    const revenue = second ? item!.revenueHa : current.revenue
    soil = Math.min(100, soil + (second ? (item!.kind === 'cobertura' ? 10 : 6) : 0) - (second ? 0 : 2))
    if (!second) baselineSoil = Math.max(20, baselineSoil - 4)
    nCredit = second ? item!.nSaving : 0
    const soilBonus = 1 + (soil - 50) / 300
    for (const key of Object.keys(totals) as Scenario[]) totals[key] += (profit * soilBonus * drought - revenue * (1 - factors[key])) * area
    if (!second) baseline += (current.profit - current.revenue * (50 - baselineSoil) / 300) * drought * area
    seasons.push({ label: 'Ano ' + (year + 1) + (second ? ' · 2ª safra' : ' · 1ª safra'), crop: second ? item!.name : crops[farm.crop].name + (nCredit ? '' : ''), soil: Math.round(soil), baselineSoil: Math.round(baselineSoil), profit: { ...totals }, baseline })
  }
  return { seasons, cash, cover, area }
}
