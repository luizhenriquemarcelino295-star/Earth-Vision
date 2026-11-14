import { jsPDF } from 'jspdf'
import { format, monthNames, periodOf, powerDocs, type Climate, type Location } from './power'
import { ndviProduct, type Ndvi } from './ndvi'
import { ensoDocs, phaseNames, yearPhase, type EnsoImpact } from './enso'
import { criteria, crops, embrapa, fao, limits, methodology, priorities, seasonOf, soils, type Farm, type Strategy, type longTermPlan, type regionProblems } from './rotation'

const money = (value: number) => 'R$ ' + Math.round(value).toLocaleString('pt-BR')
export function exportReport(location: Location, farm: Farm, climate: Climate, strategies: Strategy[], ndvi: Ndvi | null,
  problems: ReturnType<typeof regionProblems>, plan: ReturnType<typeof longTermPlan>, impact: EnsoImpact) {
  const pdf = new jsPDF()
  pdf.setProperties({ title: 'EarthVision | Relatório de rotação de culturas' })
  let y = 19
  const write = (text: string, size = 10, heading = false) => {
    pdf.setFont('helvetica', heading ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(heading ? '#125c3d' : '#263c33')
    for (const line of pdf.splitTextToSize(text.replace(/→/g, '>'), 174) as string[]) {
      if (y + size * .46 > 280) { pdf.addPage(); y = 19 }
      pdf.text(line, 18, y); y += size * .46
    }
    y += 2
  }
  write('EarthVision', 25, true)
  write('Relatório de rotação de culturas', 15, true)
  write((farm.name.trim() || 'Propriedade sem nome') + ' | ' + location.name)
  write('Área: ' + (farm.area || '-') + ' ha | Solo: ' + soils[farm.soil].name + ' | Irrigação: ' + (farm.irrigated ? 'sim' : 'não'))
  write('Cultura atual: ' + crops[farm.crop].name + ' | Próximo plantio: ' + monthNames[farm.month] + ' (' + seasonOf(farm.month).name + ') | Prioridade: ' + priorities[farm.priority].name)
  write('1. Clima da região | ' + periodOf(climate.year) + ' | ' + phaseNames[yearPhase[climate.year]?.phase ?? 'neutral'], 13, true)
  write('Temperatura média: ' + format(climate.temperature) + ' °C | Chuva: ' + format(climate.rain, 0) + ' mm | Radiação: ' + format(climate.solar) + ' MJ/m²/dia')
  write('Umidade do solo: ' + (climate.soilMoisture == null ? '-' : format(climate.soilMoisture * 100, 0) + '%') + ' | Dias > 35 °C: ' + format(climate.heatDays, 0) + ' | NDVI médio: ' + format(ndvi?.mean ?? null, 2))
  write('El Niño: ' + impact.elninoText + ' La Niña: ' + impact.laninaText)
  write('2. Problemas da região', 13, true)
  if (!problems.length) write('Nenhum problema climático forte detectado.')
  problems.forEach((p) => write('• ' + p.title + ' (' + p.level + '): ' + p.text))
  write('3. Proposta de plantio', 13, true)
  strategies.forEach((item, i) => {
    write((i + 1) + 'ª opção: ' + item.sequence + ' (' + item.kind + ', ' + item.months + ') | ' + (item.total ?? '-') + '/100', 11, true)
    write(item.scores.map((s, k) => criteria[k] + ': ' + (s ?? '-')).join(' | '))
    write('Receita ' + money(item.revenueHa) + '/ha | Custo ' + money(item.costHa) + '/ha | Lucro ' + money(item.profitHa) + '/ha' + (item.nSaving ? ' | Adubo poupado ' + money(item.nSaving) + '/ha' : ''))
    item.reasons.forEach((r) => write('+ ' + r))
    item.risks.forEach((r) => write('! ' + r))
  })
  write('4. Plano de 3 anos', 13, true)
  plan.seasons.forEach((s) => write(s.label + ': ' + s.crop + ' | solo ' + s.soil + ' | lucro acumulado ' + money(s.profit.neutral) + ' (El Niño ' + money(s.profit.elnino) + ', La Niña ' + money(s.profit.lanina) + ') | sem rotação ' + money(s.baseline)))
  write('Metodologia e limites', 13, true)
  write(methodology); write(limits)
  write('Fontes', 13, true)
  ;[powerDocs, climate.url, ndviProduct, ensoDocs, fao, embrapa].forEach((s) => write(s, 8))
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) { pdf.setPage(page); pdf.setFontSize(9); pdf.text('EarthVision  /  ' + page, 18, 289) }
  pdf.save('EarthVision-rotacao-' + new Date().toISOString().slice(0, 10) + '.pdf')
}
