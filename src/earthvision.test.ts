import { describe, expect, it, vi } from 'vitest'
import sample from '../public/power-sorriso-2025.json'
import { locations, parsePower, powerUrl, type Climate } from './power'
import { compare, crops, defaultFarm, type Crop } from './rotation'
import { exportReport } from './report'

const climate: Climate = { ...parsePower(sample), url: powerUrl(locations[0]), origin: 'bundled' }

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
          expect(data).toContain('Grãos comerciais')
          expect(data).toContain('Eficiência hídrica')
          expect(data).toContain('Cobertura do solo')
          return this
        }) as unknown as typeof this.save
      }
    },
  }
})

it('gera um PDF com as três estratégias', () => {
  expect.assertions(6)
  exportReport(locations[0], defaultFarm, climate, compare(defaultFarm, climate), 'Fev a Mai')
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
  it('compara três estratégias distintas para toda cultura inicial', () => {
    for (const crop of Object.keys(crops) as Crop[]) {
      const strategies = compare({ ...defaultFarm, crop }, climate)
      expect(new Set(strategies.map((item) => item.sequence)).size).toBe(3)
      expect(strategies.every((item) => item.sequence.startsWith(crops[crop].name + ' → ') && !item.sequence.endsWith('→ ' + crops[crop].name))).toBe(true)
      expect(strategies.map((item) => item.total)).toEqual([...strategies].sort((a, b) => b.total! - a.total!).map((item) => item.total))
    }
  })
  it('reage à estação e à prioridade', () => {
    const dry = compare({ ...defaultFarm, month: 5 }, climate)
    const wet = compare({ ...defaultFarm, month: 10 }, climate)
    expect(dry[0].windowRain!).toBeLessThan(wet[0].windowRain!)
    const production = compare({ ...defaultFarm, month: 10, priority: 'production' }, climate)
    expect(production.map((item) => item.total)).not.toEqual(wet.map((item) => item.total))
  })
  it('não atribui nota climática sem dados', () => {
    expect(compare(defaultFarm, null).map((item) => item.total)).toEqual([null, null, null])
  })
})
