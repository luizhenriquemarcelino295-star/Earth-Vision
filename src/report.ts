import { jsPDF } from 'jspdf'
import { format, period, powerDocs, type Climate, type Location } from './power'
import { criteria, crops, embrapa, fao, limits, methodology, priorities, soils, weights, type Farm, type Strategy } from './rotation'

export function exportReport(location: Location, farm: Farm, climate: Climate, strategies: Strategy[], window: string) {
  const pdf = new jsPDF()
  pdf.setProperties({ title: 'EarthVision | Relatório de rotação de culturas' })
  let y = 19
  const write = (text: string, size = 10, heading = false) => {
    pdf.setFont('helvetica', heading ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(heading ? '#125c3d' : '#263c33')
    const lines: string[] = pdf.splitTextToSize(text, 174)
    const height = size * .46
    for (const line of lines) {
      if (y + height > 280) { pdf.addPage(); y = 19 }
      pdf.text(line, 18, y)
      y += height
    }
    y += 2
  }
  write('EarthVision', 25, true)
  write('Relatório de rotação de culturas', 15, true)
  write((farm.name.trim() || 'Propriedade sem nome') + ' | ' + location.name + ' | ' + location.lat.toFixed(4) + ', ' + location.lon.toFixed(4))
  write('Área: ' + (farm.area ? farm.area + ' ha' : 'não informada') + ' | Solo: ' + soils[farm.soil] + ' | Irrigação: ' + (farm.irrigated ? 'declarada' : 'não declarada'))
  write('Cultura atual: ' + crops[farm.crop].name + ' | Prioridade: ' + priorities[farm.priority] + ' | Janela: ' + window)
  write('Clima histórico | ' + period, 13, true)
  write('Temperatura: ' + format(climate.temperature) + ' °C | Chuva: ' + format(climate.rain, 0) + ' mm | Radiação: ' + format(climate.solar) + ' MJ/m²/dia')
  write('Dias válidos (temperatura / chuva / radiação): ' + Object.values(climate.coverage).join(' / ') + ' de 365. Origem: NASA POWER, ' + (climate.origin === 'live' ? 'consulta on-line.' : 'cópia histórica local.'))
  write('Comparação de estratégias', 13, true)
  strategies.forEach((item) => {
    write(item.name + ' | ' + item.sequence.replace(' → ', ' > ') + ' | ' + (item.total === null ? 'nota indisponível' : item.total + '/100'), 11, true)
    write(item.benefit)
    write('Chuva histórica: ' + format(item.windowRain, 0) + ' mm | Demanda indicativa: ' + item.waterNeed + ' mm | Temperatura média: ' + format(item.windowTemperature) + ' °C')
    write(item.scores.map((score, index) => criteria[index] + ': ' + (score ?? 'indisponível')).join(' | '))
    item.risks.forEach((risk) => write('• ' + risk))
  })
  write('Metodologia e limites', 13, true)
  write(methodology + ' Pesos de água, solo e produção: ' + weights[farm.priority].map((weight) => Math.round(weight * 100) + '%').join(' / ') + '.')
  write(limits)
  write('Fontes', 13, true)
  ;[powerDocs, climate.url, fao, embrapa].forEach((source) => write(source, 8))
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page)
    pdf.setFontSize(9)
    pdf.text('EarthVision  /  ' + page, 18, 289)
  }
  pdf.save('EarthVision-rotacao-' + new Date().toISOString().slice(0, 10) + '.pdf')
}
