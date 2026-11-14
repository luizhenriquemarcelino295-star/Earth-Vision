import type { Climate } from './power'
import type { Ndvi } from './ndvi'
import type { EnsoImpact } from './enso'
import type { Terrain } from './terrain'

/**
 * Culturas com dados indicativos (Brasil). Água: necessidade no ciclo (FAO/Embrapa).
 * Produtividade, preço e custo são valores de referência que o usuário pode alterar.
 */
export interface CropInfo {
  name: string; family: string; kind: 'grão' | 'cobertura' | 'fibra'; description: string
  water: number; temperature: readonly [number, number]; cycle: number; plant: readonly number[]
  yield: number; unit: string; price: number; cost: number; fixesNitrogen: boolean; droughtTolerant: boolean
  forage: boolean; deepRoots: boolean; frostTolerant: boolean
}
export const crops = {
  soybean: { name: 'Soja', family: 'leguminosa', kind: 'grão', description: 'Leguminosa que fixa nitrogênio do ar no solo. Principal safra de verão, sensível à seca no enchimento de grãos.', water: 550, temperature: [20, 30], cycle: 4, plant: [8, 9, 10, 11], yield: 60, unit: 'sc', price: 120, cost: 4200, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  corn: { name: 'Milho', family: 'gramínea', kind: 'grão', description: 'Gramínea de alto potencial produtivo e muita palhada. Exige água no florescimento e bastante nitrogênio.', water: 600, temperature: [18, 30], cycle: 5, plant: [0, 1, 2, 8, 9, 10, 11], yield: 110, unit: 'sc', price: 60, cost: 5000, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: false },
  sorghum: { name: 'Sorgo', family: 'gramínea', kind: 'grão', description: 'Parecido com o milho, porém mais resistente à seca e ao calor. Boa opção de safrinha tardia.', water: 450, temperature: [20, 34], cycle: 4, plant: [0, 1, 2, 3], yield: 80, unit: 'sc', price: 50, cost: 2600, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  beans: { name: 'Feijão', family: 'leguminosa', kind: 'grão', description: 'Ciclo curto (cerca de 90 dias) e bom preço. Fixa nitrogênio, mas sofre com calor no florescimento.', water: 350, temperature: [17, 28], cycle: 3, plant: [0, 1, 2, 3, 4, 9, 10, 11], yield: 30, unit: 'sc', price: 250, cost: 4500, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  wheat: { name: 'Trigo', family: 'gramínea', kind: 'grão', description: 'Cereal de inverno para regiões frias ou com irrigação. Quebra o ciclo de pragas da soja.', water: 450, temperature: [10, 24], cycle: 4, plant: [3, 4, 5], yield: 55, unit: 'sc', price: 80, cost: 3800, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: true },
  cotton: { name: 'Algodão', family: 'malvácea', kind: 'fibra', description: 'Cultura de alto valor e alto custo, de ciclo longo. Exige manejo intensivo de pragas.', water: 700, temperature: [20, 32], cycle: 6, plant: [10, 11, 0], yield: 300, unit: '@', price: 130, cost: 12000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: true, frostTolerant: false },
  millet: { name: 'Milheto', family: 'gramínea', kind: 'cobertura', description: 'Planta de cobertura rústica que cresce com pouca chuva. Raízes profundas descompactam o solo.', water: 400, temperature: [20, 34], cycle: 3, plant: [1, 2, 3, 4, 7, 8, 9], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  crotalaria: { name: 'Crotalária', family: 'leguminosa', kind: 'cobertura', description: 'Adubo verde que fixa nitrogênio e reduz nematoides. Muito usada antes da soja ou do milho.', water: 350, temperature: [20, 32], cycle: 3, plant: [1, 2, 3, 8, 9, 10], yield: 0, unit: 'sc', price: 0, cost: 450, fixesNitrogen: true, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  brachiaria: { name: 'Braquiária', family: 'gramínea', kind: 'cobertura', description: 'Capim que forma palhada duradoura e pode virar pasto (integração lavoura-pecuária).', water: 400, temperature: [18, 35], cycle: 4, plant: [0, 1, 2, 3], yield: 0, unit: 'sc', price: 0, cost: 350, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  oat: { name: 'Aveia', family: 'gramínea', kind: 'cobertura', description: 'Cobertura de inverno para regiões frias. Protege o solo e controla plantas daninhas.', water: 350, temperature: [8, 22], cycle: 3, plant: [3, 4, 5], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  peanut: { name: 'Amendoim', family: 'leguminosa', kind: 'grão', description: 'Leguminosa de ciclo curto muito usada na reforma de canavial. Fixa nitrogênio e gosta de solo arenoso.', water: 500, temperature: [20, 32], cycle: 4, plant: [0, 1, 8, 9, 10], yield: 110, unit: 'sc 25 kg', price: 85, cost: 7500, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  sunflower: { name: 'Girassol', family: 'asterácea', kind: 'grão', description: 'Oleaginosa de raiz pivotante profunda. Tolera seca e é boa opção de safrinha.', water: 450, temperature: [18, 30], cycle: 4, plant: [0, 1, 2, 7, 8], yield: 30, unit: 'sc', price: 110, cost: 2800, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  rice: { name: 'Arroz', family: 'gramínea', kind: 'grão', description: 'Cereal para várzeas irrigadas ou terras altas com boa chuva. Exige muita água.', water: 800, temperature: [20, 32], cycle: 4, plant: [9, 10, 11], yield: 140, unit: 'sc', price: 75, cost: 8000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  barley: { name: 'Cevada', family: 'gramínea', kind: 'grão', description: 'Cereal de inverno para regiões frias, vendido para malteria. Exige contrato de compra.', water: 400, temperature: [8, 22], cycle: 4, plant: [4, 5, 6], yield: 60, unit: 'sc', price: 85, cost: 3600, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  radish: { name: 'Nabo forrageiro', family: 'brassicácea', kind: 'cobertura', description: 'Cobertura de outono e inverno com raiz grossa que rompe compactação e recicla nutrientes.', water: 300, temperature: [10, 26], cycle: 3, plant: [2, 3, 4, 5], yield: 0, unit: 'sc', price: 0, cost: 300, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: true },
  sesame: { name: 'Gergelim', family: 'pedaliácea', kind: 'grão', description: 'Oleaginosa de clima quente que tolera períodos secos e requer solo bem drenado.', water: 400, temperature: [21, 34], cycle: 3, plant: [0, 1, 2, 9, 10, 11], yield: 1, unit: 't', price: 4800, cost: 3100, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  canola: { name: 'Canola', family: 'brassicácea', kind: 'grão', description: 'Oleaginosa de outono e inverno. Diversifica a rotação com cereais e leguminosas.', water: 450, temperature: [10, 24], cycle: 4, plant: [3, 4, 5], yield: 1.6, unit: 't', price: 2300, cost: 3000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: true, frostTolerant: false },
  rye: { name: 'Centeio', family: 'gramínea', kind: 'cobertura', description: 'Cereal rústico de inverno que protege o solo e pode fornecer forragem.', water: 350, temperature: [6, 22], cycle: 4, plant: [3, 4, 5, 6], yield: 0, unit: 't', price: 0, cost: 480, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: true, frostTolerant: true },
  vetch: { name: 'Ervilhaca', family: 'leguminosa', kind: 'cobertura', description: 'Leguminosa de inverno usada como cobertura, com potencial de fixar nitrogênio.', water: 350, temperature: [8, 23], cycle: 4, plant: [3, 4, 5, 6], yield: 0, unit: 't', price: 0, cost: 650, fixesNitrogen: true, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  pigeonpea: { name: 'Feijão-guandu', family: 'leguminosa', kind: 'cobertura', description: 'Leguminosa tropical usada para adubação verde e forragem, com raízes profundas.', water: 450, temperature: [20, 32], cycle: 4, plant: [0, 1, 8, 9, 10, 11], yield: 0, unit: 't', price: 0, cost: 520, fixesNitrogen: true, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
} satisfies Record<string, CropInfo>
export type Crop = keyof typeof crops
export const cropList = (Object.keys(crops) as Crop[]).sort((a, b) => crops[a].name.localeCompare(crops[b].name, 'pt-BR'))

export const soils = {
  unknown: { name: 'Não sei', text: 'Usaremos valores médios. Uma análise de solo melhora muito a recomendação.' },
  sandy: { name: 'Arenoso', text: 'Seca rápido e perde nutrientes. Palhada e cobertura fazem muita diferença.' },
  loam: { name: 'Textura média', text: 'Equilíbrio entre drenagem e retenção de água.' },
  clay: { name: 'Argiloso', text: 'Segura mais água, mas pode compactar. Raízes profundas ajudam.' },
  heavyClay: { name: 'Muito argiloso (terra roxa)', text: 'Fértil e com boa retenção de água, mas compacta fácil com máquina pesada.' },
  silty: { name: 'Siltoso', text: 'Forma crosta na superfície e sofre erosão com chuva forte. Palhada é essencial.' },
  shallow: { name: 'Raso ou pedregoso', text: 'Pouca profundidade para as raízes e pouca água guardada. Alto risco de erosão.' },
  wet: { name: 'Encharcado (várzea)', text: 'Fica com água parada boa parte do ano. Bom para arroz; ruim para soja e feijão.' },
  organic: { name: 'Orgânico (turfoso)', text: 'Muita matéria orgânica e água, mas afunda e pode encharcar.' },
}
export type Soil = keyof typeof soils

export const priorities = {
  balanced: { name: 'Equilíbrio', text: 'Um pouco de tudo', icon: '⚖️' },
  profit: { name: 'Lucro', text: 'Maior retorno por hectare', icon: '💰' },
  water: { name: 'Economizar água', text: 'Culturas que pedem menos chuva', icon: '💧' },
  soil: { name: 'Saúde do solo', text: 'Palhada, matéria orgânica e cobertura', icon: '🌱' },
  risk: { name: 'Menos risco climático', text: 'Proteção contra seca, calor e El Niño', icon: '🛡️' },
  inputs: { name: 'Menos adubo', text: 'Aproveitar o nitrogênio das leguminosas', icon: '🧪' },
  erosion: { name: 'Evitar erosão', text: 'Proteger solo em declive e chuva forte', icon: '⛰️' },
  forage: { name: 'Pasto / forragem', text: 'Alimentar o gado na entressafra', icon: '🐄' },
  production: { name: 'Produção de grãos', text: 'Manter o talhão produzindo grão', icon: '🌾' },
}
export type Priority = keyof typeof priorities
export const criteria = ['Água', 'Solo', 'Clima', 'Lucro'] as const
/** Pesos de água, solo, clima e lucro. */
export const weights: Record<Priority, readonly [number, number, number, number]> = {
  balanced: [.25, .25, .25, .25], profit: [.15, .1, .2, .55], water: [.55, .15, .15, .15], soil: [.15, .55, .15, .15],
  risk: [.3, .1, .45, .15], inputs: [.15, .45, .15, .25], production: [.2, .1, .3, .4],
  erosion: [.15, .55, .15, .15], forage: [.2, .3, .2, .3],
}

export function seasonOf(month: number) {
  if (month >= 8) return { name: 'Safra de verão', text: 'Início das chuvas: época das culturas principais.' }
  if (month <= 3) return { name: 'Safrinha (2ª safra)', text: 'Plantio logo após a colheita de verão, com as últimas chuvas.' }
  return { name: 'Inverno / entressafra', text: 'Pouca chuva na maior parte do Brasil: cobertura ou culturas de inverno.' }
}

export interface Farm {
  name: string; area: string; crop: Crop; soil: Soil; irrigated: boolean; priority: Priority; month: number
  prices: Partial<Record<Crop, { yield?: number; price?: number; cost?: number }>>
  /** Culturas que o produtor consegue vender na região (restrição de mercado). */
  markets: string[]
  /** Tem plantadeira para sementes miúdas (milheto, braquiária, crotalária, aveia)? */
  smallSeedPlanter: boolean
  /** Cria gado (valoriza forragem)? */
  cattle: boolean
}
export const defaultFarm: Farm = { name: '', area: '100', crop: 'soybean', soil: 'unknown', irrigated: false, priority: 'balanced', month: 1, prices: {}, markets: ['soybean', 'corn', 'beans', 'sorghum', 'wheat', 'cotton'], smallSeedPlanter: true, cattle: false }
const smallSeeds: Crop[] = ['millet', 'brachiaria', 'crotalaria', 'oat', 'radish', 'sesame', 'canola']
/** O que o produtor consegue vender na região. Anuais entram na rotação; perenes e outros servem de contexto. */
export const marketGroups: { group: string; items: { id: string; name: string }[] }[] = [
  { group: 'Grãos e fibras', items: cropList.filter((c) => crops[c].kind !== 'cobertura').map((c) => ({ id: c, name: crops[c].name })) },
  { group: 'Culturas perenes', items: [['coffee', 'Café'], ['sugarcane', 'Cana-de-açúcar'], ['orange', 'Laranja'], ['banana', 'Banana'], ['grape', 'Uva'], ['mango', 'Manga'], ['cocoa', 'Cacau'], ['eucalyptus', 'Eucalipto']].map(([id, name]) => ({ id, name })) },
  { group: 'Outros', items: [['cassava', 'Mandioca'], ['vegetables', 'Hortaliças'], ['beef', 'Gado de corte'], ['dairy', 'Leite'], ['silage', 'Silagem / feno']].map(([id, name]) => ({ id, name })) },
]
export const marketName = (id: string) => marketGroups.flatMap((g) => g.items).find((i) => i.id === id)?.name ?? id
export const nitrogenSaving = 350 // R$/ha de adubo nitrogenado poupado na cultura seguinte (≈ 50 kg N/ha)
export const methodology = 'A comparação sempre inclui a rotação atual (repetir a cultura ou deixar o solo parado) e as melhores alternativas. Para cada cultura que pode ser plantada no mês escolhido, o EarthVision olha os meses do ciclo no ano histórico da NASA POWER. Água compara a chuva do ciclo com a necessidade da cultura e é ajustada pela umidade do solo (MERRA-2). Solo valoriza trocar de família, plantas de cobertura, fixação de nitrogênio e o NDVI do MODIS (solo descoberto). Clima mede o quanto a temperatura fica fora da faixa ideal, os dias acima de 35 °C e os dias com risco de geada. A declividade do SRTM e os dias de chuva extrema aumentam o peso da cobertura contra a erosão. O balanço hídrico compara a chuva com a evapotranspiração de referência (Hargreaves) calculada com temperatura e radiação da NASA POWER. Lucro usa produtividade × preço − custo, mais a economia de adubo deixada por leguminosas. A nota final pondera esses quatro pontos conforme a prioridade.'
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
  id: Crop | 'fallow'; name: string; kind: string; description: string; sequence: string; isCurrent: boolean
  why: string; reasons: string[]; evidence: string[]; risks: string[]; gaps: string[]
  months: string; waterNeed: number; windowRain: number | null; windowEt: number | null; windowTemperature: number | null
  windowSoilMoisture: number | null; windowHeatDays: number | null; windowFrostDays: number | null; windowNdvi: number | null
  scores: [number | null, number, number | null, number]; total: number | null
  profitHa: number; revenueHa: number; costHa: number; nSaving: number; waterSaved: number
}
const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
/** Culturas possíveis no mês, respeitando mercado e equipamento informados pelo produtor. */
export function candidates(farm: Farm) {
  return cropList.filter((crop) => crop !== farm.crop && crops[crop].plant.includes(farm.month)
    && (crops[crop].kind === 'cobertura' || farm.markets.includes(crop))
    && (farm.smallSeedPlanter || !smallSeeds.includes(crop)))
}
const fmt = (value: number, digits = 0) => value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })

function evaluate(id: Crop | 'fallow', farm: Farm, climate: Climate | null, ndvi: Ndvi | null, terrain: Terrain | null, isCurrent: boolean): Strategy {
  const current: CropInfo = crops[farm.crop]
  const fallow = id === 'fallow'
  const crop: CropInfo = fallow ? { ...current, name: 'Pousio (solo parado)', family: '—', kind: 'cobertura', description: 'Deixar o talhão sem cultura até a próxima safra.', water: 0, temperature: [-50, 60], cycle: 4, yield: 0, price: 0, cost: 120, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: false, frostTolerant: true } : crops[id]
  const months = Array.from({ length: crop.cycle }, (_, i) => (farm.month + i) % 12)
  const data = months.map((m) => climate?.months[m])
  const all = <K extends keyof NonNullable<typeof data[0]>>(key: K) => climate !== null && data.every((m) => m?.[key] != null)
  const total = (key: 'rain' | 'eto' | 'heatDays' | 'frostDays' | 'heavyRainDays') => all(key) ? data.reduce((s, m) => s + (m![key] as number), 0) : null
  const windowRain = total('rain'), windowEt = total('eto'), windowHeatDays = total('heatDays'), windowFrostDays = total('frostDays'), heavyRain = total('heavyRainDays')
  const windowTemperature = all('temperature') ? mean(data.map((m) => m!.temperature!)) : null
  const windowSoilMoisture = all('soilMoisture') ? mean(data.map((m) => m!.soilMoisture!)) : null
  const windowNdvi = ndvi ? mean(months.flatMap((m) => ndvi.months[m]?.ndvi == null ? [] : [ndvi.months[m].ndvi!])) : null
  const differentFamily = !fallow && crop.family !== current.family
  const cover = crop.kind === 'cobertura' && !fallow
  const steep = (terrain !== null && terrain.slope >= 8) || farm.soil === 'shallow' || farm.soil === 'silty'
  const erosive = steep || (heavyRain ?? 0) >= 2

  const moistureFactor = windowSoilMoisture === null ? 1 : 0.85 + 0.3 * Math.min(1, Math.max(0, (windowSoilMoisture - 0.3) / 0.5))
  const soilWater: Record<Soil, number> = { unknown: 1, sandy: .88, loam: 1, clay: 1.05, heavyClay: 1.08, silty: 1, shallow: .85, wet: 1.2, organic: 1.12 }
  const waterlogSensitive = ['soybean', 'beans', 'peanut', 'cotton', 'sunflower', 'crotalaria'].includes(id)
  let water = windowRain === null ? null : fallow ? 100 : cap(windowRain / crop.water * 100 * moistureFactor * soilWater[farm.soil])
  if (water !== null && farm.irrigated) water = Math.max(water, 80)
  const soil = fallow ? cap(15 - (erosive ? 10 : 0) + (windowNdvi !== null && windowNdvi > 0.5 ? 10 : 0)) : cap(30 + (differentFamily ? 22 : 0) + (cover ? 25 : 8) + (crop.fixesNitrogen ? 12 : 0) + (crop.deepRoots ? 6 : 0)
    + (farm.soil === 'sandy' && cover ? 10 : 0) + ((farm.soil === 'clay' || farm.soil === 'heavyClay') && crop.deepRoots ? 6 : 0)
    + ((farm.soil === 'silty' || farm.soil === 'shallow') && cover ? 8 : 0)
    + (windowNdvi !== null && windowNdvi < 0.4 && cover ? 8 : 0) + (erosive && (cover || crop.deepRoots) ? 8 : 0) - (isCurrent && !fallow ? 15 : 0))
  const [low, high] = crop.temperature
  const frostPenalty = (crop.frostTolerant ? 0 : Math.min(40, (windowFrostDays ?? 0) * 8)) + (farm.soil === 'wet' && waterlogSensitive ? 20 : 0) + (id === 'rice' && farm.soil !== 'wet' && !farm.irrigated ? 25 : 0)
  const climateScore = windowTemperature === null ? null : fallow ? 100 :
    cap(100 - Math.max(low - windowTemperature, windowTemperature - high, 0) * 12 - Math.min(30, (windowHeatDays ?? 0) * (crop.droughtTolerant ? 0.3 : 0.7)) - frostPenalty + (crop.droughtTolerant ? 5 : 0))
  const eco = fallow ? { yieldHa: 0, price: 0, cost: crop.cost, revenue: 0, profit: -crop.cost, unit: '' } : economics(farm, id as Crop)
  const nSaving = crop.fixesNitrogen && !fallow ? nitrogenSaving : 0
  const forageValue = farm.cattle && crop.forage ? 600 : 0
  const profitScore = cap(45 + (eco.profit + nSaving + forageValue) / 80)
  const scores: Strategy['scores'] = [water, soil, climateScore, profitScore]
  const w = weights[farm.priority]
  const bonus = (farm.priority === 'inputs' && crop.fixesNitrogen ? 8 : 0) - (farm.priority === 'production' && (cover || fallow) ? 15 : 0)
    + (farm.priority === 'forage' && crop.forage ? 15 : 0) + (farm.priority === 'erosion' && (cover || crop.deepRoots) ? 10 : 0)
  const totalScore = water === null || climateScore === null ? null : cap(water * w[0] + soil * w[1] + climateScore * w[2] + profitScore * w[3] + bonus)

  const why = isCurrent ? 'É o que você faz hoje: serve de referência para comparar as outras opções.'
    : cover ? 'Sugerida para proteger e recuperar o solo na ' + seasonOf(farm.month).name.toLowerCase() + (erosive ? ', com risco de erosão na área.' : '.')
    : crop.droughtTolerant ? 'Sugerida por aguentar melhor seca e calor nesta época.' : 'Sugerida por gerar renda na janela escolhida trocando a família da cultura.'
  const reasons: string[] = []
  if (differentFamily) reasons.push('Troca de família (' + current.family + ' → ' + crop.family + '): interrompe o ciclo de pragas e doenças.')
  if (crop.fixesNitrogen && !fallow) reasons.push('Fixa nitrogênio do ar: economia estimada de R$ ' + nitrogenSaving + '/ha em adubo na próxima cultura.')
  if (cover) reasons.push('Cobre o solo e forma palhada: menos erosão, mais matéria orgânica e mais água infiltrando.')
  if (crop.deepRoots && !fallow) reasons.push('Raízes profundas: rompem camadas compactadas e buscam água mais funda.')
  if (crop.droughtTolerant && !fallow) reasons.push('Tolera seca e calor.')
  if (crop.forage && !fallow) reasons.push(farm.cattle ? 'Serve de forragem para o gado na entressafra (valor estimado R$ 600/ha).' : 'Pode servir de forragem para gado.')
  if (eco.profit > 0) reasons.push('Lucro estimado de R$ ' + fmt(eco.profit) + '/ha.')
  if (fallow) reasons.push('Sem custo de semente e sem uso de água pela cultura.')

  const evidence: string[] = []
  if (windowRain !== null) evidence.push('Chuva no ciclo (NASA POWER): ' + fmt(windowRain) + ' mm' + (fallow ? '' : ' para ' + crop.water + ' mm de necessidade.'))
  if (windowRain !== null && windowEt !== null) evidence.push('Balanço hídrico (chuva − evapotranspiração): ' + fmt(windowRain - windowEt) + ' mm no período.')
  if (windowTemperature !== null) evidence.push('Temperatura média ' + fmt(windowTemperature, 1) + ' °C' + (fallow ? '.' : ' (ideal ' + low + '–' + high + ' °C).'))
  if (windowSoilMoisture !== null) evidence.push('Umidade do solo (MERRA-2): ' + fmt(windowSoilMoisture * 100) + '%.')
  if (windowHeatDays !== null) evidence.push(windowHeatDays + ' dias acima de 35 °C' + (windowFrostDays !== null ? ' e ' + windowFrostDays + ' com risco de geada.' : '.'))
  if (windowNdvi !== null) evidence.push('Vegetação (NDVI MODIS) nesta época: ' + fmt(windowNdvi, 2) + (windowNdvi < 0.4 ? ' (solo pouco coberto).' : '.'))
  if (terrain) evidence.push('Declividade (SRTM): ' + fmt(terrain.slope, 1) + '%, risco de erosão ' + terrain.erosion + '.')

  const risks: string[] = []
  if (fallow) risks.push('Solo descoberto: erosão, perda de água e crescimento de plantas daninhas.')
  if (isCurrent && !fallow) risks.push('Repetir a mesma cultura favorece pragas, doenças e nematoides.')
  else if (!differentFamily && !fallow) risks.push('Mesma família da cultura atual: atenção a pragas e doenças em comum.')
  if (!fallow && windowRain !== null && windowRain < crop.water) risks.push(farm.irrigated ? 'Chuva abaixo da necessidade: será preciso irrigar.' : 'Chuva histórica abaixo da necessidade da cultura.')
  if (!fallow && windowSoilMoisture !== null && windowSoilMoisture < 0.4) risks.push('Solo historicamente seco nesta época.')
  if (!fallow && windowHeatDays !== null && windowHeatDays >= 10) risks.push('Muitos dias de calor extremo: risco no florescimento.')
  if (!fallow && !crop.frostTolerant && (windowFrostDays ?? 0) > 0) risks.push('Risco de geada durante o ciclo.')
  if (!fallow && farm.soil === 'wet' && waterlogSensitive) risks.push('Não tolera solo encharcado: precisa de drenagem.')
  if (id === 'rice' && farm.soil !== 'wet' && !farm.irrigated) risks.push('Arroz precisa de várzea ou irrigação.')
  if (!fallow && farm.soil === 'shallow' && !crop.droughtTolerant) risks.push('Solo raso guarda pouca água para as raízes.')
  if (!fallow && windowTemperature !== null && (windowTemperature < low || windowTemperature > high)) risks.push('Temperatura média fora da faixa ideal.')
  if (cover) risks.push('Não gera venda de grão: o retorno vem do solo, da economia de adubo e da próxima safra.')
  if (!fallow && smallSeeds.includes(id as Crop)) risks.push('Exige plantadeira para sementes miúdas ou semeadura a lanço.')

  if (!risks.length) risks.push('Nenhum risco climático forte nos dados; confirme a janela de plantio e a cultivar com o agrônomo.')
  const gaps: string[] = []
  if (farm.soil === 'unknown') gaps.push('Tipo de solo não informado: uma análise de solo (ou SSURGO/WSS nos EUA) melhora a recomendação.')
  else gaps.push('Solo informado pelo produtor, sem análise de laboratório.')
  if (windowSoilMoisture === null) gaps.push('Sem umidade do solo para este ponto (SMAP ou MERRA-2).')
  if (ndvi === null) gaps.push('Sem imagem de vegetação (MODIS/Landsat/Sentinel-2) para este ponto.')
  if (terrain === null) gaps.push('Sem dados de relevo (SRTM): risco de erosão estimado só pela chuva.')
  if (!fallow && !isCurrent && !farm.prices[id as Crop]) gaps.push('Preço, custo e produtividade são valores de referência; confirme no mercado local.')
  gaps.push('Pragas, doenças e cultivares locais precisam de revisão do agrônomo.')

  return {
    id, name: crop.name, kind: fallow ? 'pousio' : crop.kind, description: crop.description, isCurrent,
    sequence: isCurrent ? (fallow ? current.name + ' → pousio' : current.name + ' → ' + current.name) : current.name + ' → ' + crop.name,
    why, reasons, evidence, risks, gaps,
    months: monthShort[months[0]] + '–' + monthShort[months[months.length - 1]], waterNeed: crop.water,
    windowRain, windowEt, windowTemperature, windowSoilMoisture, windowHeatDays, windowFrostDays, windowNdvi, scores, total: totalScore,
    profitHa: eco.profit, revenueHa: eco.revenue, costHa: eco.cost, nSaving, waterSaved: Math.max(0, current.water - crop.water),
  }
}

/** Rotação atual + até `top` alternativas, em ordem de nota. */
export function compare(farm: Farm, climate: Climate | null, ndvi: Ndvi | null = null, top = 3, terrain: Terrain | null = null): Strategy[] {
  const alternatives = candidates(farm).map((id) => evaluate(id, farm, climate, ndvi, terrain, false))
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1) || b.scores[3] - a.scores[3]).slice(0, top)
  const currentId = crops[farm.crop].plant.includes(farm.month) ? farm.crop : 'fallow'
  return [evaluate(currentId, farm, climate, ndvi, terrain, true), ...alternatives]
}
export const alternativesOf = (strategies: Strategy[]) => strategies.filter((s) => !s.isCurrent)

/** Problemas da região a partir dos dados da NASA. */
export function regionProblems(climate: Climate | null, ndvi: Ndvi | null, impact: EnsoImpact, soil: Soil, terrain: Terrain | null = null) {
  const problems: { title: string; text: string; level: 'alto' | 'médio'; source: string }[] = []
  if (climate?.dryMonths != null && climate.dryMonths >= 4) problems.push({ title: 'Estação seca longa', text: climate.dryMonths + ' meses com menos de 60 mm de chuva. A janela de plantio é curta.', level: climate.dryMonths >= 6 ? 'alto' : 'médio', source: 'NASA POWER' })
  if (climate?.rain != null && climate.eto != null && climate.eto > climate.rain) problems.push({ title: 'Déficit hídrico', text: 'A atmosfera "puxa" ' + fmt(climate.eto) + ' mm de água por ano (evapotranspiração) e chove ' + fmt(climate.rain) + ' mm.', level: climate.eto > climate.rain * 1.3 ? 'alto' : 'médio', source: 'NASA POWER' })
  const monthlyRain = climate?.months.map((m) => m.rain ?? 0) ?? []
  if (climate?.rain && Math.max(...monthlyRain) > climate.rain * 0.22) problems.push({ title: 'Chuva concentrada', text: 'Muita chuva em poucos meses aumenta erosão e perda de nutrientes.', level: 'médio', source: 'NASA POWER' })
  if (climate?.heavyRainDays != null && climate.heavyRainDays >= 2) problems.push({ title: 'Chuvas extremas', text: climate.heavyRainDays + ' dias com 50 mm ou mais: risco de enxurrada e erosão.', level: climate.heavyRainDays >= 5 ? 'alto' : 'médio', source: 'NASA POWER' })
  if (climate?.heatDays != null && climate.heatDays >= 20) problems.push({ title: 'Calor extremo', text: climate.heatDays + ' dias acima de 35 °C no ano: risco de abortamento de flores.', level: climate.heatDays >= 60 ? 'alto' : 'médio', source: 'NASA POWER' })
  if (climate?.frostDays != null && climate.frostDays >= 1) problems.push({ title: 'Risco de geada', text: climate.frostDays + ' dias com mínima abaixo de 2 °C. Evite culturas sensíveis no inverno.', level: climate.frostDays >= 10 ? 'alto' : 'médio', source: 'NASA POWER' })
  if (climate?.soilMoisture != null && climate.soilMoisture < 0.45) problems.push({ title: 'Solo seco', text: 'Umidade média do solo baixa. Palhada ajuda a guardar água.', level: 'médio', source: 'MERRA-2' })
  if (climate?.rain != null && climate.rain < 700) problems.push({ title: 'Pouca chuva no ano', text: fmt(climate.rain) + ' mm no ano: prefira culturas tolerantes à seca.', level: 'alto', source: 'NASA POWER' })
  if (ndvi?.low != null && ndvi.low < 0.35) problems.push({ title: 'Solo descoberto parte do ano', text: 'O satélite mostra pouca vegetação em alguns meses. Plantas de cobertura protegem o solo.', level: 'médio', source: 'MODIS' })
  if (terrain && terrain.erosion !== 'baixo') problems.push({ title: 'Terreno inclinado', text: 'Declividade de ' + fmt(terrain.slope, 1) + '%: a água escorre e leva solo. Cobertura e plantio em nível ajudam.', level: terrain.erosion === 'alto' ? 'alto' : 'médio', source: 'SRTM' })
  if (impact.elnino < 0.9 || impact.lanina < 0.9) problems.push({ title: 'Sensível a El Niño / La Niña', text: impact.elnino < impact.lanina ? 'El Niño: ' + impact.elninoText : 'La Niña: ' + impact.laninaText, level: 'alto', source: 'NOAA ONI' })
  if (soil === 'shallow') problems.push({ title: 'Solo raso', text: 'Pouca água guardada e erosão fácil; prefira culturas rústicas e cobertura permanente.', level: 'alto', source: 'Produtor' })
  if (soil === 'silty') problems.push({ title: 'Solo siltoso', text: 'Forma crosta e sofre erosão com chuva forte; mantenha palhada.', level: 'médio', source: 'Produtor' })
  if (soil === 'wet') problems.push({ title: 'Solo encharcado', text: 'Água parada prejudica soja, feijão e algodão; drenagem ou arroz são alternativas.', level: 'médio', source: 'Produtor' })
  if (soil === 'sandy') problems.push({ title: 'Solo arenoso', text: 'Retém pouca água e nutrientes; manter palhada é essencial.', level: 'médio', source: 'Produtor' })
  return problems
}

/** Calendário de vulnerabilidade: em que meses o solo fica descoberto ou a cultura sofre. */
export type Flag = 'descoberto' | 'seca' | 'calor' | 'geada' | 'enxurrada'
export function vulnerabilityCalendar(climate: Climate | null, ndvi: Ndvi | null) {
  return (climate?.months ?? []).map((m, i) => {
    const flags: Flag[] = []
    const n = ndvi?.months[i]?.ndvi
    if (n != null && n < 0.35) flags.push('descoberto')
    if (m.rain != null && (m.eto != null ? m.rain < m.eto * 0.5 : m.rain < 60)) flags.push('seca')
    if ((m.heatDays ?? 0) >= 5) flags.push('calor')
    if ((m.frostDays ?? 0) >= 1) flags.push('geada')
    if ((m.heavyRainDays ?? 0) >= 1) flags.push('enxurrada')
    return { name: m.name, flags, balance: m.rain != null && m.eto != null ? m.rain - m.eto : null }
  })
}

/** Plano de 3 anos (6 safras): cultura atual na 1ª safra e rotação na 2ª, comparado a cultura atual + pousio. */
export type Scenario = 'neutral' | 'elnino' | 'lanina'
export interface PlanSeason {
  label: string; crop: string; kind: string; months: string; soil: number; soilChange: number; baselineSoil: number
  profitHa: number; seasonProfit: number; profit: Record<Scenario, number>; baseline: number; action: string; benefit: string
}
export function longTermPlan(farm: Farm, strategies: Strategy[], climate: Climate | null, impact: EnsoImpact) {
  const area = Math.max(0, Number(farm.area) || 0) || 1
  const options = alternativesOf(strategies)
  const cash = options.find((s) => s.kind !== 'cobertura') ?? null
  const cover = options.find((s) => s.kind === 'cobertura') ?? null
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
    const previousN = second ? 0 : nCredit
    nCredit = second ? item!.nSaving : 0
    const soilBonus = 1 + (soil - 50) / 300
    for (const key of Object.keys(totals) as Scenario[]) totals[key] += (profit * soilBonus * drought - revenue * (1 - factors[key])) * area
    if (!second) baseline += (current.profit - current.revenue * (50 - baselineSoil) / 300) * drought * area
    const before = seasons.length ? seasons[seasons.length - 1].soil : 50
    const summer = crops[farm.crop].plant.filter((m) => m >= 7)
    const mainMonths = (summer.length ? summer : [...crops[farm.crop].plant]).map((m) => monthShort[m])
    const months = second ? item!.months : mainMonths[0] + '–' + mainMonths[mainMonths.length - 1] + ' (plantio)'
    const action = second
      ? (item!.kind === 'cobertura' ? 'Semear ' + item!.name.toLowerCase() + ' logo após a colheita e manter a palhada até o próximo plantio.' : 'Plantar ' + item!.name.toLowerCase() + ' logo após a colheita, aproveitando as últimas chuvas.')
      : 'Plantar ' + crops[farm.crop].name.toLowerCase() + ' sobre a palhada' + (previousN ? ', reduzindo o nitrogênio graças à leguminosa anterior.' : '.')
    const benefit = second
      ? (item!.kind === 'cobertura' ? 'Solo coberto, mais matéria orgânica' + (item!.nSaving ? ' e nitrogênio para a safra seguinte.' : '.') : 'Renda extra na 2ª safra e quebra do ciclo de pragas.')
      : (previousN ? 'Economia de ' + 'R$ ' + previousN + '/ha em adubo.' : 'Safra principal de renda.')
    seasons.push({ label: 'Ano ' + (year + 1) + (second ? ' · 2ª safra' : ' · 1ª safra'), crop: second ? item!.name : crops[farm.crop].name, kind: second ? item!.kind : crops[farm.crop].kind,
      months, soil: Math.round(soil), soilChange: Math.round(soil) - before, baselineSoil: Math.round(baselineSoil), profitHa: Math.round(profit * soilBonus * drought),
      seasonProfit: Math.round(profit * soilBonus * drought * area), profit: { ...totals }, baseline, action, benefit })
  }
  return { seasons, cash, cover, area }
}
