import { fahrenheit, type Climate } from './power'
import type { Ndvi } from './ndvi'
import type { EnsoImpact } from './enso'
import type { Terrain } from './terrain'

/**
 * Culturas com dados indicativos (Brasil). Água: necessidade no ciclo (FAO/Embrapa).
 * Produtividade, preço e custo são valores de referência que o usuário pode alterar.
 */
export interface CropInfo {
  name: string; family: string; kind: 'grain' | 'cover crop' | 'fiber'; description: string
  water: number; temperature: readonly [number, number]; cycle: number; plant: readonly number[]
  yield: number; unit: string; price: number; cost: number; fixesNitrogen: boolean; droughtTolerant: boolean
  forage: boolean; deepRoots: boolean; frostTolerant: boolean
}
export const crops = {
  soybean: { name: 'Soybean', family: 'legume', kind: 'grain', description: 'Nitrogen-fixing legume and major summer crop, sensitive to drought during seed filling.', water: 550, temperature: [20, 30], cycle: 4, plant: [8, 9, 10, 11], yield: 60, unit: 'sc', price: 120, cost: 4200, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  corn: { name: 'Corn', family: 'grass', kind: 'grain', description: 'High-yield grass that provides residue and needs water during flowering.', water: 600, temperature: [18, 30], cycle: 5, plant: [0, 1, 2, 8, 9, 10, 11], yield: 110, unit: 'sc', price: 60, cost: 5000, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: false },
  sorghum: { name: 'Sorghum', family: 'grass', kind: 'grain', description: 'Heat- and drought-tolerant grain crop suitable for some second-season windows.', water: 450, temperature: [20, 34], cycle: 4, plant: [0, 1, 2, 3], yield: 80, unit: 'sc', price: 50, cost: 2600, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  beans: { name: 'Beans', family: 'legume', kind: 'grain', description: 'Short-cycle legume that can suffer from heat during flowering.', water: 350, temperature: [17, 28], cycle: 3, plant: [0, 1, 2, 3, 4, 9, 10, 11], yield: 30, unit: 'sc', price: 250, cost: 4500, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  wheat: { name: 'Wheat', family: 'grass', kind: 'grain', description: 'Cool-season cereal that diversifies rotations after summer legumes.', water: 450, temperature: [10, 24], cycle: 4, plant: [3, 4, 5], yield: 55, unit: 'sc', price: 80, cost: 3800, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: true },
  cotton: { name: 'Cotton', family: 'mallow family', kind: 'fiber', description: 'Long-cycle fiber crop with high input and pest-management needs.', water: 700, temperature: [20, 32], cycle: 6, plant: [10, 11, 0], yield: 300, unit: '@', price: 130, cost: 12000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: true, frostTolerant: false },
  millet: { name: 'Pearl millet', family: 'grass', kind: 'cover crop', description: 'Drought-tolerant cover crop with deep roots and forage potential.', water: 400, temperature: [20, 34], cycle: 3, plant: [1, 2, 3, 4, 7, 8, 9], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  crotalaria: { name: 'Sunn hemp', family: 'legume', kind: 'cover crop', description: 'Nitrogen-fixing cover crop used as green manure.', water: 350, temperature: [20, 32], cycle: 3, plant: [1, 2, 3, 8, 9, 10], yield: 0, unit: 'sc', price: 0, cost: 450, fixesNitrogen: true, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  brachiaria: { name: 'Brachiaria', family: 'grass', kind: 'cover crop', description: 'Forage grass that provides lasting soil cover.', water: 400, temperature: [18, 35], cycle: 4, plant: [0, 1, 2, 3], yield: 0, unit: 'sc', price: 0, cost: 350, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
  oat: { name: 'Oats', family: 'grass', kind: 'cover crop', description: 'Cool-season cover crop that protects soil and suppresses weeds.', water: 350, temperature: [8, 22], cycle: 3, plant: [3, 4, 5], yield: 0, unit: 'sc', price: 0, cost: 400, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  peanut: { name: 'Peanut', family: 'legume', kind: 'grain', description: 'Warm-season legume commonly grown in rotation with sugarcane.', water: 500, temperature: [20, 32], cycle: 4, plant: [0, 1, 8, 9, 10], yield: 110, unit: 'sc 25 kg', price: 85, cost: 7500, fixesNitrogen: true, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  sunflower: { name: 'Sunflower', family: 'aster family', kind: 'grain', description: 'Deep-rooted oilseed that tolerates relatively dry conditions.', water: 450, temperature: [18, 30], cycle: 4, plant: [0, 1, 2, 7, 8], yield: 30, unit: 'sc', price: 110, cost: 2800, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  rice: { name: 'Rice', family: 'grass', kind: 'grain', description: 'Water-demanding cereal grown in irrigated lowlands or suitable upland conditions.', water: 800, temperature: [20, 32], cycle: 4, plant: [9, 10, 11], yield: 140, unit: 'sc', price: 75, cost: 8000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: false, frostTolerant: false },
  barley: { name: 'Barley', family: 'grass', kind: 'grain', description: 'Cool-season cereal with market quality and contracting requirements.', water: 400, temperature: [8, 22], cycle: 4, plant: [4, 5, 6], yield: 60, unit: 'sc', price: 85, cost: 3600, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  radish: { name: 'Forage radish', family: 'mustard family', kind: 'cover crop', description: 'Fast-growing cover crop with a deep taproot.', water: 300, temperature: [10, 26], cycle: 3, plant: [2, 3, 4, 5], yield: 0, unit: 'sc', price: 0, cost: 300, fixesNitrogen: false, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: true },
  sesame: { name: 'Sesame', family: 'sesame family', kind: 'grain', description: 'Warm-season oilseed that requires well-drained soil.', water: 400, temperature: [21, 34], cycle: 3, plant: [0, 1, 2, 9, 10, 11], yield: 1, unit: 't', price: 4800, cost: 3100, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: true, frostTolerant: false },
  canola: { name: 'Canola', family: 'mustard family', kind: 'grain', description: 'Cool-season oilseed that diversifies cereal and legume rotations.', water: 450, temperature: [10, 24], cycle: 4, plant: [3, 4, 5], yield: 1.6, unit: 't', price: 2300, cost: 3000, fixesNitrogen: false, droughtTolerant: false, forage: false, deepRoots: true, frostTolerant: false },
  rye: { name: 'Rye', family: 'grass', kind: 'cover crop', description: 'Hardy winter cereal used for soil cover and forage.', water: 350, temperature: [6, 22], cycle: 4, plant: [3, 4, 5, 6], yield: 0, unit: 't', price: 0, cost: 480, fixesNitrogen: false, droughtTolerant: false, forage: true, deepRoots: true, frostTolerant: true },
  vetch: { name: 'Vetch', family: 'legume', kind: 'cover crop', description: 'Cool-season legume that can fix nitrogen and protect soil.', water: 350, temperature: [8, 23], cycle: 4, plant: [3, 4, 5, 6], yield: 0, unit: 't', price: 0, cost: 650, fixesNitrogen: true, droughtTolerant: false, forage: true, deepRoots: false, frostTolerant: true },
  pigeonpea: { name: 'Pigeon pea', family: 'legume', kind: 'cover crop', description: 'Deep-rooted tropical legume used for green manure and forage.', water: 450, temperature: [20, 32], cycle: 4, plant: [0, 1, 8, 9, 10, 11], yield: 0, unit: 't', price: 0, cost: 520, fixesNitrogen: true, droughtTolerant: true, forage: true, deepRoots: true, frostTolerant: false },
} satisfies Record<string, CropInfo>
export type Crop = keyof typeof crops
export const cropList = (Object.keys(crops) as Crop[]).sort((a, b) => crops[a].name.localeCompare(crops[b].name, 'en-US'))

export const soils = {
  unknown: { name: 'Not sure', text: 'The model uses average values. A soil test can improve the recommendation.' },
  sandy: { name: 'Sandy', text: 'Dries quickly and loses nutrients. Mulch and cover crops help.' },
  loam: { name: 'Medium texture', text: 'Balances drainage and water retention.' },
  clay: { name: 'Clay', text: 'Retains water but can compact. Deep-rooted crops can help.' },
  heavyClay: { name: 'Heavy clay', text: 'Holds water well but can compact under heavy machinery.' },
  silty: { name: 'Silty', text: 'Can crust and erode under heavy rain. Keep the surface covered.' },
  shallow: { name: 'Shallow or rocky', text: 'Limited rooting depth and water storage, with high erosion risk.' },
  wet: { name: 'Waterlogged (lowland)', text: 'Standing water favors some rice systems and can harm soybeans and beans.' },
  organic: { name: 'Organic (peaty)', text: 'Rich in organic matter, with risks of subsidence and waterlogging.' },
}
export type Soil = keyof typeof soils

export const priorities = {
  balanced: { name: 'Balanced', text: 'Balance competing goals', icon: '⚖️' },
  profit: { name: 'Profit', text: 'Higher return per hectare', icon: '💰' },
  water: { name: 'Save water', text: 'Crops requiring less rainfall', icon: '💧' },
  soil: { name: 'Soil health', text: 'Residue, organic matter, and cover', icon: '🌱' },
  risk: { name: 'Lower climate risk', text: 'Manage drought, heat, and El Niño risks', icon: '🛡️' },
  inputs: { name: 'Reduce fertilizer', text: 'Use nitrogen from legumes', icon: '🧪' },
  erosion: { name: 'Prevent erosion', text: 'Protect sloping soil during heavy rain', icon: '⛰️' },
  forage: { name: 'Pasture / forage', text: 'Feed livestock between growing seasons', icon: '🐄' },
  production: { name: 'Grain production', text: 'Keep the field producing grain', icon: '🌾' },
}
export type Priority = keyof typeof priorities
export const criteria = ['Water', 'Soil', 'Climate', 'Profit'] as const
/** Pesos de água, solo, clima e lucro. */
export const weights: Record<Priority, readonly [number, number, number, number]> = {
  balanced: [.25, .25, .25, .25], profit: [.15, .1, .2, .55], water: [.55, .15, .15, .15], soil: [.15, .55, .15, .15],
  risk: [.3, .1, .45, .15], inputs: [.15, .45, .15, .25], production: [.2, .1, .3, .4],
  erosion: [.15, .55, .15, .15], forage: [.2, .3, .2, .3],
}

export function seasonOf(month: number) {
  if (month >= 8) return { name: 'Summer growing season', text: 'The rainy season begins, opening the main planting window.' }
  if (month <= 3) return { name: 'Second growing season', text: 'Plant after the summer harvest while rainfall is still available.' }
  return { name: 'Winter / off-season', text: 'Much of Brazil receives less rain. Consider cover crops or winter crops.' }
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
  { group: 'Grains and fiber crops', items: cropList.filter((c) => crops[c].kind !== 'cover crop').map((c) => ({ id: c, name: crops[c].name })) },
  { group: 'Perennial crops', items: [['coffee', 'Coffee'], ['sugarcane', 'Sugarcane'], ['orange', 'Orange'], ['banana', 'Banana'], ['grape', 'Grape'], ['mango', 'Mango'], ['cocoa', 'Cocoa'], ['eucalyptus', 'Eucalyptus']].map(([id, name]) => ({ id, name })) },
  { group: 'Other products', items: [['cassava', 'Cassava'], ['vegetables', 'Vegetables'], ['beef', 'Beef cattle'], ['dairy', 'Milk'], ['silage', 'Silage / hay']].map(([id, name]) => ({ id, name })) },
]
export const marketName = (id: string) => marketGroups.flatMap((g) => g.items).find((i) => i.id === id)?.name ?? id
export const nitrogenSaving = 350 // R$/ha de adubo nitrogenado poupado na cultura seguinte (≈ 50 kg N/ha)
export const methodology = 'EarthVision compares the current practice with eligible alternatives. Water scoring compares historical rainfall with crop needs and uses MERRA-2 soil moisture where available. Soil scoring considers crop family, cover, nitrogen fixation, MODIS vegetation, and erosion risk. Climate scoring evaluates suitable temperatures, heat above 95 °F, and frost risk. Profit uses yield times price minus cost and includes estimated fertilizer savings where applicable. Your priority determines how the scores are weighted.'
export const limits = 'NASA data describe regional conditions. Planting windows and crop requirements are indicative for Brazil. Prices, costs, and yields are editable estimates. ENSO scenarios illustrate regional tendencies. Confirm your plan with a local agronomist.'
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
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Culturas possíveis no mês, respeitando mercado e equipamento informados pelo produtor. */
export function candidates(farm: Farm) {
  return cropList.filter((crop) => crop !== farm.crop && crops[crop].plant.includes(farm.month)
    && (crops[crop].kind === 'cover crop' || farm.markets.includes(crop))
    && (farm.smallSeedPlanter || !smallSeeds.includes(crop)))
}
const fmt = (value: number, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })

function evaluate(id: Crop | 'fallow', farm: Farm, climate: Climate | null, ndvi: Ndvi | null, terrain: Terrain | null, isCurrent: boolean): Strategy {
  const current: CropInfo = crops[farm.crop]
  const fallow = id === 'fallow'
  const crop: CropInfo = fallow ? { ...current, name: 'Fallow field', family: '—', kind: 'cover crop', description: 'Leave the field fallow until the next season.', water: 0, temperature: [-50, 60], cycle: 4, yield: 0, price: 0, cost: 120, fixesNitrogen: false, droughtTolerant: true, forage: false, deepRoots: false, frostTolerant: true } : crops[id]
  const months = Array.from({ length: crop.cycle }, (_, i) => (farm.month + i) % 12)
  const data = months.map((m) => climate?.months[m])
  const all = <K extends keyof NonNullable<typeof data[0]>>(key: K) => climate !== null && data.every((m) => m?.[key] != null)
  const total = (key: 'rain' | 'eto' | 'heatDays' | 'frostDays' | 'heavyRainDays') => all(key) ? data.reduce((s, m) => s + (m![key] as number), 0) : null
  const windowRain = total('rain'), windowEt = total('eto'), windowHeatDays = total('heatDays'), windowFrostDays = total('frostDays'), heavyRain = total('heavyRainDays')
  const windowTemperature = all('temperature') ? mean(data.map((m) => m!.temperature!)) : null
  const windowSoilMoisture = all('soilMoisture') ? mean(data.map((m) => m!.soilMoisture!)) : null
  const windowNdvi = ndvi ? mean(months.flatMap((m) => ndvi.months[m]?.ndvi == null ? [] : [ndvi.months[m].ndvi!])) : null
  const differentFamily = !fallow && crop.family !== current.family
  const cover = crop.kind === 'cover crop' && !fallow
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

  const why = isCurrent ? 'Your current practice is the baseline for comparing alternatives.'
    : cover ? 'Helps protect and improve soil during the ' + seasonOf(farm.month).name.toLowerCase() + (erosive ? ', when erosion is a concern.' : '.')
    : crop.droughtTolerant ? 'Suggested for drought and heat tolerance during this season.' : 'Offers income in the selected window while changing crop families.'
  const reasons: string[] = []
  if (differentFamily) reasons.push('Changing crop families (' + current.family + ' → ' + crop.family + ') can interrupt pest and disease cycles.')
  if (crop.fixesNitrogen && !fallow) reasons.push('Nitrogen fixation may save BRL ' + nitrogenSaving + '/ha in fertilizer for the next crop.')
  if (cover) reasons.push('Plant cover and residue reduce erosion, build organic matter, and improve infiltration.')
  if (crop.deepRoots && !fallow) reasons.push('Deep roots can penetrate compacted layers and reach water deeper in the soil.')
  if (crop.droughtTolerant && !fallow) reasons.push('Tolerates drought and heat.')
  if (crop.forage && !fallow) reasons.push(farm.cattle ? 'Provides off-season forage (estimated value: BRL 600/ha).' : 'Can provide livestock forage.')
  if (eco.profit > 0) reasons.push('Estimated profit of BRL ' + fmt(eco.profit) + '/ha.')
  if (fallow) reasons.push('No seed costs or crop water use.')

  const evidence: string[] = []
  if (windowRain !== null) evidence.push('Rainfall during the cycle (NASA POWER): ' + fmt(windowRain) + ' mm' + (fallow ? '' : ' para ' + crop.water + ' mm required.'))
  if (windowRain !== null && windowEt !== null) evidence.push('Water balance (rainfall minus evapotranspiration): ' + fmt(windowRain - windowEt) + ' mm during the cycle.')
  if (windowTemperature !== null) evidence.push('Average temperature ' + fmt(fahrenheit(windowTemperature)!, 1) + ' °F' + (fallow ? '.' : ' (ideal ' + fmt(fahrenheit(low)!, 1) + '–' + fmt(fahrenheit(high)!, 1) + ' °F).'))
  if (windowSoilMoisture !== null) evidence.push('Soil moisture (MERRA-2): ' + fmt(windowSoilMoisture * 100) + '%.')
  if (windowHeatDays !== null) evidence.push(windowHeatDays + ' days above 95 °F' + (windowFrostDays !== null ? ' and ' + windowFrostDays + ' with frost risk.' : '.'))
  if (windowNdvi !== null) evidence.push('Vegetation during this season (MODIS NDVI): ' + fmt(windowNdvi, 2) + (windowNdvi < 0.4 ? ' (limited soil cover).' : '.'))
  if (terrain) evidence.push('Slope (SRTM): ' + fmt(terrain.slope, 1) + '%, erosion risk: ' + terrain.erosion + '.')

  const risks: string[] = []
  if (fallow) risks.push('Bare soil increases erosion, water loss, and weed growth.')
  if (isCurrent && !fallow) risks.push('Repeating the same crop can increase pests, diseases, and nematodes.')
  else if (!differentFamily && !fallow) risks.push('Crops in the same family may share pests and diseases.')
  if (!fallow && windowRain !== null && windowRain < crop.water) risks.push(farm.irrigated ? 'Rainfall falls short of the water needs of this crop. Irrigation is required.' : 'Historical rainfall falls short of the water needs of this crop.')
  if (!fallow && windowSoilMoisture !== null && windowSoilMoisture < 0.4) risks.push('Soil is historically dry during this season.')
  if (!fallow && windowHeatDays !== null && windowHeatDays >= 10) risks.push('Many extreme heat days can affect flowering.')
  if (!fallow && !crop.frostTolerant && (windowFrostDays ?? 0) > 0) risks.push('Frost risk during the growing season.')
  if (!fallow && farm.soil === 'wet' && waterlogSensitive) risks.push('This crop is sensitive to waterlogging and needs drainage.')
  if (id === 'rice' && farm.soil !== 'wet' && !farm.irrigated) risks.push('This rice scenario assumes lowland conditions or irrigation.')
  if (!fallow && farm.soil === 'shallow' && !crop.droughtTolerant) risks.push('Shallow soil stores little water in the root zone.')
  if (!fallow && windowTemperature !== null && (windowTemperature < low || windowTemperature > high)) risks.push('Average temperature is outside the suitable range.')
  if (cover) risks.push('Benefits come from soil protection, fertilizer savings, and the following crop.')
  if (!fallow && smallSeeds.includes(id as Crop)) risks.push('Requires a small-seed planter or broadcast seeding.')

  if (!risks.length) risks.push('No major climate risk was flagged. Review the planting window and cultivar with an agronomist.')
  const gaps: string[] = []
  if (farm.soil === 'unknown') gaps.push('Soil type is unknown. A soil test or a local soil survey can improve the recommendation.')
  else gaps.push('Soil type was reported by the farmer without a laboratory test.')
  if (windowSoilMoisture === null) gaps.push('Soil moisture data are unavailable for this location.')
  if (ndvi === null) gaps.push('Vegetation imagery is unavailable for this location.')
  if (terrain === null) gaps.push('Terrain data are unavailable. Erosion risk uses rainfall only.')
  if (!fallow && !isCurrent && !farm.prices[id as Crop]) gaps.push('Check estimated prices, costs, and yields against local values.')
  gaps.push('Discuss local pests, diseases, and cultivars with an agronomist.')

  return {
    id, name: crop.name, kind: fallow ? 'fallow' : crop.kind, description: crop.description, isCurrent,
    sequence: isCurrent ? (fallow ? current.name + ' → fallow' : current.name + ' → ' + current.name) : current.name + ' → ' + crop.name,
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

/** Local risks a partir dos dados da NASA. */
export function regionProblems(climate: Climate | null, ndvi: Ndvi | null, impact: EnsoImpact, soil: Soil, terrain: Terrain | null = null) {
  const problems: { title: string; text: string; level: 'high' | 'moderate'; source: string }[] = []
  if (climate?.dryMonths != null && climate.dryMonths >= 4) problems.push({ title: 'Long dry season', text: climate.dryMonths + ' months with less than 60 mm of rainfall, which can shorten the planting window.', level: climate.dryMonths >= 6 ? 'high' : 'moderate', source: 'NASA POWER' })
  if (climate?.rain != null && climate.eto != null && climate.eto > climate.rain) problems.push({ title: 'Water deficit', text: 'Reference evapotranspiration is ' + fmt(climate.eto) + ' mm per year and annual rainfall is ' + fmt(climate.rain) + ' mm.', level: climate.eto > climate.rain * 1.3 ? 'high' : 'moderate', source: 'NASA POWER' })
  const monthlyRain = climate?.months.map((m) => m.rain ?? 0) ?? []
  if (climate?.rain && Math.max(...monthlyRain) > climate.rain * 0.22) problems.push({ title: 'Concentrated rainfall', text: 'Concentrated rainfall increases erosion and nutrient loss.', level: 'moderate', source: 'NASA POWER' })
  if (climate?.heavyRainDays != null && climate.heavyRainDays >= 2) problems.push({ title: 'Extreme rainfall', text: climate.heavyRainDays + ' days with 50 mm or more of rain, increasing runoff and erosion risk.', level: climate.heavyRainDays >= 5 ? 'high' : 'moderate', source: 'NASA POWER' })
  if (climate?.heatDays != null && climate.heatDays >= 20) problems.push({ title: 'Extreme heat', text: climate.heatDays + ' days above 95 °F this year, increasing the risk of flower loss.', level: climate.heatDays >= 60 ? 'high' : 'moderate', source: 'NASA POWER' })
  if (climate?.frostDays != null && climate.frostDays >= 1) problems.push({ title: 'Frost risk', text: climate.frostDays + ' days with lows below 35.6 °F. Avoid frost-sensitive crops in winter.', level: climate.frostDays >= 10 ? 'high' : 'moderate', source: 'NASA POWER' })
  if (climate?.soilMoisture != null && climate.soilMoisture < 0.45) problems.push({ title: 'Dry soil', text: 'Low average soil moisture. Residue can help retain water.', level: 'moderate', source: 'MERRA-2' })
  if (climate?.rain != null && climate.rain < 700) problems.push({ title: 'Low annual rainfall', text: fmt(climate.rain) + ' mm of annual rain. Consider drought-tolerant crops.', level: 'high', source: 'NASA POWER' })
  if (ndvi?.low != null && ndvi.low < 0.35) problems.push({ title: 'Bare soil for part of the year', text: 'Satellite data show little vegetation in some months. Cover crops can protect the soil.', level: 'moderate', source: 'MODIS' })
  if (terrain && terrain.erosion !== 'low') problems.push({ title: 'Sloping terrain', text: 'Slope of ' + fmt(terrain.slope, 1) + '%. Cover crops and contour farming can reduce runoff and erosion.', level: terrain.erosion === 'high' ? 'high' : 'moderate', source: 'SRTM' })
  if (impact.elnino < 0.9 || impact.lanina < 0.9) problems.push({ title: 'Sensitive to El Niño / La Niña', text: impact.elnino < impact.lanina ? 'El Niño: ' + impact.elninoText : 'La Niña: ' + impact.laninaText, level: 'high', source: 'NOAA ONI' })
  if (soil === 'shallow') problems.push({ title: 'Shallow soil', text: 'Low water storage and high erosion risk. Consider hardy crops and continuous cover.', level: 'high', source: 'Farmer' })
  if (soil === 'silty') problems.push({ title: 'Silty soil', text: 'Heavy rainfall can cause crusting and erosion. Keep residue on the surface.', level: 'moderate', source: 'Farmer' })
  if (soil === 'wet') problems.push({ title: 'Waterlogged soil', text: 'Standing water can harm soybeans, beans, and cotton. Consider drainage or suitable rice systems.', level: 'moderate', source: 'Farmer' })
  if (soil === 'sandy') problems.push({ title: 'Sandy soil', text: 'Holds little water and few nutrients. Keep the soil covered.', level: 'moderate', source: 'Farmer' })
  return problems
}

/** Calendário de vulnerabilidade: em que meses o solo fica descoberto ou a cultura sofre. */
export type Flag = 'bare soil' | 'drought' | 'heat' | 'frost' | 'runoff'
export function vulnerabilityCalendar(climate: Climate | null, ndvi: Ndvi | null) {
  return (climate?.months ?? []).map((m, i) => {
    const flags: Flag[] = []
    const n = ndvi?.months[i]?.ndvi
    if (n != null && n < 0.35) flags.push('bare soil')
    if (m.rain != null && (m.eto != null ? m.rain < m.eto * 0.5 : m.rain < 60)) flags.push('drought')
    if ((m.heatDays ?? 0) >= 5) flags.push('heat')
    if ((m.frostDays ?? 0) >= 1) flags.push('frost')
    if ((m.heavyRainDays ?? 0) >= 1) flags.push('runoff')
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
  const cash = options.find((s) => s.kind !== 'cover crop') ?? null
  const cover = options.find((s) => s.kind === 'cover crop') ?? null
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
    soil = Math.min(100, soil + (second ? (item!.kind === 'cover crop' ? 10 : 6) : 0) - (second ? 0 : 2))
    if (!second) baselineSoil = Math.max(20, baselineSoil - 4)
    const previousN = second ? 0 : nCredit
    nCredit = second ? item!.nSaving : 0
    const soilBonus = 1 + (soil - 50) / 300
    for (const key of Object.keys(totals) as Scenario[]) totals[key] += (profit * soilBonus * drought - revenue * (1 - factors[key])) * area
    if (!second) baseline += (current.profit - current.revenue * (50 - baselineSoil) / 300) * drought * area
    const before = seasons.length ? seasons[seasons.length - 1].soil : 50
    const summer = crops[farm.crop].plant.filter((m) => m >= 7)
    const mainMonths = (summer.length ? summer : [...crops[farm.crop].plant]).map((m) => monthShort[m])
    const months = second ? item!.months : mainMonths[0] + '–' + mainMonths[mainMonths.length - 1] + ' (planting)'
    const action = second
      ? (item!.kind === 'cover crop' ? 'Sow ' + item!.name.toLowerCase() + ' after harvest and retain the residue until the next planting.' : 'Plant ' + item!.name.toLowerCase() + ' after harvest while rainfall is still available.')
      : 'Plant ' + crops[farm.crop].name.toLowerCase() + ' into crop residue' + (previousN ? ', checking nitrogen needs after the preceding legume.' : '.')
    const benefit = second
      ? (item!.kind === 'cover crop' ? 'Soil cover and more organic matter' + (item!.nSaving ? ' and nitrogen for the next crop.' : '.') : 'Second-season income and a break in pest cycles.')
      : (previousN ? 'Savings of ' + 'BRL ' + previousN + '/ha in fertilizer.' : 'Main cash crop.')
    seasons.push({ label: 'Year ' + (year + 1) + (second ? ' · Second season' : ' · First season'), crop: second ? item!.name : crops[farm.crop].name, kind: second ? item!.kind : crops[farm.crop].kind,
      months, soil: Math.round(soil), soilChange: Math.round(soil) - before, baselineSoil: Math.round(baselineSoil), profitHa: Math.round(profit * soilBonus * drought),
      seasonProfit: Math.round(profit * soilBonus * drought * area), profit: { ...totals }, baseline, action, benefit })
  }
  return { seasons, cash, cover, area }
}
