import { describe, expect, it, vi } from 'vitest'
import sample from '../public/power-sorriso-2025.json'
import { applyScenario, locations, parsePower, powerUrl, type Climate } from './power'
import { alternativesOf, candidates, compare, cropList, crops, defaultFarm, longTermPlan, regionProblems, seasonOf, vulnerabilityCalendar, type Crop } from './rotation'
import { parseTerrain } from './terrain'
import { ensoImpact } from './enso'
import { parsePlaces } from './geo'
import { exportReport } from './report'
import { ndviUrls, parseNdvi } from './ndvi'

const climate: Climate = { ...parsePower(sample), url: powerUrl(locations[0]), year: 2025, origin: 'bundled' }
const impact = ensoImpact(locations[0])

vi.mock('jspdf', async (original) => {
  const { jsPDF } = await original<typeof import('jspdf')>()
  return {
    jsPDF: class extends jsPDF {
      constructor() {
        super()
        this.save = vi.fn((filename: string) => {
          expect(filename).toMatch(/^EarthVision-rotacao-.*\.pdf$/)
          const data = this.output()
          expect(data.startsWith('%PDF-')).toBe(true)
          expect(data).toContain('Relatório de rotação de culturas')
          expect(data).toContain('Proposta de plantio')
          expect(data).toContain('Rotação atual')
          expect(data).toContain('Problemas da regi')
          return this
        }) as unknown as typeof this.save
      }
    },
  }
})

it('gera um PDF com as três estratégias', () => {
  expect.assertions(6)
  const strategies = compare(defaultFarm, climate)
  exportReport(locations[0], defaultFarm, climate, strategies, null, regionProblems(climate, null, impact, 'sandy'), longTermPlan(defaultFarm, strategies, climate, impact), impact)
})

describe('NASA POWER', () => {
  it('agrega o histórico real sem perder a cobertura ou alterar a unidade', () => {
    expect(Object.values(climate.coverage)).toEqual([365, 365, 365])
    expect(climate.months).toHaveLength(12)
    expect(climate.rain).toBeCloseTo(climate.months.reduce((sum, month) => sum + month.rain!, 0))
    expect(climate.temperature).toBeGreaterThan(20)
    expect(climate.solar).toBeGreaterThan(10)
  })
  it('omite os totais afetados por dias sem dados', () => {
    const incomplete = structuredClone(sample)
    incomplete.properties.parameter.PRECTOTCORR['20250101'] = -999
    const result = parsePower(incomplete)
    expect(result.coverage.PRECTOTCORR).toBe(364)
    expect(result.rain).toBeNull()
    expect(result.dryMonths).toBeNull()
    expect(result.months[0].rain).toBeNull()
    expect(result.months[1].rain).not.toBeNull()
  })
  it('rejeita respostas inválidas', () => {
    expect(() => parsePower({})).toThrow()
  })
})

describe('rotação de culturas', () => {
  it('sempre inclui a rotação atual e até três alternativas plantáveis no mês', () => {
    for (const crop of cropList) for (const month of [1, 4, 9]) {
      const farm = { ...defaultFarm, crop, month }
      const strategies = compare(farm, climate)
      expect(strategies[0].isCurrent).toBe(true)
      const options = alternativesOf(strategies)
      expect(options.length).toBe(Math.min(3, candidates(farm).length))
      expect(options.every((s) => s.id !== crop && s.id !== 'fallow' && crops[s.id].plant.includes(month))).toBe(true)
      expect(options.map((s) => s.total)).toEqual([...options].sort((a, b) => b.total! - a.total!).map((s) => s.total))
      expect(strategies.every((s) => s.why && s.evidence.length && s.gaps.length && s.risks.length)).toBe(true)
    }
  })
  it('usa pousio como rotação atual quando a cultura não cabe no mês', () => {
    expect(compare({ ...defaultFarm, crop: 'soybean', month: 1 }, climate)[0].id).toBe('fallow')
    expect(compare({ ...defaultFarm, crop: 'corn', month: 1 }, climate)[0].id).toBe('corn')
  })
  it('respeita mercado, equipamento e prioridade', () => {
    const noMarket = alternativesOf(compare({ ...defaultFarm, markets: [], smallSeedPlanter: false }, climate))
    expect(noMarket).toHaveLength(0)
    const profit = alternativesOf(compare({ ...defaultFarm, priority: 'profit' }, climate))
    const soil = alternativesOf(compare({ ...defaultFarm, priority: 'soil' }, climate))
    expect(profit[0].kind).not.toBe('cobertura')
    expect(soil[0].kind).toBe('cobertura')
    const forage = alternativesOf(compare({ ...defaultFarm, priority: 'forage', cattle: true }, climate))
    expect(crops[forage[0].id as Crop].forage).toBe(true)
    const custom = compare({ ...defaultFarm, priority: 'profit', prices: { corn: { price: 100 } } }, climate).find((s) => s.id === 'corn')!
    expect(custom.revenueHa).toBe(110 * 100)
  })
  it('recalcula com o cenário "e se"', () => {
    const dry = applyScenario(climate, -40, 2)
    expect(dry.rain!).toBeCloseTo(climate.rain! * 0.6)
    expect(dry.eto!).toBeGreaterThan(climate.eto!)
    const a = alternativesOf(compare(defaultFarm, climate)).find((s) => s.id === 'corn')
    const b = alternativesOf(compare(defaultFarm, dry)).find((s) => s.id === 'corn')
    if (a && b) expect(b.scores[0]!).toBeLessThan(a.scores[0]!)
  })
  it('classifica a safra pelo mês', () => {
    expect(seasonOf(9).name).toContain('verão')
    expect(seasonOf(1).name).toContain('Safrinha')
    expect(seasonOf(6).name).toContain('Inverno')
  })
  it('não atribui nota climática sem dados', () => {
    expect(compare(defaultFarm, null).every((s) => s.total === null)).toBe(true)
  })
  it('monta um plano de 3 anos que melhora o solo frente ao pousio', () => {
    const plan = longTermPlan(defaultFarm, compare(defaultFarm, climate), climate, impact)
    expect(plan.seasons).toHaveLength(6)
    const last = plan.seasons[5]
    expect(last.soil).toBeGreaterThan(last.baselineSoil)
    expect(last.profit.lanina).toBeLessThan(last.profit.neutral)
  })
  it('identifica problemas, erosão e meses vulneráveis', () => {
    expect(impact.region).toContain('Centro-Oeste')
    expect(ensoImpact({ lat: -30, lon: -53, name: '' }).lanina).toBeLessThan(1)
    const terrain = parseTerrain({ results: [{ elevation: 500 }, { elevation: 560 }, { elevation: 470 }, { elevation: 500 }, { elevation: 500 }] })
    expect(terrain.slope).toBeCloseTo(9)
    expect(terrain.erosion).toBe('alto')
    const problems = regionProblems(climate, null, impact, 'sandy', terrain)
    expect(problems.some((p) => p.title === 'Terreno inclinado')).toBe(true)
    expect(problems.some((p) => p.title === 'Déficit hídrico' || p.title === 'Estação seca longa')).toBe(true)
    const calendar = vulnerabilityCalendar(climate, null)
    expect(calendar).toHaveLength(12)
    expect(calendar[6].flags).toContain('seca')
    expect(climate.eto).toBeGreaterThan(1000)
  })
  it('lê a busca de cidades', () => {
    const places = parsePlaces({ results: [{ name: 'Rosario', latitude: -32.9468, longitude: -60.6393, country: 'Argentina', admin1: 'Santa Fe' }] })
    expect(places[0].name).toBe('Rosario, Santa Fe · Argentina')
  })
})

describe('dados NASA adicionais', () => {
  it('lê umidade do solo e dias de calor da NASA POWER quando presentes', () => {
    const extended = structuredClone(sample) as typeof sample & { properties: { parameter: Record<string, Record<string, number>> } }
    const days = Object.keys(sample.properties.parameter.T2M)
    extended.properties.parameter.GWETROOT = Object.fromEntries(days.map((day) => [day, 0.6]))
    extended.properties.parameter.T2M_MAX = Object.fromEntries(days.map((day, index) => [day, index < 10 ? 36 : 30]))
    const result = parsePower(extended)
    expect(result.soilMoisture).toBeCloseTo(0.6)
    expect(result.heatDays).toBe(10)
    expect(result.months[0].heatDays).toBe(10)
    expect(climate.soilMoisture).toBeNull()
  })
  it('converte o NDVI do MODIS e ignora valores de preenchimento', () => {
    const ndvi = parseNdvi([{ scale: '0.0001', subset: [
      { calendar_date: '2025-01-01', band: '250m_16_days_NDVI', data: [8000] },
      { calendar_date: '2025-01-17', band: '250m_16_days_NDVI', data: [6000] },
      { calendar_date: '2025-07-12', band: '250m_16_days_NDVI', data: [2500] },
      { calendar_date: '2025-08-13', band: '250m_16_days_NDVI', data: [-3000] },
    ] }])
    expect(ndvi.months[0].ndvi).toBeCloseTo(0.7)
    expect(ndvi.months[7].ndvi).toBeNull()
    expect(ndvi.composites).toBe(3)
    expect(ndviUrls(locations[0])).toHaveLength(3)
    expect(compare({ ...defaultFarm, month: 4, crop: 'corn' }, climate, ndvi).some((s) => s.windowNdvi !== null)).toBe(true)
  })
})
