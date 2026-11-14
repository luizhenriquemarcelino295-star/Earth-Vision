import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTooltip, useMap, useMapEvents } from 'react-leaflet'
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CloudRain, Coins, Droplets, FileDown, Flame, Globe2, Leaf, LocateFixed, MapPin, Satellite, Search, Sprout, Sun, Thermometer, TrendingUp, Waves } from 'lucide-react'
import '@fontsource-variable/inter'
import 'leaflet/dist/leaflet.css'
import './style.css'
import { challenge, fetchClimate, format, locations, monthNames, periodOf, powerDocs, years, type Climate, type Location } from './power'
import { fetchNdvi, ndviProduct, type Ndvi } from './ndvi'
import { locateMe, searchPlaces, type Place } from './geo'
import { ensoDocs, ensoImpact, ensoOutlook, phaseNames, yearPhase, type Phase } from './enso'
import { challengeSteps, nasaSources } from './challenge'
import { compare, criteria, cropList, crops, defaultFarm, economics, embrapa, fao, limits, longTermPlan, methodology, priorities, regionProblems, seasonOf, soils, weights, type Crop, type Farm, type Scenario } from './rotation'

function readSaved<T>(key: string, fallback: T, validate: (value: T) => boolean): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && validate(value) ? value : fallback
  } catch { return fallback }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* opcional */ }
}
const money = (value: number) => 'R$ ' + Math.round(value).toLocaleString('pt-BR')
const validFarm = (v: Farm) => Object.hasOwn(crops, v.crop) && Object.hasOwn(soils, v.soil) && Object.hasOwn(priorities, v.priority) && typeof v.name === 'string' && typeof v.area === 'string' && typeof v.irrigated === 'boolean' && Number.isInteger(v.month) && v.month >= 0 && v.month < 12 && typeof v.prices === 'object'
const steps = [
  { id: 'local', title: 'Onde fica', icon: MapPin },
  { id: 'clima', title: 'Clima e problemas', icon: CloudRain },
  { id: 'talhao', title: 'Seu talhão', icon: Sprout },
  { id: 'proposta', title: 'Proposta de plantio', icon: Leaf },
  { id: 'futuro', title: 'Próximos 3 anos', icon: TrendingUp },
]

function MapSelection({ location, select }: { location: Location; select: (location: Location) => void }) {
  const map = useMap()
  useMapEvents({ click: ({ latlng }) => {
    const p = latlng.wrap()
    if (Math.abs(p.lat) <= 85) select({ lat: +p.lat.toFixed(4), lon: +p.lng.toFixed(4), name: 'Ponto escolhido no mapa' })
  } })
  useEffect(() => { map.flyTo([location.lat, location.lon], Math.max(map.getZoom(), 6), { duration: .6 }) }, [map, location])
  return <CircleMarker center={[location.lat, location.lon]} radius={10} pathOptions={{ color: 'white', weight: 3, fillColor: '#13844f', fillOpacity: 1 }}><MapTooltip>{location.name}</MapTooltip></CircleMarker>
}

function CitySearch({ select }: { select: (location: Location) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [status, setStatus] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) return
    setStatus('Buscando…')
    try {
      const found = await searchPlaces(query)
      setResults(found); setStatus(found.length ? '' : 'Nenhuma cidade encontrada.')
    } catch { setStatus('Não foi possível buscar agora. Clique no mapa.') }
  }
  async function gps() {
    setStatus('Obtendo sua localização…')
    try { select(await locateMe()); setStatus('') } catch (error) { setStatus((error as Error).message) }
  }
  return <div className="search">
    <form onSubmit={submit}><Search size={17} /><input aria-label="Cidade" placeholder="Digite a cidade (ex.: Sorriso, Rosario, Iowa City)" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="button primary-solid">Buscar</button></form>
    <button type="button" className="button secondary" onClick={gps}><LocateFixed size={16} /> Usar minha localização</button>
    {status && <small role="status">{status}</small>}
    {results && results.length > 0 && <ul className="results-list">{results.map((place) => <li key={place.lat + ',' + place.lon}><button type="button" onClick={() => { select(place); setResults(null); setQuery('') }}><MapPin size={14} /> {place.name}</button></li>)}</ul>}
  </div>
}

function App() {
  const [step, setStep] = useState(0)
  const [location, setLocation] = useState(() => readSaved<Location>('earthvision-location', locations[0], (v) => Number.isFinite(v.lat) && Number.isFinite(v.lon) && typeof v.name === 'string'))
  const [year, setYear] = useState(2025)
  const [farm, setFarm] = useState(() => readSaved<Farm>('earthvision-farm-v2', defaultFarm, validFarm))
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState<{ key: string; climate?: Climate; error?: string } | null>(null)
  const [ndviState, setNdviState] = useState<{ key: string; ndvi?: Ndvi } | null>(null)
  const [scenario, setScenario] = useState<Scenario>('neutral')
  const [reportStatus, setReportStatus] = useState('')
  const requestKey = [location.lat, location.lon, year, retry].join(',')
  const active = request?.key === requestKey ? request : null
  const climate = active?.climate ?? null
  const ndvi = ndviState?.key === requestKey ? ndviState.ndvi ?? null : null
  const ndviDone = ndviState?.key === requestKey
  const impact = useMemo(() => ensoImpact(location), [location])
  const strategies = compare(farm, climate, ndvi)
  const problems = regionProblems(climate, ndvi, impact, farm.soil)
  const plan = longTermPlan(farm, strategies, climate, impact)
  const season = seasonOf(farm.month)
  const area = Math.max(0, Number(farm.area) || 0)
  const chartData = climate?.months.map((m, i) => ({ ...m, ndvi: ndvi?.months[i].ndvi ?? null }))

  useEffect(() => {
    const controller = new AbortController()
    fetchClimate(location, controller.signal, year)
      .then((data) => { if (!controller.signal.aborted) setRequest({ key: requestKey, climate: data }) })
      .catch(() => { if (!controller.signal.aborted) setRequest({ key: requestKey, error: 'Não foi possível consultar a NASA POWER para este ponto. Verifique a internet.' }) })
    fetchNdvi(location, controller.signal, year)
      .then((data) => { if (!controller.signal.aborted) setNdviState({ key: requestKey, ndvi: data }) })
      .catch(() => { if (!controller.signal.aborted) setNdviState({ key: requestKey }) })
    save('earthvision-location', location)
    return () => controller.abort()
  }, [location, year, requestKey])
  useEffect(() => { save('earthvision-farm-v2', farm) }, [farm])
  useEffect(() => { document.getElementById('fluxo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [step])
  function update<K extends keyof Farm>(key: K, value: Farm[K]) { setFarm((previous) => ({ ...previous, [key]: value })) }
  function setPrice(crop: Crop, field: 'yield' | 'price' | 'cost', value: string) {
    const number = Number(value)
    setFarm((previous) => ({ ...previous, prices: { ...previous.prices, [crop]: { ...previous.prices[crop], [field]: value === '' || !Number.isFinite(number) ? undefined : number } } }))
  }
  async function download() {
    if (!climate) return
    setReportStatus('Gerando PDF…')
    try {
      const { exportReport } = await import('./report')
      exportReport(location, farm, climate, strategies, ndvi, problems, plan, impact)
      setReportStatus('PDF gerado.')
    } catch { setReportStatus('Falha ao gerar o PDF.') }
  }
  const phase = yearPhase[year]
  const cards = [
    { icon: Thermometer, name: 'Temperatura média', value: climate?.temperature ?? null, unit: '°C', color: 'amber' },
    { icon: CloudRain, name: 'Chuva no ano', value: climate?.rain ?? null, unit: 'mm', color: 'blue', digits: 0 },
    { icon: Sun, name: 'Sol (radiação)', value: climate?.solar ?? null, unit: 'MJ/m²/dia', color: 'amber' },
    { icon: Droplets, name: 'Umidade do solo', value: climate?.soilMoisture == null ? null : climate.soilMoisture * 100, unit: '%', color: 'blue', digits: 0 },
    { icon: Flame, name: 'Dias acima de 35 °C', value: climate?.heatDays ?? null, unit: 'dias', color: 'amber', digits: 0 },
    { icon: Leaf, name: 'Verde da vegetação (NDVI)', value: ndvi?.mean ?? null, unit: '0–1', color: 'green', digits: 2 },
  ]
  const best = strategies[0]
  const last = plan.seasons[plan.seasons.length - 1]
  const gain = last ? last.profit[scenario] - last.baseline : 0
  const loading = !climate && !active?.error

  return <>
    <header className="top"><div className="shell top-inner">
      <a href="#inicio" className="brand"><span className="brand-icon"><Globe2 size={23} /></span>EarthVision</a>
      <nav aria-label="Navegação"><a href="#fluxo"><Sprout size={16} /> Planejar</a><a href="#desafio"><Satellite size={15} /> Desafio</a></nav>
      <a className="challenge" target="_blank" rel="noreferrer" href={challenge}><Satellite size={15} /> NASA Space Apps 2026</a>
    </div></header>
    <main id="inicio">
      <section className="hero"><div className="shell hero-inner">
        <div className="hero-copy"><p className="eyebrow"><Satellite size={16} /> Dados de satélite da NASA para o campo</p><h1>Planeje sua<br />próxima <em>safra.</em></h1>
          <p>Em 5 passos: diga onde fica sua fazenda, veja os problemas de clima da região e receba uma proposta de rotação com custo, lucro e plano para 3 anos.</p>
          <button className="button primary" onClick={() => { setStep(0); document.getElementById('fluxo')?.scrollIntoView({ behavior: 'smooth' }) }}>Começar agora <ArrowRight size={18} /></button></div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="planet"></div><div className="star one"></div><div className="star two"></div><div className="star three"></div></div>
      </div></section>

      <div className="shell content" id="fluxo">
        <ol className="stepper" aria-label="Etapas">{steps.map((item, index) => {
          const Icon = item.icon
          return <li key={item.id}><button className={index === step ? 'current' : index < step ? 'done' : ''} onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined}>
            <span className="dot">{index < step ? <Check size={15} /> : <Icon size={15} />}</span><span><small>Passo {index + 1}</small>{item.title}</span></button></li>
        })}</ol>

        <div className="context-bar"><span><MapPin size={14} /> {location.name}</span><span><CloudRain size={14} /> Clima de {year}</span><span><Sprout size={14} /> {crops[farm.crop].name} · {season.name}</span><span>{priorities[farm.priority].icon} {priorities[farm.priority].name}</span></div>

        {step === 0 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><MapPin size={16} /> Passo 1</p><h2>Onde fica sua fazenda?</h2><p>Busque a cidade em qualquer país, use o GPS do celular ou toque no mapa.</p></div></div>
          <div className="territory">
            <div className="panel pad"><CitySearch select={setLocation} />
              <p className="hint">Exemplos rápidos:</p>
              <div className="chips">{locations.map((item) => <button key={item.name} className={'chip ' + (item.name === location.name ? 'picked' : '')} onClick={() => setLocation(item)}>{item.name}</button>)}</div>
              <div className="selected"><MapPin size={18} /><div><strong>{location.name}</strong><small>Os dados da NASA cobrem uma área de cerca de 50 km ao redor deste ponto.</small></div></div>
            </div>
            <div className="panel map-card"><MapContainer center={[location.lat, location.lon]} zoom={5} minZoom={2} maxZoom={16} worldCopyJump scrollWheelZoom className="map tall">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapSelection location={location} select={setLocation} /></MapContainer></div>
          </div>
        </section>}

        {step === 1 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><CloudRain size={16} /> Passo 2</p><h2>Como é o clima e quais são os problemas da região</h2><p>Dados de satélite e modelos da NASA para {location.name}.</p></div>
            <label className="year-pick">Ano de referência<select value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y} · {phaseNames[yearPhase[y].phase]}</option>)}</select></label></div>
          <div className={'enso panel ' + phase.phase}><Waves size={22} /><div><strong>{year}: {phaseNames[phase.phase]}</strong><p>{phase.text}. Compare anos diferentes para ver como o clima muda.</p></div>
            <div className="enso-effects"><div><b>Em anos de El Niño</b><span>{impact.elninoText}</span></div><div><b>Em anos de La Niña</b><span>{impact.laninaText}</span></div><small>{impact.region} · <a href={ensoDocs} target="_blank" rel="noreferrer">índice ONI (NOAA)</a> · <a href={ensoOutlook} target="_blank" rel="noreferrer">previsão atual</a></small></div></div>
          {loading ? <div className="panel empty"><Satellite size={25} /><p>Consultando a NASA…</p></div> : !climate ? <div className="panel empty"><Satellite size={25} /><p>{active?.error}</p><button className="button secondary" onClick={() => setRetry(retry + 1)}>Tentar novamente</button></div> : <>
            <h3 className="sub">Problemas da região</h3>
            {problems.length ? <div className="problems">{problems.map((p) => <article key={p.title} className={'panel problem ' + p.level}><AlertTriangle size={18} /><div><strong>{p.title}</strong><p>{p.text}</p></div></article>)}</div> : <p className="hint">Nenhum problema climático forte foi detectado neste ano.</p>}
            <div className="metrics">{cards.map(({ icon: Icon, name, value, unit, color, digits }) => <article className="panel metric" key={name}><span className={'metric-icon ' + color}><Icon size={19} /></span><p>{name}</p><div><strong>{format(value, digits)}</strong> <small>{value !== null ? unit : (name.includes('NDVI') && !ndviDone ? 'carregando…' : 'indisponível')}</small></div></article>)}</div>
            <div className="panel chart-card"><div className="panel-head"><div><h3>Clima ao longo de {year}</h3><p>Barras: chuva (mm). Linha marrom: temperatura (°C). Tracejado verde: vegetação (NDVI).</p></div></div>
              <div className="chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}>
                <CartesianGrid vertical={false} stroke="#e7eee9" strokeDasharray="4 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="rain" width={38} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis yAxisId="temp" orientation="right" width={30} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis yAxisId="ndvi" hide domain={[0, 1]} />
                <Tooltip formatter={(value, name) => [format(Number(value), name === 'NDVI' ? 2 : 1), name]} />
                <Bar yAxisId="rain" name="Chuva (mm)" dataKey="rain" fill="#8acdb0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Area yAxisId="temp" name="Temperatura (°C)" type="monotone" dataKey="temperature" stroke="#a86429" fill="none" strokeWidth={2} dot />
                <Line yAxisId="ndvi" name="NDVI" type="monotone" dataKey="ndvi" stroke="#13844f" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
              </ComposedChart></ResponsiveContainer></div></div>
            <p className="source">{climate.origin === 'live' ? 'NASA POWER on-line' : 'Cópia local da NASA POWER (Sorriso, 2025)'} · {periodOf(year)} · <a href={climate.url} target="_blank" rel="noreferrer">dados originais</a>{ndvi && <> · NDVI MODIS ({ndvi.composites} imagens)</>}</p>
          </>}
        </section>}

        {step === 2 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><Sprout size={16} /> Passo 3</p><h2>Conte sobre o seu talhão</h2><p>Escolha o que está plantado, quando vai plantar de novo e o que é mais importante para você.</p></div></div>
          <div className="farm-grid">
            <div className="panel pad">
              <h3>Quando será o próximo plantio?</h3>
              <div className="months">{monthNames.map((m, i) => <button key={m} className={'chip ' + (i === farm.month ? 'picked' : '')} onClick={() => update('month', i)}>{m}</button>)}</div>
              <p className="season"><b>{season.name}.</b> {season.text}{climate?.months[farm.month].rain != null && <> Chuva histórica em {monthNames[farm.month]}: {format(climate.months[farm.month].rain, 0)} mm.</>}</p>
              <h3>O que está plantado agora (ou foi colhido)?</h3>
              <div className="crop-cards">{cropList.map((key) => <button key={key} className={'crop-card ' + (key === farm.crop ? 'picked' : '')} onClick={() => update('crop', key)}><strong>{crops[key].name}</strong><small>{crops[key].kind} · {crops[key].family}</small></button>)}</div>
              <p className="hint">{crops[farm.crop].description}</p>
            </div>
            <div className="panel pad">
              <h3>Tipo de solo</h3>
              <div className="chips">{Object.entries(soils).map(([key, soil]) => <button key={key} className={'chip ' + (key === farm.soil ? 'picked' : '')} onClick={() => update('soil', key as Farm['soil'])}>{soil.name}</button>)}</div>
              <p className="hint">{soils[farm.soil].text}</p>
              <div className="field-grid"><label>Nome da fazenda<input placeholder="Opcional" maxLength={100} value={farm.name} onChange={(e) => update('name', e.target.value)} /></label>
                <label>Área do talhão (ha)<input type="number" min="0" step="any" value={farm.area} onChange={(e) => update('area', e.target.value)} /></label></div>
              <label className="checkbox"><input type="checkbox" checked={farm.irrigated} onChange={(e) => update('irrigated', e.target.checked)} /> Tenho irrigação neste talhão</label>
              <h3>O que é mais importante para você?</h3>
              <div className="priority-cards">{Object.entries(priorities).map(([key, p]) => <button key={key} className={'priority-card ' + (key === farm.priority ? 'picked' : '')} onClick={() => update('priority', key as Farm['priority'])}><span>{p.icon}</span><strong>{p.name}</strong><small>{p.text}</small></button>)}</div>
            </div>
          </div>
        </section>}

        {step === 3 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><Leaf size={16} /> Passo 4</p><h2>Proposta de plantio</h2><p>Depois de {crops[farm.crop].name.toLowerCase()}, plantando em {monthNames[farm.month].toLowerCase()} ({season.name.toLowerCase()}), com foco em {priorities[farm.priority].name.toLowerCase()}.</p></div>
            <button className="button secondary" disabled={!climate} onClick={download}><FileDown size={18} /> Baixar relatório PDF</button></div>
          <p className="report-status" role="status">{reportStatus}</p>
          {!climate ? <div className="panel empty"><p>Precisamos dos dados de clima do passo 2.</p></div> : !best ? <div className="panel empty"><p>Nenhuma cultura da lista costuma ser plantada em {monthNames[farm.month]}. Escolha outro mês.</p></div> : <>
            <div className="panel verdict"><span className="big-score">{best.total ?? '—'}<small>/100</small></span><div><p className="eyebrow">Nossa recomendação</p><h3>{best.sequence}</h3><p>{best.description}</p>
              <p className="money-line"><Coins size={16} /> {best.profitHa > 0 ? 'Lucro estimado ' + money(best.profitHa) + '/ha' : 'Custo ' + money(best.costHa) + '/ha'}{area > 0 && <> · {money((best.profitHa + best.nSaving) * area)} em {area} ha (com economia de adubo)</>}</p></div></div>
            <div className="strategies">{strategies.map((item, index) => <article className={'panel strategy ' + (index === 0 ? 'best' : '')} key={item.id}>
              <div className="strategy-top"><span className="tag">{index === 0 ? '1ª opção' : (index + 1) + 'ª opção'} · {item.kind}</span><div className="score">{item.total ?? '—'}<small>/100</small></div></div>
              <h3>{item.name}</h3><strong className="sequence">{item.sequence} · ciclo {item.months}</strong>
              <div className="bars">{item.scores.map((score, i) => <div key={criteria[i]}><span>{criteria[i]} <b>{score ?? '—'}</b></span><div className="track"><div style={{ width: (score ?? 0) + '%' }} /></div></div>)}</div>
              <table className="econ"><tbody>
                <tr><th>Receita</th><td>{money(item.revenueHa)}/ha</td></tr><tr><th>Custo</th><td>{money(item.costHa)}/ha</td></tr>
                <tr><th>Lucro</th><td className={item.profitHa >= 0 ? 'pos' : 'neg'}>{money(item.profitHa)}/ha</td></tr>
                {item.nSaving > 0 && <tr><th>Adubo poupado depois</th><td className="pos">+{money(item.nSaving)}/ha</td></tr>}
                {item.waterSaved > 0 && <tr><th>Água a menos que {crops[farm.crop].name.toLowerCase()}</th><td>{item.waterSaved} mm</td></tr>}
              </tbody></table>
              <p className="water-note">Chuva no ciclo {format(item.windowRain, 0)} mm de {item.waterNeed} mm necessários</p>
              <details open={index === 0}><summary>Por que e cuidados</summary><ul className="good">{item.reasons.map((r) => <li key={r}>{r}</li>)}</ul><ul>{item.risks.map((r) => <li key={r}>{r}</li>)}</ul></details>
            </article>)}</div>
            <details className="panel method"><summary>Ajustar produtividade, preço e custo (valores da sua região)</summary>
              <table className="prices"><thead><tr><th>Cultura</th><th>Produtividade (/ha)</th><th>Preço (R$)</th><th>Custo (R$/ha)</th></tr></thead><tbody>{[farm.crop, ...strategies.map((s) => s.id)].map((key) => { const e = economics(farm, key); return <tr key={key}><th>{crops[key].name}</th>
                <td><input type="number" min="0" value={e.yieldHa} onChange={(ev) => setPrice(key, 'yield', ev.target.value)} /> {e.unit}</td><td><input type="number" min="0" value={e.price} onChange={(ev) => setPrice(key, 'price', ev.target.value)} /></td><td><input type="number" min="0" value={e.cost} onChange={(ev) => setPrice(key, 'cost', ev.target.value)} /></td></tr> })}</tbody></table>
              <button className="button secondary" onClick={() => update('prices', {})}>Voltar aos valores de referência</button></details>
            <details className="panel method"><summary>Como as notas são calculadas?</summary><p>{methodology}</p><p>Pesos (água / solo / clima / lucro): {weights[farm.priority].map((w) => Math.round(w * 100) + '%').join(' / ')}.</p><p>{limits}</p><div className="links"><a href={powerDocs}>NASA POWER</a><a href={ndviProduct}>MODIS</a><a href={fao}>FAO</a><a href={embrapa}>Embrapa</a></div></details>
          </>}
        </section>}

        {step === 4 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><TrendingUp size={16} /> Passo 5</p><h2>Planejamento para os próximos 3 anos</h2><p>Comparação entre continuar só com {crops[farm.crop].name.toLowerCase()} (e deixar o solo parado na 2ª safra) e adotar a rotação proposta.</p></div>
            <div className="seg" role="group" aria-label="Cenário climático">{(['neutral', 'elnino', 'lanina'] as Phase[]).map((key) => <button key={key} className={scenario === key ? 'picked' : ''} onClick={() => setScenario(key)}>{key === 'neutral' ? 'Ano normal' : phaseNames[key]}</button>)}</div></div>
          {!climate || !plan.seasons.length ? <div className="panel empty"><p>Complete os passos anteriores para ver o plano.</p></div> : <>
            <div className="summary-cards">
              <article className="panel metric"><span className="metric-icon green"><Coins size={19} /></span><p>Diferença de lucro em 3 anos</p><div><strong className={gain >= 0 ? 'pos' : 'neg'}>{gain >= 0 ? '+' : ''}{money(gain)}</strong></div><span>{area || 1} ha · cenário {scenario === 'neutral' ? 'normal' : phaseNames[scenario]}</span></article>
              <article className="panel metric"><span className="metric-icon green"><Sprout size={19} /></span><p>Saúde do solo no fim</p><div><strong>{last.soil}</strong> <small>vs {last.baselineSoil} sem rotação</small></div><span>Índice 0–100 (início = 50)</span></article>
              <article className="panel metric"><span className="metric-icon amber"><Waves size={19} /></span><p>{scenario === 'neutral' ? 'Clima' : phaseNames[scenario] + ' na região'}</p><div><strong>{scenario === 'neutral' ? 'Normal' : Math.round(((scenario === 'elnino' ? impact.elnino : impact.lanina) - 1) * 100) + '%'}</strong> <small>{scenario !== 'neutral' && 'na produção'}</small></div><span>{scenario === 'elnino' ? impact.elninoText : scenario === 'lanina' ? impact.laninaText : 'Sem El Niño ou La Niña.'}</span></article>
            </div>
            <div className="territory">
              <div className="panel chart-card"><div className="panel-head"><div><h3>Lucro acumulado (R$)</h3><p>Rotação nos três cenários × sem rotação</p></div></div>
                <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={plan.seasons.map((s) => ({ label: s.label.replace(' safra', ''), Normal: Math.round(s.profit.neutral), 'El Niño': Math.round(s.profit.elnino), 'La Niña': Math.round(s.profit.lanina), 'Sem rotação': Math.round(s.baseline) }))}>
                  <CartesianGrid vertical={false} stroke="#e7eee9" strokeDasharray="4 4" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis width={70} tick={{ fontSize: 10 }} tickFormatter={(v) => (v / 1000).toLocaleString('pt-BR') + ' mil'} />
                  <Tooltip formatter={(v) => money(Number(v))} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="Normal" stroke="#13844f" strokeWidth={scenario === 'neutral' ? 3 : 1.5} /><Line dataKey="El Niño" stroke="#c0612b" strokeWidth={scenario === 'elnino' ? 3 : 1.5} /><Line dataKey="La Niña" stroke="#2c6fb3" strokeWidth={scenario === 'lanina' ? 3 : 1.5} /><Line dataKey="Sem rotação" stroke="#888" strokeDasharray="5 4" />
                </LineChart></ResponsiveContainer></div></div>
              <div className="panel chart-card"><div className="panel-head"><div><h3>Saúde do solo</h3><p>Índice estimado a cada safra</p></div></div>
                <div className="chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={plan.seasons.map((s) => ({ label: s.label.replace(' safra', ''), 'Com rotação': s.soil, 'Sem rotação': s.baselineSoil }))}>
                  <CartesianGrid vertical={false} stroke="#e7eee9" strokeDasharray="4 4" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis width={30} domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Com rotação" fill="#8acdb0" radius={[4, 4, 0, 0]} /><Line dataKey="Sem rotação" stroke="#888" strokeDasharray="5 4" />
                </ComposedChart></ResponsiveContainer></div></div>
            </div>
            <h3 className="sub">Calendário sugerido</h3>
            <ol className="timeline">{plan.seasons.map((s) => <li key={s.label} className="panel"><small>{s.label}</small><strong>{s.crop}</strong></li>)}</ol>
            <div className="panel pad story"><h3>Resumo do plano</h3>
              <p>Mantendo {crops[farm.crop].name.toLowerCase()} na safra principal e usando a 2ª safra para {[plan.cash?.name, plan.cover?.name].filter(Boolean).join(' e ').toLowerCase()}, o talhão {gain >= 0 ? 'ganha cerca de ' + money(gain) : 'tem cerca de ' + money(-gain) + ' a menos de lucro'} em 3 anos frente ao pousio{scenario !== 'neutral' ? ', considerando anos de ' + phaseNames[scenario] : ''}, e a saúde do solo vai de 50 para {last.soil} (sem rotação: {last.baselineSoil}).</p>
              {plan.cover && <p>A cobertura com {plan.cover.name.toLowerCase()} não gera venda, mas protege o solo{plan.cover.nSaving ? ' e deixa nitrogênio para a próxima safra' : ''}.</p>}
              <p>{impact.region}: em El Niño, {impact.elninoText.toLowerCase()} Em La Niña, {impact.laninaText.toLowerCase()} Consulte a <a href={ensoOutlook} target="_blank" rel="noreferrer">previsão da NOAA</a> antes de cada safra.</p>
              <p className="hint">{limits}</p></div>
          </>}
        </section>}

        <div className="step-nav">
          <button className="button secondary" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Voltar</button>
          {step < steps.length - 1 ? <button className="button primary-solid" onClick={() => setStep(step + 1)}>Próximo: {steps[step + 1].title} <ArrowRight size={17} /></button>
            : <button className="button primary-solid" disabled={!climate} onClick={download}><FileDown size={17} /> Baixar relatório</button>}
        </div>

        <section id="desafio" className="section">
          <div className="section-head"><div><p className="eyebrow"><Satellite size={16} /> NASA Space Apps Challenge 2026</p><h2>Como o EarthVision responde ao desafio</h2><p>Identificar o problema do agricultor, usar dados da NASA e propor uma solução de plantio.</p></div><a className="tag" href={challenge} target="_blank" rel="noreferrer">Ver desafio</a></div>
          <ol className="steps">{challengeSteps.map((s, i) => <li className="panel" key={s.title}><span className="step-number">{i + 1}</span><div><h3>{s.title}</h3><p>{s.how}</p><small>{s.data}</small></div></li>)}</ol>
          <h3 className="sources-title">Dados usados</h3>
          <div className="nasa-sources">{nasaSources.map((s) => <a className="panel" key={s.name} href={s.url} target="_blank" rel="noreferrer"><strong>{s.name}</strong><span>{s.use}</span><small>{s.variables}</small></a>)}</div>
        </section>
      </div>
    </main>
    <footer><div className="shell"><strong><Globe2 size={19} /> EarthVision</strong><span>NASA POWER · MERRA-2 · MODIS · NOAA ONI · Open-Meteo · OpenStreetMap</span></div></footer>
  </>
}
createRoot(document.getElementById('root')!).render(<App />)
