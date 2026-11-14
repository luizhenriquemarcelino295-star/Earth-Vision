import { jsPDF } from 'jspdf'
import { frostThreshold, heatThreshold, heavyRainThreshold, monthNames, periodOf, powerDocs, type Climate, type Location } from './power'
import { ndviDocs, ndviProduct, type Ndvi } from './ndvi'
import { srtmDocs, type Terrain } from './terrain'
import { ensoDocs, ensoOutlook, phaseNames, yearPhase, type EnsoImpact } from './enso'
import { criteria, crops, marketName, embrapa, fao, limits, methodology, priorities, seasonOf, soils, vulnerabilityCalendar, type Farm, type Strategy, type longTermPlan, type regionProblems } from './rotation'

export interface ReportInput {
  location: Location; farm: Farm
  /** Clima usado nas notas (pode ter cenário "e se"). */
  climate: Climate
  /** Clima original da NASA, sem cenário. */
  nasa: Climate
  strategies: Strategy[]; ndvi: Ndvi | null; terrain: Terrain | null
  problems: ReturnType<typeof regionProblems>; plan: ReturnType<typeof longTermPlan>; impact: EnsoImpact
  scenario: { rainPct: number; tempDelta: number }
}

type RGB = [number, number, number]
const C = {
  deep: [16, 46, 35] as RGB, green: [19, 132, 79] as RGB, mint: [138, 205, 176] as RGB, light: [237, 246, 238] as RGB,
  text: [38, 60, 51] as RGB, muted: [100, 118, 110] as RGB, line: [223, 232, 223] as RGB, white: [255, 255, 255] as RGB,
  amber: [168, 100, 41] as RGB, red: [179, 59, 43] as RGB, blue: [44, 111, 179] as RGB, orange: [192, 97, 43] as RGB,
  paleAmber: [255, 246, 230] as RGB, paleRed: [252, 232, 228] as RGB, paleBlue: [227, 238, 250] as RGB,
}
const W = 210, H = 297, M = 16, CW = W - 2 * M
/** A fonte padrão do PDF não tem alguns símbolos: troca por equivalentes. */
const clean = (text: string) => text.replace(/→/g, '>').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/−/g, '-').replace(/[–—]/g, '-').replace(/[^\u0000-ÿ…]/g, '')
const num = (value: number | null | undefined, digits = 0) => value == null || !Number.isFinite(value) ? '-' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const money = (value: number) => (value < 0 ? '-R$ ' : 'R$ ') + Math.abs(Math.round(value)).toLocaleString('pt-BR')
const unit = (value: number | null | undefined, suffix: string, digits = 0) => value == null || !Number.isFinite(value) ? '-' : num(value, digits) + suffix
const short = (value: number) => Math.abs(value) >= 1e6 ? num(value / 1e6, 1) + ' mi' : Math.abs(value) >= 1e3 ? num(value / 1e3, 0) + ' mil' : num(value)

export function buildReport(input: ReportInput) {
  const { location, farm, climate, nasa, strategies, ndvi, terrain, problems, plan, impact, scenario } = input
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  pdf.setProperties({ title: 'EarthVision | Relatório de rotação de culturas' })
  let y = M
  const fill = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2])
  const stroke = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2])
  const color = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2])
  const font = (size: number, bold = false, c: RGB = C.text) => { pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); color(c) }
  const lines = (text: string, width: number) => pdf.splitTextToSize(clean(text), width) as string[]
  const lh = (size: number) => size * 0.42
  const text = (value: string, x: number, yy: number, opts?: { align?: 'left' | 'center' | 'right' }) => pdf.text(clean(value), x, yy, opts)
  const ensure = (space: number) => { if (y + space > H - 18) { pdf.addPage(); y = M } }
  const para = (value: string, size = 10, c: RGB = C.text, width = CW, x = M, bold = false) => {
    font(size, bold, c)
    for (const line of lines(value, width)) { ensure(lh(size) + 1); text(line, x, y + lh(size)); y += lh(size) + 0.6 }
    y += 1.5
  }
  const section = (number: string, title: string, subtitle?: string) => {
    ensure(24)
    fill(C.green); pdf.circle(M + 4, y + 4, 4, 'F'); font(10, true, C.white); text(number, M + 4, y + 5.4, { align: 'center' })
    font(15, true, C.deep); text(title, M + 11, y + 6)
    y += 10
    if (subtitle) para(subtitle, 9.5, C.muted)
    stroke(C.line); pdf.setLineWidth(.3); pdf.line(M, y, W - M, y); y += 5
  }
  const box = (x: number, yy: number, w: number, h: number, bg: RGB = C.white, border: RGB = C.line) => { fill(bg); stroke(border); pdf.setLineWidth(.3); pdf.roundedRect(x, yy, w, h, 2.5, 2.5, 'FD') }
  const pill = (label: string, x: number, yy: number, bg: RGB, fg: RGB) => {
    font(7.5, true, fg); const w = pdf.getTextWidth(clean(label)) + 5
    fill(bg); pdf.roundedRect(x, yy, w, 5, 2.5, 2.5, 'F'); text(label, x + 2.5, yy + 3.6); return w
  }

  /* ---------- Gráficos ---------- */
  function monthlyChart(x: number, yy: number, w: number, h: number) {
    box(x, yy, w, h)
    const px = x + 12, pw = w - 24, py = yy + 12, ph = h - 24
    const rains = nasa.months.map((m) => m.rain ?? 0), temps = nasa.months.map((m) => m.temperature)
    const ndviValues = ndvi?.months.map((m) => m.ndvi) ?? []
    const maxRain = Math.max(50, ...rains) * 1.1
    const validT = temps.filter((t): t is number => t !== null)
    const tMin = Math.floor(Math.min(...validT, 15) - 2), tMax = Math.ceil(Math.max(...validT, 30) + 2)
    font(9, true, C.deep); text('Chuva e temperatura mês a mês (' + nasa.year + ')', x + 5, yy + 6.5)
    stroke(C.line); pdf.setLineWidth(.2)
    for (let i = 0; i <= 4; i++) {
      const gy = py + ph - ph * i / 4
      pdf.line(px, gy, px + pw, gy)
      font(6.5, false, C.muted); text(num(maxRain * i / 4), px - 1.5, gy + 1, { align: 'right' }); text(num(tMin + (tMax - tMin) * i / 4), px + pw + 1.5, gy + 1)
    }
    const step = pw / 12
    rains.forEach((r, i) => {
      const bh = ph * r / maxRain
      fill(C.mint); pdf.rect(px + i * step + step * .2, py + ph - bh, step * .6, bh, 'F')
      font(6.5, false, C.muted); text(monthNames[i], px + i * step + step / 2, py + ph + 4, { align: 'center' })
    })
    const plot = (values: (number | null)[], c: RGB, scale: (v: number) => number, dash = false) => {
      stroke(c); pdf.setLineWidth(.7); if (dash) pdf.setLineDashPattern([1.2, 1], 0)
      let prev: [number, number] | null = null
      values.forEach((v, i) => {
        if (v == null) { prev = null; return }
        const point: [number, number] = [px + i * step + step / 2, py + ph - scale(v) * ph]
        if (prev) pdf.line(prev[0], prev[1], point[0], point[1])
        if (!dash) { fill(c); pdf.circle(point[0], point[1], .7, 'F') }
        prev = point
      })
      pdf.setLineDashPattern([], 0)
    }
    plot(temps, C.amber, (v) => (v - tMin) / (tMax - tMin))
    if (ndviValues.some((v) => v != null)) plot(ndviValues, C.green, (v) => v, true)
    const ly = yy + h - 4
    fill(C.mint); pdf.rect(x + 5, ly - 2.4, 3, 3, 'F'); font(7, false, C.muted); text('Chuva (mm, eixo esq.)', x + 9.5, ly)
    stroke(C.amber); pdf.setLineWidth(.7); pdf.line(x + 45, ly - 1, x + 50, ly - 1); text('Temperatura (°C, eixo dir.)', x + 51.5, ly)
    if (ndviValues.some((v) => v != null)) { stroke(C.green); pdf.setLineDashPattern([1.2, 1], 0); pdf.line(x + 95, ly - 1, x + 100, ly - 1); pdf.setLineDashPattern([], 0); text('Verde da vegetação (NDVI 0-1)', x + 101.5, ly) }
  }
  function calendarStrip(x: number, yy: number, w: number) {
    const calendar = vulnerabilityCalendar(nasa, ndvi)
    const cw = w / 12
    const palette: Record<string, [RGB, RGB]> = { seca: [[251, 225, 200], [138, 75, 18]], calor: [[249, 211, 204], [143, 42, 27]], geada: [[217, 232, 251], [31, 79, 138]], enxurrada: [[214, 228, 242], [36, 80, 122]], descoberto: [[239, 228, 210], [107, 79, 33]] }
    calendar.forEach((m, i) => {
      const cx = x + i * cw
      box(cx + .4, yy, cw - .8, 22, m.flags.length ? [255, 246, 239] : [244, 248, 243], C.line)
      font(7.5, true, C.deep); text(m.name, cx + cw / 2, yy + 4.5, { align: 'center' })
      const flags = m.flags.length ? m.flags.slice(0, 3) : ['ok']
      flags.forEach((f, k) => {
        const [bg, fg] = palette[f] ?? [[223, 240, 220], [32, 92, 65]]
        fill(bg); pdf.roundedRect(cx + 1.2, yy + 6.3 + k * 4.3, cw - 2.4, 3.7, 1, 1, 'F')
        font(5.6, true, fg); text(f, cx + cw / 2, yy + 8.9 + k * 4.3, { align: 'center' })
      })
      if (m.balance !== null) { font(5.6, false, m.balance < 0 ? C.red : C.green); text((m.balance >= 0 ? '+' : '') + num(m.balance) + ' mm', cx + cw / 2, yy + 20.6, { align: 'center' }) }
    })
  }
  function scoreChart(x: number, yy: number, w: number) {
    const barColors: RGB[] = [C.blue, C.green, C.amber, [120, 95, 170]]
    const rowH = 13
    strategies.forEach((s, r) => {
      const ry = yy + r * rowH
      if (s.isCurrent) { fill([247, 247, 243]); pdf.rect(x, ry - 1, w, rowH - 1, 'F') }
      font(8.5, true, s.isCurrent ? C.muted : C.deep); text((s.isCurrent ? 'Atual: ' : '') + s.name, x + 2, ry + 3.5)
      font(13, true, s.isCurrent ? C.muted : C.green); text(s.total === null ? '-' : String(s.total), x + w - 2, ry + 7, { align: 'right' })
      const bx = x + 52, bw = w - 70
      s.scores.forEach((score, k) => {
        const by = ry + .8 + k * 2.6
        fill([236, 240, 236]); pdf.rect(bx, by, bw, 1.9, 'F')
        fill(barColors[k]); pdf.rect(bx, by, bw * (score ?? 0) / 100, 1.9, 'F')
      })
    })
    const ly = yy + strategies.length * rowH + 2
    criteria.forEach((c, k) => { fill(barColors[k]); pdf.rect(x + 52 + k * 26, ly - 2.2, 3, 2.4, 'F'); font(7, false, C.muted); text(c, x + 56 + k * 26, ly) })
    font(7, false, C.muted); text('Nota final (0-100)', x + w - 2, ly, { align: 'right' })
    return strategies.length * rowH + 6
  }
  function profitChart(x: number, yy: number, w: number, h: number) {
    box(x, yy, w, h)
    font(9, true, C.deep); text('Lucro acumulado em 3 anos', x + 5, yy + 6.5)
    const px = x + 18, pw = w - 24, py = yy + 11, ph = h - 26
    const series: { name: string; c: RGB; values: number[]; dash?: boolean }[] = [
      { name: 'Ano normal', c: C.green, values: plan.seasons.map((s) => s.profit.neutral) },
      { name: 'El Niño', c: C.orange, values: plan.seasons.map((s) => s.profit.elnino) },
      { name: 'La Niña', c: C.blue, values: plan.seasons.map((s) => s.profit.lanina) },
      { name: 'Sem rotação', c: [140, 140, 140], values: plan.seasons.map((s) => s.baseline), dash: true },
    ]
    const all = series.flatMap((s) => s.values)
    const lo = Math.min(0, ...all), hi = Math.max(1, ...all) * 1.08
    stroke(C.line); pdf.setLineWidth(.2)
    for (let i = 0; i <= 4; i++) { const gy = py + ph - ph * i / 4; pdf.line(px, gy, px + pw, gy); font(6.3, false, C.muted); text(short(lo + (hi - lo) * i / 4), px - 1.5, gy + 1, { align: 'right' }) }
    const n = plan.seasons.length, step = n > 1 ? pw / (n - 1) : pw
    plan.seasons.forEach((s, i) => { font(5.8, false, C.muted); text(s.label.replace(' safra', '').replace('Ano ', 'A'), px + i * step, py + ph + 4, { align: 'center' }) })
    for (const s of series) {
      stroke(s.c); pdf.setLineWidth(s.dash ? .5 : .8); if (s.dash) pdf.setLineDashPattern([1.5, 1], 0)
      s.values.forEach((v, i) => { if (i) pdf.line(px + (i - 1) * step, py + ph - (s.values[i - 1] - lo) / (hi - lo) * ph, px + i * step, py + ph - (v - lo) / (hi - lo) * ph) })
      pdf.setLineDashPattern([], 0)
    }
    series.forEach((s, i) => { stroke(s.c); pdf.setLineWidth(.8); pdf.line(x + 5 + i * 22, yy + h - 5, x + 9 + i * 22, yy + h - 5); font(6.5, false, C.muted); text(s.name, x + 10 + i * 22, yy + h - 4) })
  }
  function soilChart(x: number, yy: number, w: number, h: number) {
    box(x, yy, w, h)
    font(9, true, C.deep); text('Saúde do solo (0-100)', x + 5, yy + 6.5)
    const px = x + 10, pw = w - 15, py = yy + 11, ph = h - 26
    const n = plan.seasons.length, step = pw / Math.max(1, n)
    stroke(C.line); pdf.setLineWidth(.2)
    ;[0, 50, 100].forEach((v) => { const gy = py + ph - ph * v / 100; pdf.line(px, gy, px + pw, gy); font(6.3, false, C.muted); text(String(v), px - 1.5, gy + 1, { align: 'right' }) })
    plan.seasons.forEach((s, i) => {
      const bh = ph * s.soil / 100
      fill(C.mint); pdf.rect(px + i * step + step * .15, py + ph - bh, step * .7, bh, 'F')
      stroke([140, 140, 140]); pdf.setLineWidth(.6); const by = py + ph - ph * s.baselineSoil / 100; pdf.line(px + i * step + step * .1, by, px + i * step + step * .9, by)
      font(5.8, false, C.muted); text(s.label.replace(' safra', '').replace('Ano ', 'A'), px + i * step + step / 2, py + ph + 4, { align: 'center' })
    })
    fill(C.mint); pdf.rect(x + 5, yy + h - 7, 3, 3, 'F'); font(6.5, false, C.muted); text('Com rotação', x + 9.5, yy + h - 4.5)
    stroke([140, 140, 140]); pdf.line(x + 30, yy + h - 5.5, x + 35, yy + h - 5.5); text('Sem rotação', x + 36.5, yy + h - 4.5)
  }

  /* ---------- Página 1: capa e resumo ---------- */
  const options = strategies.filter((s) => !s.isCurrent)
  const current = strategies.find((s) => s.isCurrent)
  const best = options[0]
  const last = plan.seasons[plan.seasons.length - 1]
  const area = Math.max(0, Number(farm.area) || 0)
  const gain = last ? last.profit.neutral - last.baseline : 0
  const phase = yearPhase[nasa.year]

  fill(C.deep); pdf.rect(0, 0, W, 50, 'F')
  fill([33, 78, 54]); pdf.circle(W - 22, 18, 30, 'F'); fill([47, 104, 70]); pdf.circle(W - 14, 12, 18, 'F')
  font(10, true, [188, 235, 187]); text('EARTHVISION  |  NASA SPACE APPS 2026', M, 14)
  font(22, true, C.white); text('Relatório da sua fazenda', M, 26)
  font(11, false, [224, 238, 225]); text((farm.name.trim() || 'Propriedade sem nome') + '  -  ' + location.name, M, 34)
  font(8.5, false, [188, 220, 190]); text('Gerado em ' + new Date().toLocaleDateString('pt-BR') + ' com dados da NASA de ' + nasa.year + (scenario.rainPct || scenario.tempDelta ? ' (cenário simulado: chuva ' + (scenario.rainPct > 0 ? '+' : '') + scenario.rainPct + '%, temperatura +' + scenario.tempDelta + ' °C)' : ''), M, 42)
  y = 58

  // Resumo em linguagem simples
  const summary: string[] = []
  if (best) {
    summary.push('Depois de ' + crops[farm.crop].name.toLowerCase() + ', a melhor opção para plantar em ' + monthNames[farm.month].toLowerCase() + ' é ' + best.name.toLowerCase() + ' (nota ' + (best.total ?? '-') + ' de 100' + (current?.total != null && best.total != null ? ', contra ' + current.total + ' do que você faz hoje' : '') + ').')
    summary.push(best.why)
    if (best.profitHa > 0) summary.push('Lucro estimado de ' + money(best.profitHa) + ' por hectare' + (area ? ', cerca de ' + money(best.profitHa * area) + ' em ' + num(area) + ' ha.' : '.'))
    else summary.push('Ela não gera venda de grão, mas melhora o solo' + (best.nSaving ? ' e economiza cerca de ' + money(best.nSaving) + '/ha em adubo na próxima safra.' : '.'))
  } else summary.push('Com as respostas informadas, nenhuma cultura da lista costuma ser plantada em ' + monthNames[farm.month].toLowerCase() + '. Tente outro mês ou libere mais culturas.')
  if (last) summary.push('Em 3 anos, seguindo o plano, o lucro fica ' + (gain >= 0 ? money(gain) + ' maior' : money(-gain) + ' menor') + ' do que deixar o solo parado na 2ª safra, e a saúde do solo passa de 50 para ' + last.soil + ' pontos.')
  const topProblem = problems.find((p) => p.level === 'alto') ?? problems[0]
  if (topProblem) summary.push('Principal atenção na região: ' + topProblem.title.toLowerCase() + '. ' + topProblem.text)

  font(10, true, C.green); text('RESUMO PARA VOCÊ', M, y); y += 3
  const summaryLines = summary.flatMap((s) => lines(s, CW - 14))
  const boxH = summaryLines.length * (lh(10.5) + .7) + summary.length * 1.5 + 8
  box(M, y, CW, boxH, C.light, [185, 220, 185])
  fill(C.green); pdf.rect(M, y, 2, boxH, 'F')
  let sy = y + 7
  for (const s of summary) { font(10.5, false, C.deep); for (const l of lines(s, CW - 14)) { text(l, M + 7, sy); sy += lh(10.5) + .7 } sy += 1.5 }
  y += boxH + 7

  // Indicadores principais
  const kpis = [
    { label: 'Recomendação', value: best ? best.name : '-', note: best ? 'nota ' + (best.total ?? '-') + '/100' : '' },
    { label: 'Lucro estimado', value: best ? money(best.profitHa) + '/ha' : '-', note: area ? money((best?.profitHa ?? 0) * area) + ' no total' : 'informe a área' },
    { label: 'Ganho em 3 anos', value: last ? (gain >= 0 ? '+' : '') + money(gain) : '-', note: 'frente a não fazer rotação' },
    { label: 'Saúde do solo', value: last ? last.soil + ' pts' : '-', note: last ? 'sem rotação: ' + last.baselineSoil : '' },
  ]
  const kw = (CW - 9) / 4
  kpis.forEach((k, i) => {
    const kx = M + i * (kw + 3)
    box(kx, y, kw, 24)
    font(7.5, true, C.muted); text(k.label.toUpperCase(), kx + 4, y + 6)
    font(k.value.length > 14 ? 10.5 : 13, true, C.green); text(k.value, kx + 4, y + 14)
    font(7.5, false, C.muted); text(k.note, kx + 4, y + 20)
  })
  y += 32

  // Suas respostas
  font(10, true, C.green); text('SUAS RESPOSTAS', M, y); y += 4
  const answers = [
    ['Local', location.name], ['Área', farm.area ? farm.area + ' ha' : 'não informada'],
    ['Cultura atual', crops[farm.crop].name], ['Próximo plantio', monthNames[farm.month] + ' - ' + seasonOf(farm.month).name],
    ['Tipo de solo', soils[farm.soil].name], ['Irrigação', farm.irrigated ? 'Sim' : 'Não'],
    ['Prioridade', priorities[farm.priority].name], ['Gado', farm.cattle ? 'Sim (forragem tem valor)' : 'Não'],
    ['Vende na região', farm.markets.length ? farm.markets.map(marketName).join(', ') : 'nenhuma cultura marcada'],
    ['Plantadeira p/ sementes miúdas', farm.smallSeedPlanter ? 'Sim' : 'Não'],
  ]
  const aw = (CW - 4) / 2
  answers.forEach(([label, value], i) => {
    const ax = M + (i % 2) * (aw + 4), ay = y + Math.floor(i / 2) * 11
    box(ax, ay, aw, 9.5, [250, 252, 249])
    font(7, true, C.muted); text(label.toUpperCase(), ax + 3, ay + 3.8)
    font(8.8, false, C.deep); text(lines(value, aw - 6)[0], ax + 3, ay + 7.8)
  })
  y += Math.ceil(answers.length / 2) * 11 + 4
  font(8, false, C.muted)
  for (const l of lines('Este relatório mostra padrões e possibilidades a partir de dados de satélite e modelos. Ele não substitui sua experiência nem a do agrônomo: use-o como ponto de partida para a conversa.', CW)) { text(l, M, y); y += 3.5 }

  /* ---------- Página 2: clima e problemas ---------- */
  pdf.addPage(); y = M
  section('1', 'Como é o clima da sua região', 'Dados da NASA para ' + location.name + ' em ' + nasa.year + ' (' + (phase ? phaseNames[phase.phase] + ': ' + phase.text.toLowerCase() : 'fase do Pacífico não informada') + ').')
  monthlyChart(M, y, CW, 72); y += 78
  const facts = [
    ['Chuva no ano', unit(nasa.rain, ' mm')], ['Temperatura média', unit(nasa.temperature, ' °C', 1)],
    ['Evapotranspiração', unit(nasa.eto, ' mm')], ['Dias acima de 35 °C', num(nasa.heatDays)],
    ['Dias com risco de geada', num(nasa.frostDays)], ['Meses com < 60 mm', num(nasa.dryMonths)],
  ]
  const fw = (CW - 10) / 6
  facts.forEach(([l, v], i) => { const fx = M + i * (fw + 2); box(fx, y, fw, 15, [250, 252, 249]); font(6.3, true, C.muted); text(lines(l.toUpperCase(), fw - 4)[0], fx + 2.5, y + 5); font(10, true, C.deep); text(v, fx + 2.5, y + 11.5) })
  y += 21
  font(11, true, C.deep); text('Quando a lavoura fica vulnerável', M, y); y += 4
  calendarStrip(M, y, CW); y += 26
  y += 1
  para('Embaixo de cada mês: balanço hídrico (chuva menos a água que a lavoura perde para o ar). Negativo em vermelho = falta água; a cultura depende do solo ou de irrigação.', 8, C.muted)
  y += 2
  y += 2
  font(11, true, C.deep); text('Problemas encontrados na região', M, y); y += 5
  if (!problems.length) para('Nenhum problema climático forte foi detectado neste ano.', 9.5)
  for (const p of problems) {
    const pl = lines(p.text, CW - 40)
    const ph = Math.max(12, pl.length * 3.9 + 7)
    ensure(ph + 3)
    const high = p.level === 'alto'
    box(M, y, CW, ph, high ? C.paleRed : C.paleAmber, high ? [240, 200, 190] : [240, 220, 168])
    fill(high ? C.red : [217, 164, 65]); pdf.rect(M, y, 1.8, ph, 'F')
    font(9.5, true, C.deep); text(p.title, M + 5, y + 5)
    font(8.5, false, C.text); pl.forEach((l, i) => text(l, M + 5, y + 9.2 + i * 3.9))
    pill(high ? 'ALTO' : 'MÉDIO', W - M - 37, y + 2, high ? C.red : [217, 164, 65], C.white)
    font(6.5, false, C.muted); text('Fonte: ' + p.source, W - M - 3, y + ph - 2.5, { align: 'right' })
    y += ph + 2.5
  }
  y += 2
  ensure(30)
  box(M, y, CW, 26, C.paleBlue, [200, 220, 240])
  font(9.5, true, C.deep); text('El Niño e La Niña em ' + impact.region, M + 5, y + 6)
  font(8.5, false, C.text)
  lines('El Niño: ' + impact.elninoText, CW - 10).forEach((l, i) => text(l, M + 5, y + 11 + i * 3.8))
  lines('La Niña: ' + impact.laninaText, CW - 10).forEach((l, i) => text(l, M + 5, y + 19 + i * 3.8))
  y += 30

  /* ---------- Página 3: proposta ---------- */
  pdf.addPage(); y = M
  section('2', 'Proposta de plantio', 'Comparamos o que você faz hoje com as melhores alternativas para ' + monthNames[farm.month].toLowerCase() + ', com foco em ' + priorities[farm.priority].name.toLowerCase() + '.')
  y += scoreChart(M, y, CW) + 4
  // tabela financeira
  ensure(12 + strategies.length * 7)
  const cols = [['Estratégia', 0], ['Ciclo', 58], ['Receita/ha', 82], ['Custo/ha', 108], ['Lucro/ha', 132], ['Adubo poupado', 156]] as const
  fill(C.deep); pdf.rect(M, y, CW, 7, 'F'); font(7.5, true, C.white); cols.forEach(([c, x]) => text(c, M + 2 + x, y + 4.8)); y += 7
  strategies.forEach((s, i) => {
    fill(i % 2 ? C.white : [246, 249, 245]); pdf.rect(M, y, CW, 7, 'F')
    font(8, s.isCurrent ? false : true, C.deep); text((s.isCurrent ? 'Atual: ' : '') + s.name, M + 2, y + 4.8)
    font(8, false, C.text); text(s.months, M + 2 + 58, y + 4.8); text(money(s.revenueHa), M + 2 + 82, y + 4.8); text(money(s.costHa), M + 2 + 108, y + 4.8)
    font(8, true, s.profitHa >= 0 ? C.green : C.red); text(money(s.profitHa), M + 2 + 132, y + 4.8)
    font(8, false, C.text); text(s.nSaving ? '+' + money(s.nSaving) : '-', M + 2 + 156, y + 4.8)
    y += 7
  })
  y += 2
  para('Preços, custos e produtividades são valores de referência' + (Object.keys(farm.prices).length ? ', com os ajustes que você informou.' : '. Ajuste-os no site com os valores da sua região.'), 8, C.muted)
  y += 2
  for (const s of strategies) {
    const head = (s.isCurrent ? 'O que você faz hoje: ' : (options.indexOf(s) + 1) + 'ª opção: ') + s.sequence
    ensure(40)
    box(M, y, CW, 9, s.isCurrent ? [245, 245, 240] : C.light, s.isCurrent ? C.line : [185, 220, 185])
    font(10, true, C.deep); text(head, M + 4, y + 6)
    font(10, true, s.isCurrent ? C.muted : C.green); text((s.total ?? '-') + '/100', W - M - 4, y + 6, { align: 'right' })
    y += 12
    para(s.why, 9, C.text, CW - 4, M + 2, false)
    const block = (title: string, items: string[], c: RGB, mark: string) => {
      if (!items.length) return
      ensure(10); font(8.5, true, c); text(title, M + 2, y + 3); y += 5
      for (const item of items) { font(8.3, false, C.text); const ls = lines(item, CW - 12); ensure(ls.length * 3.7 + 1); font(8.3, true, c); text(mark, M + 4, y + 3); font(8.3, false, C.text); ls.forEach((l, i) => text(l, M + 9, y + 3 + i * 3.7)); y += ls.length * 3.7 + 1 }
      y += 1.5
    }
    block('Benefícios', s.reasons, C.green, '+')
    block('O que os dados mostram', s.evidence, C.blue, '•')
    block('Riscos para revisar com o agrônomo', s.risks, C.red, '!')
    block('O que ainda não sabemos', s.gaps, C.amber, '?')
    y += 3
  }

  /* ---------- Página 4: plano ---------- */
  pdf.addPage(); y = M
  section('3', 'Plano para os próximos 3 anos', 'Manter ' + crops[farm.crop].name.toLowerCase() + ' na safra principal e usar a 2ª safra para a rotação, comparado a deixar o solo parado.')
  if (plan.seasons.length) {
    profitChart(M, y, CW * .58, 70); soilChart(M + CW * .58 + 4, y, CW * .42 - 4, 70); y += 76
    font(11, true, C.deep); text('Safra a safra', M, y); y += 4
    for (const [i, s] of plan.seasons.entries()) {
      const actionLines = lines(s.action, CW - 74), benefitLines = lines(s.benefit, CW - 74)
      const bh = Math.max(16, (actionLines.length + benefitLines.length) * 3.7 + 6)
      ensure(bh + 2)
      box(M, y, CW, bh, i % 2 ? C.white : [250, 252, 249])
      fill(s.kind === 'cobertura' ? C.green : [224, 169, 91]); pdf.rect(M, y, 1.8, bh, 'F')
      font(7, false, C.muted); text(s.label, M + 5, y + 5)
      font(10, true, C.deep); text(s.crop, M + 5, y + 10)
      font(7, false, C.muted); text(s.months, M + 5, y + 14)
      font(8.3, false, C.text); actionLines.forEach((l, k) => text(l, M + 48, y + 5 + k * 3.7))
      font(8, false, C.green); benefitLines.forEach((l, k) => text(l, M + 48, y + 5 + (actionLines.length + k) * 3.7))
      font(9, true, s.profitHa >= 0 ? C.green : C.red); text(money(s.profitHa) + '/ha', W - M - 3, y + 6, { align: 'right' })
      font(7.5, false, C.muted); text('solo ' + s.soil + ' (' + (s.soilChange >= 0 ? '+' : '') + s.soilChange + ')', W - M - 3, y + 11, { align: 'right' })
      y += bh + 1.5
    }
    y += 4
    const neutral = last.profit.neutral, elnino = last.profit.elnino, lanina = last.profit.lanina
    const sw = (CW - 6) / 3
    ;[['Ano normal', neutral, C.green], ['Anos de El Niño', elnino, C.orange], ['Anos de La Niña', lanina, C.blue]].forEach(([label, value, c], i) => {
      const bx = M + i * (sw + 3)
      box(bx, y, sw, 18); fill(c as RGB); pdf.rect(bx, y, 1.8, 18, 'F')
      font(7.5, true, C.muted); text(String(label).toUpperCase(), bx + 5, y + 6)
      font(12, true, c as RGB); text(money(value as number), bx + 5, y + 13.5)
    })
    y += 23
    para('Lucro acumulado em 3 anos com a rotação. Sem rotação: ' + money(last.baseline) + '. Os cenários de El Niño e La Niña usam o efeito típico na região (' + impact.region + ') e não são previsões.', 8.5, C.muted)
  }
  y += 4
  ensure(45)
  font(11, true, C.deep); text('O que fazer agora', M, y); y += 5
  const todo = [
    best ? 'Converse com seu agrônomo sobre ' + best.name.toLowerCase() + ' para ' + monthNames[farm.month].toLowerCase() + ': confirme cultivar, janela e sementes.' : 'Revise o mês de plantio e as culturas que você consegue vender.',
    farm.soil === 'unknown' ? 'Faça uma análise de solo: ela melhora muito a recomendação.' : 'Atualize a análise de solo antes da próxima safra.',
    'Confirme preços e custos na sua região e ajuste-os no site.',
    'Consulte a previsão oficial de El Niño/La Niña antes de cada safra (NOAA).',
    problems.some((p) => p.title.includes('Terreno') || p.title.includes('extrema')) ? 'Planeje terraços, plantio em nível e cobertura nos meses de chuva forte.' : 'Mantenha o solo coberto nos meses marcados como "descoberto" ou "seca".',
  ]
  todo.forEach((t) => { const ls = lines(t, CW - 12); ensure(ls.length * 4 + 2); stroke(C.green); pdf.setLineWidth(.4); pdf.rect(M + 1, y, 3.5, 3.5); font(9, false, C.text); ls.forEach((l, i) => text(l, M + 8, y + 3 + i * 4)); y += ls.length * 4 + 2.5 })

  /* ---------- Página 5: dados oficiais NASA ---------- */
  pdf.addPage(); y = M
  section('4', 'Dados oficiais da NASA usados', 'Valores originais (sem cenário simulado), com o código de cada parâmetro e o link da fonte para conferência.')
  const origin = nasa.origin === 'live' ? 'consulta on-line à API' : 'cópia salva da resposta oficial'
  const rows: [string, string, string, string][] = [
    ['NASA POWER (LaRC)', 'T2M - temperatura média a 2 m', unit(nasa.temperature, ' °C', 1), nasa.coverage.T2M + '/365 dias'],
    ['NASA POWER (LaRC)', 'PRECTOTCORR - chuva corrigida', unit(nasa.rain, ' mm/ano'), nasa.coverage.PRECTOTCORR + '/365 dias'],
    ['NASA POWER (LaRC)', 'ALLSKY_SFC_SW_DWN - radiação solar', unit(nasa.solar, ' MJ/m²/dia', 1), nasa.coverage.ALLSKY_SFC_SW_DWN + '/365 dias'],
    ['NASA POWER (LaRC)', 'T2M_MAX - dias acima de ' + heatThreshold + ' °C', unit(nasa.heatDays, ' dias'), nasa.heatDays === null ? 'indisponível' : 'diário'],
    ['NASA POWER (LaRC)', 'T2M_MIN - dias abaixo de ' + frostThreshold + ' °C (geada)', unit(nasa.frostDays, ' dias'), nasa.frostDays === null ? 'indisponível' : 'diário'],
    ['NASA POWER (LaRC)', 'PRECTOTCORR - dias com >= ' + heavyRainThreshold + ' mm', unit(nasa.heavyRainDays, ' dias'), 'diário'],
    ['Calculado (Hargreaves)', 'Evapotranspiração de referência (T2M + radiação)', unit(nasa.eto, ' mm/ano'), 'mensal'],
    ['MERRA-2 / GMAO', 'GWETROOT - umidade do solo nas raízes', nasa.soilMoisture == null ? '-' : num(nasa.soilMoisture * 100) + ' %', nasa.soilMoisture == null ? 'indisponível' : 'diário'],
    ['MODIS Terra MOD13Q1', 'NDVI 250 m, compostos de 16 dias', ndvi ? num(ndvi.mean, 2) + ' (mín ' + num(ndvi.low, 2) + ', máx ' + num(ndvi.peak, 2) + ')' : '-', ndvi ? ndvi.composites + ' imagens' : 'indisponível'],
    ['SRTM (NASA/NGA)', 'Altitude e declividade (30 m)', terrain ? terrain.elevation + ' m, ' + num(terrain.slope, 1) + '%' : '-', terrain ? 'erosão ' + terrain.erosion : 'indisponível'],
    ['NOAA CPC (ONI)', 'Fase do Pacífico em ' + nasa.year, phase ? phaseNames[phase.phase] : '-', 'anual'],
  ]
  const dcols = [0, 40, 108, 148]
  fill(C.deep); pdf.rect(M, y, CW, 7, 'F'); font(7.5, true, C.white); ['Fonte', 'Parâmetro', 'Valor', 'Cobertura'].forEach((h, i) => text(h, M + 2 + dcols[i], y + 4.8)); y += 7
  rows.forEach((r, i) => {
    const ls = lines(r[1], 66)
    const rh = Math.max(7, ls.length * 3.6 + 3.4)
    fill(i % 2 ? C.white : [246, 249, 245]); pdf.rect(M, y, CW, rh, 'F')
    font(7.8, true, C.deep); lines(r[0], 36).forEach((l, k) => text(l, M + 2, y + 4.6 + k * 3.6))
    font(7.8, false, C.text); ls.forEach((l, k) => text(l, M + 2 + dcols[1], y + 4.6 + k * 3.6))
    font(7.8, true, r[2] === '-' ? C.muted : C.green); text(lines(r[2], 38)[0], M + 2 + dcols[2], y + 4.6)
    font(7.3, false, C.muted); text(lines(r[3], 30)[0], M + 2 + dcols[3], y + 4.6)
    y += rh
  })
  y += 4
  para('Período: ' + periodOf(nasa.year) + '. Ponto: ' + location.lat.toFixed(4) + ', ' + location.lon.toFixed(4) + ' (a NASA POWER representa uma área de cerca de 50 km). Origem dos dados climáticos: ' + origin + '.', 8.5, C.muted)
  font(10, true, C.deep); ensure(10); text('Links oficiais', M, y + 3); y += 7
  const links: [string, string][] = [
    ['Consulta usada neste relatório (NASA POWER)', nasa.url], ['Documentação NASA POWER', powerDocs], ['MODIS MOD13Q1 (LP DAAC)', ndviProduct],
    ['Serviço MODIS do ORNL DAAC', ndviDocs], ['SRTM (Earthdata)', srtmDocs], ['Índice ONI (NOAA)', ensoDocs], ['Previsão El Niño (NOAA)', ensoOutlook],
    ['Necessidade de água das culturas (FAO)', fao], ['Embrapa', embrapa],
  ]
  for (const [label, url] of links) {
    ensure(9)
    font(8, true, C.text); text(label, M, y + 3)
    font(6.5, false, C.blue); let l = clean(url); while (pdf.getTextWidth(l) > CW && l.length > 10) l = l.slice(0, -4) + '…'; pdf.textWithLink(l, M, y + 6.2, { url }); y += 8
  }
  y += 2
  font(10, true, C.deep); ensure(10); text('Como as notas foram calculadas', M, y + 3); y += 7
  para(methodology, 7.5, C.text)
  para(limits, 7.5, C.muted)
  ensure(14)
  box(M, y, CW, 12, C.paleAmber, [240, 220, 168])
  font(8.5, true, [107, 77, 14]); text('Esta ferramenta apoia, mas não substitui, o julgamento do produtor e a assistência técnica local.', M + 4, y + 7.5)

  // Rodapé
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    stroke(C.line); pdf.setLineWidth(.2); pdf.line(M, H - 12, W - M, H - 12)
    font(7.5, false, C.muted); text('EarthVision  |  ' + (farm.name.trim() || location.name), M, H - 7); text('Página ' + page + ' de ' + pages, W - M, H - 7, { align: 'right' })
  }
  return pdf
}

export function exportReport(input: ReportInput) {
  buildReport(input).save('EarthVision-relatorio-' + new Date().toISOString().slice(0, 10) + '.pdf')
}
