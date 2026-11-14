import { jsPDF } from 'jspdf'
import { fahrenheit, fahrenheitDelta, frostThreshold, heatThreshold, heavyRainThreshold, monthNames, periodOf, powerDocs, type Climate, type Location } from './power'
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
const num = (value: number | null | undefined, digits = 0) => value == null || !Number.isFinite(value) ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const money = (value: number) => (value < 0 ? '-BRL ' : 'BRL ') + Math.abs(Math.round(value)).toLocaleString('en-US')
const unit = (value: number | null | undefined, suffix: string, digits = 0) => value == null || !Number.isFinite(value) ? '-' : num(value, digits) + suffix
const short = (value: number) => Math.abs(value) >= 1e6 ? num(value / 1e6, 1) + ' mi' : Math.abs(value) >= 1e3 ? num(value / 1e3, 0) + 'k' : num(value)

export function buildReport(input: ReportInput) {
  const { location, farm, climate, nasa, strategies, ndvi, terrain, problems, plan, impact, scenario } = input
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  pdf.setProperties({ title: 'EarthVision | Crop rotation report' })
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
    const rains = nasa.months.map((m) => m.rain ?? 0), temps = nasa.months.map((m) => fahrenheit(m.temperature))
    const ndviValues = ndvi?.months.map((m) => m.ndvi) ?? []
    const maxRain = Math.max(50, ...rains) * 1.1
    const validT = temps.filter((t): t is number => t !== null)
    const tMin = Math.floor(Math.min(...validT, 15) - 2), tMax = Math.ceil(Math.max(...validT, 30) + 2)
    font(9, true, C.deep); text('Monthly rainfall and temperature (' + nasa.year + ')', x + 5, yy + 6.5)
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
    fill(C.mint); pdf.rect(x + 5, ly - 2.4, 3, 3, 'F'); font(7, false, C.muted); text('Rainfall (mm, left axis)', x + 9.5, ly)
    stroke(C.amber); pdf.setLineWidth(.7); pdf.line(x + 45, ly - 1, x + 50, ly - 1); text('Temperature (°F, right axis)', x + 51.5, ly)
    if (ndviValues.some((v) => v != null)) { stroke(C.green); pdf.setLineDashPattern([1.2, 1], 0); pdf.line(x + 95, ly - 1, x + 100, ly - 1); pdf.setLineDashPattern([], 0); text('Vegetation greenness (NDVI 0-1)', x + 101.5, ly) }
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
      font(8.5, true, s.isCurrent ? C.muted : C.deep); text((s.isCurrent ? 'Current: ' : '') + s.name, x + 2, ry + 3.5)
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
      { name: 'Neutral year', c: C.green, values: plan.seasons.map((s) => s.profit.neutral) },
      { name: 'El Niño', c: C.orange, values: plan.seasons.map((s) => s.profit.elnino) },
      { name: 'La Niña', c: C.blue, values: plan.seasons.map((s) => s.profit.lanina) },
      { name: 'Without rotation', c: [140, 140, 140], values: plan.seasons.map((s) => s.baseline), dash: true },
    ]
    const all = series.flatMap((s) => s.values)
    const lo = Math.min(0, ...all), hi = Math.max(1, ...all) * 1.08
    stroke(C.line); pdf.setLineWidth(.2)
    for (let i = 0; i <= 4; i++) { const gy = py + ph - ph * i / 4; pdf.line(px, gy, px + pw, gy); font(6.3, false, C.muted); text(short(lo + (hi - lo) * i / 4), px - 1.5, gy + 1, { align: 'right' }) }
    const n = plan.seasons.length, step = n > 1 ? pw / (n - 1) : pw
    plan.seasons.forEach((s, i) => { font(5.8, false, C.muted); text(s.label.replace('Year ', 'A'), px + i * step, py + ph + 4, { align: 'center' }) })
    for (const s of series) {
      stroke(s.c); pdf.setLineWidth(s.dash ? .5 : .8); if (s.dash) pdf.setLineDashPattern([1.5, 1], 0)
      s.values.forEach((v, i) => { if (i) pdf.line(px + (i - 1) * step, py + ph - (s.values[i - 1] - lo) / (hi - lo) * ph, px + i * step, py + ph - (v - lo) / (hi - lo) * ph) })
      pdf.setLineDashPattern([], 0)
    }
    series.forEach((s, i) => { stroke(s.c); pdf.setLineWidth(.8); pdf.line(x + 5 + i * 22, yy + h - 5, x + 9 + i * 22, yy + h - 5); font(6.5, false, C.muted); text(s.name, x + 10 + i * 22, yy + h - 4) })
  }
  function soilChart(x: number, yy: number, w: number, h: number) {
    box(x, yy, w, h)
    font(9, true, C.deep); text('Soil health (0-100)', x + 5, yy + 6.5)
    const px = x + 10, pw = w - 15, py = yy + 11, ph = h - 26
    const n = plan.seasons.length, step = pw / Math.max(1, n)
    stroke(C.line); pdf.setLineWidth(.2)
    ;[0, 50, 100].forEach((v) => { const gy = py + ph - ph * v / 100; pdf.line(px, gy, px + pw, gy); font(6.3, false, C.muted); text(String(v), px - 1.5, gy + 1, { align: 'right' }) })
    plan.seasons.forEach((s, i) => {
      const bh = ph * s.soil / 100
      fill(C.mint); pdf.rect(px + i * step + step * .15, py + ph - bh, step * .7, bh, 'F')
      stroke([140, 140, 140]); pdf.setLineWidth(.6); const by = py + ph - ph * s.baselineSoil / 100; pdf.line(px + i * step + step * .1, by, px + i * step + step * .9, by)
      font(5.8, false, C.muted); text(s.label.replace('Year ', 'A'), px + i * step + step / 2, py + ph + 4, { align: 'center' })
    })
    fill(C.mint); pdf.rect(x + 5, yy + h - 7, 3, 3, 'F'); font(6.5, false, C.muted); text('With rotation', x + 9.5, yy + h - 4.5)
    stroke([140, 140, 140]); pdf.line(x + 30, yy + h - 5.5, x + 35, yy + h - 5.5); text('Without rotation', x + 36.5, yy + h - 4.5)
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
  font(22, true, C.white); text('Your farm report', M, 26)
  font(11, false, [224, 238, 225]); text((farm.name.trim() || 'Unnamed farm') + '  -  ' + location.name, M, 34)
  font(8.5, false, [188, 220, 190]); text('Generated on ' + new Date().toLocaleDateString('en-US') + ' with NASA data for ' + nasa.year + (scenario.rainPct || scenario.tempDelta ? ' (simulated scenario: rainfall ' + (scenario.rainPct > 0 ? '+' : '') + scenario.rainPct + '%, temperature +' + num(fahrenheitDelta(scenario.tempDelta), 1) + ' °F)' : ''), M, 42)
  y = 58

  // Resumo em linguagem simples
  const summary: string[] = []
  if (best) {
    summary.push('After ' + crops[farm.crop].name.toLowerCase() + ', the highest-scoring option for ' + monthNames[farm.month].toLowerCase() + ' is ' + best.name.toLowerCase() + ' (score ' + (best.total ?? '-') + ' out of 100' + (current?.total != null && best.total != null ? ', compared with ' + current.total + ' for your current rotation' : '') + ').')
    summary.push(best.why)
    if (best.profitHa > 0) summary.push('Estimated profit: ' + money(best.profitHa) + ' per hectare' + (area ? ', approximately ' + money(best.profitHa * area) + ' in ' + num(area) + ' ha.' : '.'))
    else summary.push('It improves the soil without grain sales' + (best.nSaving ? ' and saves approximately ' + money(best.nSaving) + '/ha in fertilizer next season.' : '.'))
  } else summary.push('No eligible crop in ' + monthNames[farm.month].toLowerCase() + '. Try another month or allow more crops.')
  if (last) summary.push('Over three years, the proposed profit is ' + (gain >= 0 ? money(gain) + ' higher' : money(-gain) + ' lower') + ' than leaving the field fallow in the second season. The soil health score rises from 50 to ' + last.soil + ' points.')
  const topProblem = problems.find((p) => p.level === 'high') ?? problems[0]
  if (topProblem) summary.push('Main regional risk: ' + topProblem.title.toLowerCase() + '. ' + topProblem.text)

  font(10, true, C.green); text('EXECUTIVE SUMMARY', M, y); y += 3
  const summaryLines = summary.flatMap((s) => lines(s, CW - 14))
  const boxH = summaryLines.length * (lh(10.5) + .7) + summary.length * 1.5 + 8
  box(M, y, CW, boxH, C.light, [185, 220, 185])
  fill(C.green); pdf.rect(M, y, 2, boxH, 'F')
  let sy = y + 7
  for (const s of summary) { font(10.5, false, C.deep); for (const l of lines(s, CW - 14)) { text(l, M + 7, sy); sy += lh(10.5) + .7 } sy += 1.5 }
  y += boxH + 7

  // Indicadores principais
  const kpis = [
    { label: 'Recommendation', value: best ? best.name : '-', note: best ? 'nota ' + (best.total ?? '-') + '/100' : '' },
    { label: 'Estimated profit', value: best ? money(best.profitHa) + '/ha' : '-', note: area ? money((best?.profitHa ?? 0) * area) + ' overall' : 'enter the field area' },
    { label: 'Three-year gain', value: last ? (gain >= 0 ? '+' : '') + money(gain) : '-', note: 'compared with no rotation' },
    { label: 'Soil health', value: last ? last.soil + ' pts' : '-', note: last ? 'without rotation: ' + last.baselineSoil : '' },
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
  font(10, true, C.green); text('YOUR INPUTS', M, y); y += 4
  const answers = [
    ['Location', location.name], ['Area', farm.area ? farm.area + ' ha' : 'not provided'],
    ['Current crop', crops[farm.crop].name], ['Next planting', monthNames[farm.month] + ' - ' + seasonOf(farm.month).name],
    ['Soil type', soils[farm.soil].name], ['Irrigation', farm.irrigated ? 'Yes' : 'No'],
    ['Priority', priorities[farm.priority].name], ['Livestock', farm.cattle ? 'Yes (forage has value)' : 'No'],
    ['Local markets', farm.markets.length ? farm.markets.map(marketName).join(', ') : 'no crops selected'],
    ['Small-seed planter', farm.smallSeedPlanter ? 'Yes' : 'No'],
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
  for (const l of lines('This report uses satellite and model data to identify patterns and compare options. Use it as a starting point for a discussion with your agronomist.', CW)) { text(l, M, y); y += 3.5 }

  /* ---------- Página 2: clima e risks ---------- */
  pdf.addPage(); y = M
  section('1', 'Local climate', 'NASA data for ' + location.name + ' in ' + nasa.year + ' (' + (phase ? phaseNames[phase.phase] + ': ' + phase.text.toLowerCase() : 'Pacific phase unavailable') + ').')
  monthlyChart(M, y, CW, 72); y += 78
  const facts = [
    ['Annual rainfall', unit(nasa.rain, ' mm')], ['Average temperature', unit(fahrenheit(nasa.temperature), ' °F', 1)],
    ['Evapotranspiration', unit(nasa.eto, ' mm')], ['Days above 95 °F', num(nasa.heatDays)],
    ['Days with frost risk', num(nasa.frostDays)], ['Meses com < 60 mm', num(nasa.dryMonths)],
  ]
  const fw = (CW - 10) / 6
  facts.forEach(([l, v], i) => { const fx = M + i * (fw + 2); box(fx, y, fw, 15, [250, 252, 249]); font(6.3, true, C.muted); text(lines(l.toUpperCase(), fw - 4)[0], fx + 2.5, y + 5); font(10, true, C.deep); text(v, fx + 2.5, y + 11.5) })
  y += 21
  font(11, true, C.deep); text('Crop risk calendar', M, y); y += 4
  calendarStrip(M, y, CW); y += 26
  y += 1
  para('Each month shows the water balance (rainfall minus evapotranspiration). Negative values indicate a deficit that soil water or irrigation must cover.', 8, C.muted)
  y += 2
  y += 2
  font(11, true, C.deep); text('Regional risks', M, y); y += 5
  if (!problems.length) para('No major climate risk was flagged for this year.', 9.5)
  for (const p of problems) {
    const pl = lines(p.text, CW - 40)
    const ph = Math.max(12, pl.length * 3.9 + 7)
    ensure(ph + 3)
    const high = p.level === 'high'
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
  section('2', 'Planting recommendation', 'We compare your current rotation with the best alternatives for ' + monthNames[farm.month].toLowerCase() + ', prioritizing ' + priorities[farm.priority].name.toLowerCase() + '.')
  y += scoreChart(M, y, CW) + 4
  // tabela financeira
  ensure(12 + strategies.length * 7)
  const cols = [['Strategy', 0], ['Cycle', 58], ['Revenue/ha', 82], ['Cost/ha', 108], ['Profit/ha', 132], ['Fertilizer savings', 156]] as const
  fill(C.deep); pdf.rect(M, y, CW, 7, 'F'); font(7.5, true, C.white); cols.forEach(([c, x]) => text(c, M + 2 + x, y + 4.8)); y += 7
  strategies.forEach((s, i) => {
    fill(i % 2 ? C.white : [246, 249, 245]); pdf.rect(M, y, CW, 7, 'F')
    font(8, s.isCurrent ? false : true, C.deep); text((s.isCurrent ? 'Current: ' : '') + s.name, M + 2, y + 4.8)
    font(8, false, C.text); text(s.months, M + 2 + 58, y + 4.8); text(money(s.revenueHa), M + 2 + 82, y + 4.8); text(money(s.costHa), M + 2 + 108, y + 4.8)
    font(8, true, s.profitHa >= 0 ? C.green : C.red); text(money(s.profitHa), M + 2 + 132, y + 4.8)
    font(8, false, C.text); text(s.nSaving ? '+' + money(s.nSaving) : '-', M + 2 + 156, y + 4.8)
    y += 7
  })
  y += 2
  para('Prices, costs, and yields are estimates' + (Object.keys(farm.prices).length ? ', including your adjustments.' : '. Enter local values in the app.'), 8, C.muted)
  y += 2
  for (const s of strategies) {
    const head = (s.isCurrent ? 'Current rotation: ' : (options.indexOf(s) + 1) + ': ') + s.sequence
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
    block('Benefits', s.reasons, C.green, '+')
    block('What the data show', s.evidence, C.blue, '•')
    block('Risks to review with an agronomist', s.risks, C.red, '!')
    block('Information gaps', s.gaps, C.amber, '?')
    y += 3
  }

  /* ---------- Página 4: plano ---------- */
  pdf.addPage(); y = M
  section('3', 'Three-year plan',  'Keep ' + crops[farm.crop].name.toLowerCase() + ' as the main crop and compare second-season rotation against leaving the field fallow.')
  if (plan.seasons.length) {
    profitChart(M, y, CW * .58, 70); soilChart(M + CW * .58 + 4, y, CW * .42 - 4, 70); y += 76
    font(11, true, C.deep); text('Season by season', M, y); y += 4
    for (const [i, s] of plan.seasons.entries()) {
      const actionLines = lines(s.action, CW - 74), benefitLines = lines(s.benefit, CW - 74)
      const bh = Math.max(16, (actionLines.length + benefitLines.length) * 3.7 + 6)
      ensure(bh + 2)
      box(M, y, CW, bh, i % 2 ? C.white : [250, 252, 249])
      fill(s.kind === 'cover crop' ? C.green : [224, 169, 91]); pdf.rect(M, y, 1.8, bh, 'F')
      font(7, false, C.muted); text(s.label, M + 5, y + 5)
      font(10, true, C.deep); text(s.crop, M + 5, y + 10)
      font(7, false, C.muted); text(s.months, M + 5, y + 14)
      font(8.3, false, C.text); actionLines.forEach((l, k) => text(l, M + 48, y + 5 + k * 3.7))
      font(8, false, C.green); benefitLines.forEach((l, k) => text(l, M + 48, y + 5 + (actionLines.length + k) * 3.7))
      font(9, true, s.profitHa >= 0 ? C.green : C.red); text(money(s.profitHa) + '/ha', W - M - 3, y + 6, { align: 'right' })
      font(7.5, false, C.muted); text('soil ' + s.soil + ' (' + (s.soilChange >= 0 ? '+' : '') + s.soilChange + ')', W - M - 3, y + 11, { align: 'right' })
      y += bh + 1.5
    }
    y += 4
    const neutral = last.profit.neutral, elnino = last.profit.elnino, lanina = last.profit.lanina
    const sw = (CW - 6) / 3
    ;[['Neutral year', neutral, C.green], ['El Niño years', elnino, C.orange], ['La Niña years', lanina, C.blue]].forEach(([label, value, c], i) => {
      const bx = M + i * (sw + 3)
      box(bx, y, sw, 18); fill(c as RGB); pdf.rect(bx, y, 1.8, 18, 'F')
      font(7.5, true, C.muted); text(String(label).toUpperCase(), bx + 5, y + 6)
      font(12, true, c as RGB); text(money(value as number), bx + 5, y + 13.5)
    })
    y += 23
    para('Cumulative three-year profit with rotation. Without rotation: ' + money(last.baseline) + '. El Niño and La Niña scenarios use typical effects for the region (' + impact.region + ') as assumptions.', 8.5, C.muted)
  }
  y += 4
  ensure(45)
  font(11, true, C.deep); text('Next steps', M, y); y += 5
  const todo = [
    best ? 'Ask your agronomist about ' + best.name.toLowerCase() + ' for ' + monthNames[farm.month].toLowerCase() + ' and confirm the cultivar, planting window, and seed supply.' : 'Review the planting month and local markets.',
    farm.soil === 'unknown' ? 'Test your soil to improve the recommendation.' : 'Update your soil test before the next season.',
    'Check local prices and costs and update them in the app.',
    'Check the official NOAA El Niño and La Niña outlook before each season.',
    problems.some((p) => p.title === 'Sloping terrain' || p.title === 'Extreme rainfall') ? 'Consider terracing, contour farming, and cover in months with heavy rainfall.' : 'Maintain cover during months flagged for bare soil or drought.',
  ]
  todo.forEach((t) => { const ls = lines(t, CW - 12); ensure(ls.length * 4 + 2); stroke(C.green); pdf.setLineWidth(.4); pdf.rect(M + 1, y, 3.5, 3.5); font(9, false, C.text); ls.forEach((l, i) => text(l, M + 8, y + 3 + i * 4)); y += ls.length * 4 + 2.5 })

  /* ---------- Página 5: dados oficiais NASA ---------- */
  pdf.addPage(); y = M
  section('4', 'Official NASA data used', 'Historical data with parameter codes and links to the original sources.')
  const origin = nasa.origin === 'live' ? 'live API request' : 'saved official response'
  const rows: [string, string, string, string][] = [
    ['NASA POWER (LaRC)', 'T2M - mean temperature at 2 m', unit(fahrenheit(nasa.temperature), ' °F', 1), nasa.coverage.T2M + '/365 days'],
    ['NASA POWER (LaRC)', 'PRECTOTCORR - corrected precipitation', unit(nasa.rain, ' mm/year'), nasa.coverage.PRECTOTCORR + '/365 days'],
    ['NASA POWER (LaRC)', 'ALLSKY_SFC_SW_DWN - solar radiation', unit(nasa.solar, ' MJ/m²/day', 1), nasa.coverage.ALLSKY_SFC_SW_DWN + '/365 days'],
    ['NASA POWER (LaRC)', 'T2M_MAX - days above ' + fahrenheit(heatThreshold) + ' °F', unit(nasa.heatDays, ' days'), nasa.heatDays === null ? 'unavailable' : 'daily'],
    ['NASA POWER (LaRC)', 'T2M_MIN - days below ' + fahrenheit(frostThreshold) + ' °F (frost risk)', unit(nasa.frostDays, ' days'), nasa.frostDays === null ? 'unavailable' : 'daily'],
    ['NASA POWER (LaRC)', 'PRECTOTCORR - days com >= ' + heavyRainThreshold + ' mm', unit(nasa.heavyRainDays, ' days'), 'daily'],
    ['Calculated (Hargreaves)', 'Reference evapotranspiration (T2M + radiation)', unit(nasa.eto, ' mm/year'), 'monthly'],
    ['MERRA-2 / GMAO', 'GWETROOT - root-zone soil moisture', nasa.soilMoisture == null ? '-' : num(nasa.soilMoisture * 100) + ' %', nasa.soilMoisture == null ? 'unavailable' : 'daily'],
    ['MODIS Terra MOD13Q1', 'NDVI 250 m, 16-day composites', ndvi ? num(ndvi.mean, 2) + ' (min ' + num(ndvi.low, 2) + ', max ' + num(ndvi.peak, 2) + ')' : '-', ndvi ? ndvi.composites + ' images' : 'unavailable'],
    ['SRTM (NASA/NGA)', 'Elevation and slope (30 m)', terrain ? terrain.elevation + ' m, ' + num(terrain.slope, 1) + '%' : '-', terrain ? 'erosion risk: ' + terrain.erosion : 'unavailable'],
    ['NOAA CPC (ONI)', 'Pacific phase in ' + nasa.year, phase ? phaseNames[phase.phase] : '-', 'annual'],
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
  para('Period: ' + periodOf(nasa.year) + '. Point: ' + location.lat.toFixed(4) + ', ' + location.lon.toFixed(4) + ' (NASA POWER represents a region of approximately 50 km). Climate data source: ' + origin + '.', 8.5, C.muted)
  font(10, true, C.deep); ensure(10); text('Links oficiais', M, y + 3); y += 7
  const links: [string, string][] = [
    ['NASA POWER query used in this report', nasa.url], ['NASA POWER documentation', powerDocs], ['MODIS MOD13Q1 (LP DAAC)', ndviProduct],
    ['ORNL DAAC MODIS service', ndviDocs], ['SRTM (Earthdata)', srtmDocs], ['Oceanic Niño Index (NOAA)', ensoDocs], ['El Niño outlook (NOAA)', ensoOutlook],
    ['Crop water requirements (FAO)', fao], ['Embrapa', embrapa],
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
  font(8.5, true, [107, 77, 14]); text('Use this tool alongside farmer judgment and local technical advice.', M + 4, y + 7.5)

  // Rodapé
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    stroke(C.line); pdf.setLineWidth(.2); pdf.line(M, H - 12, W - M, H - 12)
    font(7.5, false, C.muted); text('EarthVision  |  ' + (farm.name.trim() || location.name), M, H - 7); text('Page ' + page + ' of ' + pages, W - M, H - 7, { align: 'right' })
  }
  return pdf
}

export function exportReport(input: ReportInput) {
  buildReport(input).save('EarthVision-relatorio-' + new Date().toISOString().slice(0, 10) + '.pdf')
}
