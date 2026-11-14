import { LanguagePicker } from '../LanguagePicker'
import { useRef, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTooltip, useMap, useMapEvents } from 'react-leaflet'
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Pause, Play, AlertTriangle, ArrowLeft, BookOpen, Mountain, Snowflake, ArrowRight, Check, CloudRain, Coins, Droplets, FileDown, Flame, Globe2, Leaf, LocateFixed, MapPin, Satellite, Search, Sprout, Sun, Thermometer, TrendingUp, Waves } from 'lucide-react'
import '@fontsource-variable/inter'
import 'leaflet/dist/leaflet.css'
import '../style.css'
import { applyScenario, challenge, fetchClimate, fahrenheit, fahrenheitDelta, format, locations, monthNames, periodOf, powerDocs, years, type Climate, type Location } from './power'
import { fetchNdvi, ndviProduct, type Ndvi } from './ndvi'
import { locateMe, searchPlaces, type Place } from './geo'
import { ensoDocs, ensoImpact, ensoOutlook, phaseNames, yearPhase, type Phase } from './enso'
import { challengeSteps, dataSources, glossary } from './challenge'
import { fetchTerrain, srtmDocs, type Terrain } from './terrain'
import { alternativesOf, marketGroups, compare, criteria, vulnerabilityCalendar, cropList, crops, defaultFarm, economics, embrapa, fao, limits, longTermPlan, methodology, priorities, regionProblems, seasonOf, soils, weights, type Crop, type Farm, type Scenario } from './rotation'

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
const validFarm = (v: Farm) => Object.hasOwn(crops, v.crop) && Object.hasOwn(soils, v.soil) && Object.hasOwn(priorities, v.priority) && typeof v.name === 'string' && typeof v.area === 'string' && typeof v.irrigated === 'boolean' && Number.isInteger(v.month) && v.month >= 0 && v.month < 12 && typeof v.prices === 'object' && Array.isArray(v.markets) && v.markets.every((m) => typeof m === 'string') && typeof v.cattle === 'boolean' && typeof v.smallSeedPlanter === 'boolean'
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
    <form onSubmit={submit}><Search size={17} /><input aria-label="Cidade" placeholder="Digite a cidade (ex.: Brasília, Lisboa ou Tóquio)" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="button primary-solid">Buscar</button></form>
    <button type="button" className="button secondary" onClick={gps}><LocateFixed size={16} /> Usar minha localização</button>
    {status && <small role="status">{status}</small>}
    {results && results.length > 0 && <ul className="results-list">{results.map((place) => <li key={place.lat + ',' + place.lon}><button type="button" onClick={() => { select(place); setResults(null); setQuery('') }}><MapPin size={14} /> {place.name}</button></li>)}</ul>}
  </div>
}

function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPlayback = () => {
      if (preference.matches) video.current?.pause()
      else void video.current?.play().catch(() => {})
    }
    syncPlayback()
    preference.addEventListener('change', syncPlayback)
    return () => preference.removeEventListener('change', syncPlayback)
  }, [])
  function togglePlayback() {
    const player = video.current
    if (!player) return
    if (player.paused) void player.play().catch(() => {})
    else player.pause()
  }
  return <>
    <div className="hero-media" aria-hidden="true">
      <video ref={video} muted loop playsInline preload="metadata"
        src={import.meta.env.BASE_URL + 'earth-orbit.mp4'}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => setFailed(true)} />
    </div>
    {!failed && <button className="hero-playback" type="button" onClick={togglePlayback}
      aria-label={playing ? 'Pausar animação da Terra' : 'Reproduzir animação da Terra'}>
      {playing ? <Pause size={17} /> : <Play size={17} />}
    </button>}
  </>
}

function Dictionary() {
  const groups = [...new Set(glossary.map((g) => g.group))]
  const [selected, setSelected] = useState(glossary[0].term)
  const term = glossary.find((g) => g.term === selected) ?? glossary[0]
  return <div className="dictionary panel">
    <div className="dict-terms">{groups.map((group) => <div key={group}><small>{group}</small><div className="chips">{glossary.filter((g) => g.group === group).map((g) =>
      <button key={g.term} className={'chip ' + (g.term === selected ? 'picked' : '')} aria-pressed={g.term === selected} onClick={() => setSelected(g.term)}>{g.term}</button>)}</div></div>)}</div>
    <div className="dict-answer" aria-live="polite"><span className="tag">{term.group}</span><h3>{term.term}</h3><p>{term.text}</p>{term.example && <p className="example"><b>Exemplo:</b> {term.example}</p>}</div>
  </div>
}

function DataSources() {
  return <div className="source-grid">
    {dataSources.map((source) => <article key={source.id} className="panel source-box">
      <h3>{source.name}</h3>
      <p>{source.what}</p>
      <a href={source.url} target="_blank" rel="noreferrer" aria-label={'Abrir site oficial de ' + source.name}>Site oficial ↗</a>
    </article>)}
  </div>
}

function App() {
  const [step, setStep] = useState(0)
  const [location, setLocation] = useState(() => readSaved<Location>('earthvision-location', locations[0], (v) => Number.isFinite(v.lat) && Number.isFinite(v.lon) && typeof v.name === 'string'))
  const [year, setYear] = useState(2025)
  const [farm, setFarm] = useState(() => readSaved<Farm>('earthvision-farm-v3', defaultFarm, validFarm))
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState<{ key: string; climate?: Climate; error?: string } | null>(null)
  const [ndviState, setNdviState] = useState<{ key: string; ndvi?: Ndvi } | null>(null)
  const [scenario, setScenario] = useState<Scenario>('neutral')
  const [showAllProblems, setShowAllProblems] = useState(false)
  const [terrainState, setTerrainState] = useState<{ key: string; terrain?: Terrain } | null>(null)
  const [rainPct, setRainPct] = useState(0)
  const [tempDelta, setTempDelta] = useState(0)
  const [reportStatus, setReportStatus] = useState('')
  const requestKey = [location.lat, location.lon, year, retry].join(',')
  const active = request?.key === requestKey ? request : null
  const baseClimate = active?.climate ?? null
  const climate = baseClimate ? applyScenario(baseClimate, rainPct, tempDelta) : null
  const terrainKey = location.lat + ',' + location.lon
  const terrain = terrainState?.key === terrainKey ? terrainState.terrain ?? null : null
  const terrainDone = terrainState?.key === terrainKey
  const ndvi = ndviState?.key === requestKey ? ndviState.ndvi ?? null : null
  const ndviDone = ndviState?.key === requestKey
  const impact = useMemo(() => ensoImpact(location), [location])
  const strategies = compare(farm, climate, ndvi, 3, terrain)
  const options = alternativesOf(strategies)
  const currentStrategy = strategies[0]
  const calendar = vulnerabilityCalendar(baseClimate, ndvi)
  const problems = regionProblems(baseClimate, ndvi, impact, farm.soil, terrain)
  const plan = longTermPlan(farm, strategies, climate, impact)
  const season = seasonOf(farm.month)
  const area = Math.max(0, Number(farm.area) || 0)
  const chartData = baseClimate?.months.map((m, i) => ({ ...m, temperature: fahrenheit(m.temperature), ndvi: ndvi?.months[i].ndvi ?? null }))

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
  useEffect(() => { save('earthvision-farm-v3', farm) }, [farm])
  useEffect(() => {
    const controller = new AbortController()
    fetchTerrain(location, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setTerrainState({ key: terrainKey, terrain: data }) })
      .catch(() => { if (!controller.signal.aborted) setTerrainState({ key: terrainKey }) })
    return () => controller.abort()
  }, [location, terrainKey])
  useEffect(() => { document.getElementById('fluxo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [step])
  function update<K extends keyof Farm>(key: K, value: Farm[K]) { setFarm((previous) => ({ ...previous, [key]: value })) }
  function setPrice(crop: Crop, field: 'yield' | 'price' | 'cost', value: string) {
    const number = Number(value)
    setFarm((previous) => ({ ...previous, prices: { ...previous.prices, [crop]: { ...previous.prices[crop], [field]: value === '' || !Number.isFinite(number) ? undefined : number } } }))
  }
  async function download(preview = false) {
    if (!climate || !baseClimate) return
    setReportStatus('Gerando relatório…')
    const tab = preview ? window.open('', '_blank') : null
    try {
      const { buildReport } = await import('./report')
      const pdf = buildReport({ location, farm, climate, nasa: baseClimate, strategies, ndvi, terrain, problems, plan, impact, scenario: { rainPct, tempDelta } })
      if (preview && tab) { tab.location.href = String(pdf.output('bloburl')); setReportStatus('Relatório aberto em outra aba.') }
      else { pdf.save('EarthVision-relatorio-' + new Date().toISOString().slice(0, 10) + '.pdf'); setReportStatus('Relatório baixado.') }
    } catch { tab?.close(); setReportStatus('Falha ao gerar o relatório. Tente novamente.') }
  }
  const phase = yearPhase[year]
  const cards = [
    { icon: Thermometer, name: 'Temperatura média', value: fahrenheit(baseClimate?.temperature ?? null), unit: '°F', color: 'amber' },
    { icon: CloudRain, name: 'Chuva no ano', value: baseClimate?.rain ?? null, unit: 'mm', color: 'blue', digits: 0 },
    { icon: Sun, name: 'Sol (radiação)', value: baseClimate?.solar ?? null, unit: 'MJ/m²/dia', color: 'amber' },
    { icon: Droplets, name: 'Umidade do solo', value: baseClimate?.soilMoisture == null ? null : baseClimate.soilMoisture * 100, unit: '%', color: 'blue', digits: 0 },
    { icon: Flame, name: 'Dias acima de 95 °F', value: baseClimate?.heatDays ?? null, unit: 'dias', color: 'amber', digits: 0 },
    { icon: Waves, name: 'Evapotranspiração', value: baseClimate?.eto ?? null, unit: 'mm/ano', color: 'blue', digits: 0 },
    { icon: Snowflake, name: 'Dias com risco de geada', value: baseClimate?.frostDays ?? null, unit: 'dias', color: 'blue', digits: 0 },
    { icon: CloudRain, name: 'Dias de chuva extrema', value: baseClimate?.heavyRainDays ?? null, unit: '≥ 50 mm', color: 'blue', digits: 0 },
    { icon: Leaf, name: 'Verde da vegetação (NDVI)', value: ndvi?.mean ?? null, unit: '0–1', color: 'green', digits: 2 },
  ]
  const best = options[0]
  const last = plan.seasons[plan.seasons.length - 1]
  const gain = last ? last.profit[scenario] - last.baseline : 0
  const loading = !climate && !active?.error

  return <>
    <header className="top"><div className="shell top-inner">
      <a href="#inicio" className="brand"><span className="brand-icon"><Globe2 size={23} /></span>EarthVision</a>
      <nav aria-label="Navegação"><a href="#fluxo"><Sprout size={16} /> Planejar</a><a href="#termos"><BookOpen size={15} /> Termos</a><a href="#dados"><Satellite size={15} /> Fontes</a></nav>
      <div className="header-actions"><LanguagePicker language="pt-BR" /><a className="challenge" target="_blank" rel="noreferrer" href={challenge}><Satellite size={15} /> NASA Space Apps 2026</a></div>
    </div></header>
    <main id="inicio">
      <section className="hero"><HeroVideo /><div className="shell hero-inner">
        <div className="hero-copy"><p className="eyebrow"><Satellite size={16} /> Dados de satélite da NASA para o campo</p><h1>Planeje sua<br />próxima <em>safra.</em></h1>
          <p>Em 5 passos: diga onde fica sua fazenda, veja os problemas de clima da região e receba uma proposta de rotação com custo, lucro e plano para 3 anos.</p>
          <button className="button primary" onClick={() => { setStep(0); document.getElementById('fluxo')?.scrollIntoView({ behavior: 'smooth' }) }}>Começar agora <ArrowRight size={18} /></button></div>
      </div></section>

      <div className="shell content" id="fluxo">
        <ol className="stepper" aria-label="Etapas">{steps.map((item, index) => {
          const Icon = item.icon
          return <li key={item.id}><button className={index === step ? 'current' : index < step ? 'done' : ''} onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined}>
            <span className="dot">{index < step ? <Check size={15} /> : <Icon size={15} />}</span><span><small>Passo {index + 1}</small>{item.title}</span></button></li>
        })}</ol>

        <div className="context-bar"><span><MapPin size={14} /> {location.name}</span><span><CloudRain size={14} /> Clima de {year}</span><span><Sprout size={14} /> {crops[farm.crop].name} · {season.name}</span><span>{priorities[farm.priority].icon} {priorities[farm.priority].name}</span>{(rainPct !== 0 || tempDelta !== 0) && <span className="scenario-chip">Cenário: chuva {rainPct > 0 ? '+' : ''}{rainPct}% · +{format(fahrenheitDelta(tempDelta))} °F</span>}</div>

        {step === 0 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><MapPin size={16} /> Passo 1</p><h2>Onde fica sua fazenda?</h2><p>Busque a cidade em qualquer país, use o GPS do celular ou toque no mapa.</p></div></div>
          <div className="territory">
            <div className="panel pad"><CitySearch select={setLocation} />
              <p className="hint">Capitais do mundo</p>
              <div className="chips">{locations.map((item) => <button key={item.name} className={'chip ' + (item.lat === location.lat && item.lon === location.lon ? 'picked' : '')} onClick={() => setLocation(item)}>{item.name}</button>)}</div>
              <div className="selected"><MapPin size={18} /><div><strong>{(locations.find((item) => item.lat === location.lat && item.lon === location.lon) ?? location).name}</strong><small>Os dados da NASA cobrem uma área de cerca de 50 km ao redor deste ponto.</small></div></div>
              <div className="selected"><Mountain size={18} /><div><strong>{terrain ? 'Altitude ' + terrain.elevation + ' m · declividade ' + format(terrain.slope) + '%' : terrainDone ? 'Relevo indisponível' : 'Consultando relevo (SRTM)…'}</strong><small>{terrain ? 'Risco de erosão ' + terrain.erosion + ' pelo relevo (NASA SRTM, 30 m).' : 'O SRTM cobre de 60° N a 56° S.'} <a href={srtmDocs} target="_blank" rel="noreferrer">SRTM</a></small></div></div>
            </div>
            <div className="panel map-card"><MapContainer center={[location.lat, location.lon]} zoom={5} minZoom={2} maxZoom={16} worldCopyJump scrollWheelZoom className="map tall">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapSelection location={location} select={setLocation} /></MapContainer></div>
          </div>
        </section>}

        {step === 1 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><CloudRain size={16} /> Passo 2</p><h2>Como é o clima e quais são os problemas da região</h2><p>Dados de satélite e modelos da NASA para {location.name}.</p></div>
            <label className="year-pick">Ano de referência<select value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y} · {phaseNames[yearPhase[y].phase]}</option>)}</select></label></div>
          <details className={'enso panel ' + phase.phase}><summary><Waves size={20} /><span><strong>{year}: {phaseNames[phase.phase]}</strong> · {phase.text}</span><em>O que isso muda?</em></summary>
            <div className="enso-effects"><div><b>Em anos de El Niño</b><span>{impact.elninoText}</span></div><div><b>Em anos de La Niña</b><span>{impact.laninaText}</span></div><small>{impact.region} · <a href={ensoDocs} target="_blank" rel="noreferrer">índice ONI (NOAA)</a> · <a href={ensoOutlook} target="_blank" rel="noreferrer">previsão atual</a></small></div></details>
          {loading ? <div className="panel empty"><Satellite size={25} /><p>Consultando a NASA…</p></div> : !baseClimate ? <div className="panel empty"><Satellite size={25} /><p>{active?.error}</p><button className="button secondary" onClick={() => setRetry(retry + 1)}>Tentar novamente</button></div> : <>
            <h3 className="sub">Problemas da região</h3>
            {problems.length ? <div className="problems">{problems.slice(0, showAllProblems ? undefined : 3).map((p) => <article key={p.title} className={'panel problem ' + p.level}><AlertTriangle size={18} /><div><strong>{p.title}</strong><p>{p.text}</p><small className="src">Fonte: {p.source}</small></div></article>)}</div> : <p className="hint">Nenhum problema climático forte foi detectado neste ano.</p>}
            {problems.length > 3 && <button className="link-button" onClick={() => setShowAllProblems(!showAllProblems)}>{showAllProblems ? 'Mostrar menos' : 'Ver mais ' + (problems.length - 3) + ' problemas'}</button>}
            <h3 className="sub">Calendário do talhão: quando a lavoura fica vulnerável</h3>
            <div className="calendar panel">{calendar.map((m) => <div key={m.name} className={'cal-month ' + (m.flags.length ? 'flagged' : '')}><b>{m.name}</b>{m.flags.length ? m.flags.map((f) => <span key={f} className={'flag ' + f}>{f}</span>) : <span className="flag ok">ok</span>}<small>{m.balance === null ? '' : (m.balance >= 0 ? '+' : '') + Math.round(m.balance) + ' mm'}</small></div>)}</div>
            <p className="hint">Número embaixo de cada mês: sobra (+) ou falta (−) de água.</p>
            <div className="metrics">{cards.slice(0, 4).map(({ icon: Icon, name, value, unit, color, digits }) => <article className="panel metric" key={name}><span className={'metric-icon ' + color}><Icon size={19} /></span><p>{name}</p><div><strong>{format(value, digits)}</strong> <small>{value !== null ? unit : (name.includes('NDVI') && !ndviDone ? 'carregando…' : 'indisponível')}</small></div></article>)}</div>
            <details className="more"><summary>Ver mais números</summary><div className="metrics">{cards.slice(4).map(({ icon: Icon, name, value, unit, color, digits }) => <article className="panel metric" key={name}><span className={'metric-icon ' + color}><Icon size={19} /></span><p>{name}</p><div><strong>{format(value, digits)}</strong> <small>{value !== null ? unit : (name.includes('NDVI') && !ndviDone ? 'carregando…' : 'indisponível')}</small></div></article>)}</div></details>
            <div className="panel chart-card"><div className="panel-head"><div><h3>Clima ao longo de {year}</h3><p>Barras: chuva (mm). Linha marrom: temperatura (°F). Tracejado verde: vegetação (NDVI).</p></div></div>
              <div className="chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}>
                <CartesianGrid vertical={false} stroke="#e7eee9" strokeDasharray="4 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="rain" width={38} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis yAxisId="temp" orientation="right" width={30} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} /><YAxis yAxisId="ndvi" hide domain={[0, 1]} />
                <Tooltip formatter={(value, name) => [format(Number(value), name === 'NDVI' ? 2 : 1), name]} />
                <Bar yAxisId="rain" name="Chuva (mm)" dataKey="rain" fill="#8acdb0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Area yAxisId="temp" name="Temperatura (°F)" type="monotone" dataKey="temperature" stroke="#a86429" fill="none" strokeWidth={2} dot />
                <Line yAxisId="ndvi" name="NDVI" type="monotone" dataKey="ndvi" stroke="#13844f" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
              </ComposedChart></ResponsiveContainer></div></div>
            <p className="source">{baseClimate.origin === 'live' ? 'NASA POWER on-line' : 'Cópia local da NASA POWER (Sorriso, 2025)'} · {periodOf(year)} · <a href={baseClimate.url} target="_blank" rel="noreferrer">dados originais</a>{ndvi && <> · NDVI MODIS ({ndvi.composites} imagens)</>}</p>
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
              <div className="crop-cards soil-cards">{Object.entries(soils).map(([key, soil]) => <button key={key} className={'crop-card ' + (key === farm.soil ? 'picked' : '')} onClick={() => update('soil', key as Farm['soil'])}><strong>{soil.name}</strong></button>)}</div>
              <p className="hint">{soils[farm.soil].text}</p>
              <label className="area-field">Área do talhão (ha)<input type="number" min="0" step="any" value={farm.area} onChange={(e) => update('area', e.target.value)} /></label>
              <h3>O que você consegue vender na região?</h3>
              {marketGroups.map((g) => <div key={g.group} className="market-group"><small>{g.group}</small><div className="chips">{g.items.map((c) => {
                const on = farm.markets.includes(c.id)
                return <button key={c.id} className={'chip ' + (on ? 'picked' : '')} aria-pressed={on} onClick={() => update('markets', on ? farm.markets.filter((x) => x !== c.id) : [...farm.markets, c.id])}>{on ? '✓ ' : ''}{c.name}</button>
              })}</div></div>)}
              <p className="hint">Só os grãos e fibras marcados entram nas propostas. Plantas de cobertura sempre aparecem, porque não dependem de venda.</p>
              <h3>Sua estrutura</h3>
              <div className="toggles">{([
                ['irrigated', '💧', 'Irrigação', 'Tenho irrigação neste talhão'],
                ['smallSeedPlanter', '🚜', 'Plantadeira de sementes miúdas', 'Para milheto, braquiária, crotalária, aveia e nabo'],
                ['cattle', '🐄', 'Gado', 'A forragem tem valor para mim'],
              ] as const).map(([key, icon, title, text]) => <button key={key} className={'toggle-card ' + (farm[key] ? 'picked' : '')} aria-pressed={farm[key]} onClick={() => update(key, !farm[key])}>
                <span className="toggle-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><span className="switch" aria-hidden="true"><i /></span></button>)}</div>
              <h3>O que é mais importante para você?</h3>
              <div className="priority-cards">{Object.entries(priorities).map(([key, p]) => <button key={key} className={'priority-card ' + (key === farm.priority ? 'picked' : '')} onClick={() => update('priority', key as Farm['priority'])}><span>{p.icon}</span><strong>{p.name}</strong><small>{p.text}</small></button>)}</div>
            </div>
          </div>
        </section>}

        {step === 3 && <section className="section step-panel">
          <div className="section-head"><div><p className="eyebrow"><Leaf size={16} /> Passo 4</p><h2>Proposta de plantio</h2><p>Depois de {crops[farm.crop].name.toLowerCase()}, plantando em {monthNames[farm.month].toLowerCase()} ({season.name.toLowerCase()}), com foco em {priorities[farm.priority].name.toLowerCase()}.</p></div>
            <button className="button secondary" disabled={!climate} onClick={() => download()}><FileDown size={18} /> Baixar relatório PDF</button></div>
          <p className="report-status" role="status">{reportStatus}</p>
          <div className="panel whatif"><div><strong>E se o clima mudar?</strong><p>Mexa nos controles para testar um ano mais seco, mais chuvoso ou mais quente. Todas as notas e o plano são recalculados.</p></div>
            <label>Chuva {rainPct > 0 ? '+' : ''}{rainPct}%<input type="range" min={-50} max={30} step={5} value={rainPct} onChange={(e) => setRainPct(Number(e.target.value))} /></label>
            <label>Temperatura +{format(fahrenheitDelta(tempDelta))} °F<input type="range" min={0} max={7.2} step={0.9} value={fahrenheitDelta(tempDelta)} onChange={(e) => setTempDelta(Number(e.target.value) * 5 / 9)} /></label>
            {(rainPct !== 0 || tempDelta !== 0) && <button className="button secondary" onClick={() => { setRainPct(0); setTempDelta(0) }}>Voltar ao clima real</button>}</div>
          {!climate ? <div className="panel empty"><p>Precisamos dos dados de clima do passo 2.</p></div> : !best ? <div className="panel empty"><p>Nenhuma cultura possível em {monthNames[farm.month]} com as restrições informadas. Escolha outro mês ou libere mais culturas no passo 3.</p></div> : <>
            <div className="panel verdict"><span className="big-score">{best.total ?? '—'}<small>/100</small></span><div><p className="eyebrow">Nossa recomendação</p><h3>{best.sequence}</h3><p>{best.description}</p>
              <p className="compare-line">Rotação atual ({currentStrategy.sequence}): nota {currentStrategy.total ?? '—'}. {best.total !== null && currentStrategy.total !== null && (best.total > currentStrategy.total ? 'A proposta é ' + (best.total - currentStrategy.total) + ' pontos melhor.' : 'A rotação atual já está bem posicionada.')}</p>
              <p className="money-line"><Coins size={16} /> {best.profitHa > 0 ? 'Lucro estimado ' + money(best.profitHa) + '/ha' : 'Custo ' + money(best.costHa) + '/ha'}{area > 0 && <> · {money((best.profitHa + best.nSaving) * area)} em {area} ha (com economia de adubo)</>}</p></div></div>
            <div className="strategies">{strategies.map((item, index) => <article className={'panel strategy ' + (item.id === best.id && !item.isCurrent ? 'best' : '') + (item.isCurrent ? ' current' : '')} key={item.id}>
              <div className="strategy-top"><span className={'tag ' + (item.isCurrent ? 'current-tag' : '')}>{item.isCurrent ? 'Rotação atual (referência)' : index + 'ª opção · ' + item.kind}</span><div className="score">{item.total ?? '—'}<small>/100</small></div></div>
              <h3>{item.name}</h3><strong className="sequence">{item.sequence} · ciclo {item.months}</strong><p className="why">{item.why}</p>
              <p className={'profit-line ' + (item.profitHa >= 0 ? 'pos' : 'neg')}>{item.profitHa >= 0 ? 'Lucro' : 'Custo'} {money(Math.abs(item.profitHa))}/ha{item.nSaving > 0 && <span> · +{money(item.nSaving)}/ha em adubo</span>}</p>
              <details className="more-details"><summary>Ver detalhes</summary>
              <div className="bars">{item.scores.map((score, i) => <div key={criteria[i]}><span>{criteria[i]} <b>{score ?? '—'}</b></span><div className="track"><div style={{ width: (score ?? 0) + '%' }} /></div></div>)}</div>
              <table className="econ"><tbody>
                <tr><th>Receita</th><td>{money(item.revenueHa)}/ha</td></tr><tr><th>Custo</th><td>{money(item.costHa)}/ha</td></tr>
                <tr><th>Lucro</th><td className={item.profitHa >= 0 ? 'pos' : 'neg'}>{money(item.profitHa)}/ha</td></tr>
                {item.nSaving > 0 && <tr><th>Adubo poupado depois</th><td className="pos">+{money(item.nSaving)}/ha</td></tr>}
                {item.waterSaved > 0 && <tr><th>Água a menos que {crops[farm.crop].name.toLowerCase()}</th><td>{item.waterSaved} mm</td></tr>}
              </tbody></table>
              <p className="water-note">{item.id === 'fallow' ? 'Sem cultura: o solo fica exposto à chuva de ' + format(item.windowRain, 0) + ' mm' : 'Chuva no ciclo ' + format(item.windowRain, 0) + ' mm de ' + item.waterNeed + ' mm necessários'}</p>
              <details open><summary>Benefícios</summary><ul className="good">{item.reasons.map((r) => <li key={r}>{r}</li>)}</ul></details>
              <details><summary>Evidências (dados)</summary><ul className="evidence">{item.evidence.map((r) => <li key={r}>{r}</li>)}</ul></details>
              <details open><summary>Riscos para revisar com o agrônomo</summary><ul>{item.risks.map((r) => <li key={r}>{r}</li>)}</ul></details>
              <details><summary>Lacunas de informação</summary><ul className="gaps">{item.gaps.map((r) => <li key={r}>{r}</li>)}</ul></details>
              </details>
            </article>)}</div>
            <details className="panel method"><summary>Ajustar produtividade, preço e custo (valores da sua região)</summary>
              <table className="prices"><thead><tr><th>Cultura</th><th>Produtividade (/ha)</th><th>Preço (R$)</th><th>Custo (R$/ha)</th></tr></thead><tbody>{[farm.crop, ...options.map((s) => s.id as Crop)].map((key) => { const e = economics(farm, key); return <tr key={key}><th>{crops[key].name}</th>
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
            <h3 className="sub">Safra a safra</h3>
            <ol className="season-plan">{plan.seasons.map((s, i) => <li key={s.label} className={'panel ' + (s.kind === 'cobertura' ? 'cover' : '')}>
              <div className="season-head"><span className="season-num">{i + 1}</span><div><small>{s.label}</small><strong>{s.crop}</strong></div><span className="season-months">{s.months}</span></div>
              <p>{s.action}</p>
              <div className="season-facts"><span className={s.profitHa >= 0 ? 'pos' : 'neg'}>{s.profitHa >= 0 ? 'Lucro' : 'Custo'} {money(Math.abs(s.profitHa))}/ha</span><span>Solo {s.soil} ({s.soilChange >= 0 ? '+' : ''}{s.soilChange})</span></div>
              <small className="season-benefit">{s.benefit}</small>
            </li>)}</ol>
            <div className="plan-extra">
              <div className="panel pad"><h3>Metas do plano</h3><ul className="goals">
                {(() => { const n = plan.seasons.filter((s) => s.kind === 'cobertura').length; return <li><b>{n}</b> {n === 1 ? 'safra' : 'safras'} com o solo coberto por planta de cobertura</li> })()}
                <li><b>{money(alternativesOf(strategies).filter((o) => plan.seasons.some((s) => s.crop === o.name)).reduce((t, o) => t + o.nSaving, 0) * (area || 1))}</b> em adubo poupado no período</li>
                <li><b>{money(gain / 3)}</b> por ano a mais que deixar o solo parado</li>
                <li>Saúde do solo de <b>50</b> para <b>{last.soil}</b> pontos</li></ul></div>
              <div className="panel pad"><h3>Pontos de atenção</h3><ul className="watch">
                {[...new Set(alternativesOf(strategies).filter((o) => plan.seasons.some((s) => s.crop === o.name)).flatMap((o) => o.risks.slice(0, 2).map((r) => o.name + ': ' + r)))].slice(0, 5).map((r) => <li key={r}>{r}</li>)}
                <li>Antes de cada safra, consulte a <a href={ensoOutlook} target="_blank" rel="noreferrer">previsão de El Niño / La Niña</a>.</li></ul></div>
            </div>
            <div className="panel pad story"><h3>Resumo do plano</h3>
              <p>Mantendo {crops[farm.crop].name.toLowerCase()} na safra principal e usando a 2ª safra para {[plan.cash?.name, plan.cover?.name].filter(Boolean).join(' e ').toLowerCase()}, o talhão {gain >= 0 ? 'ganha cerca de ' + money(gain) : 'tem cerca de ' + money(-gain) + ' a menos de lucro'} em 3 anos frente ao pousio{scenario !== 'neutral' ? ', considerando anos de ' + phaseNames[scenario] : ''}, e a saúde do solo vai de 50 para {last.soil} (sem rotação: {last.baselineSoil}).</p>
              {plan.cover && <p>A cobertura com {plan.cover.name.toLowerCase()} não gera venda, mas protege o solo{plan.cover.nSaving ? ' e deixa nitrogênio para a próxima safra' : ''}.</p>}
              <p>{impact.region}: em El Niño, {impact.elninoText.toLowerCase()} Em La Niña, {impact.laninaText.toLowerCase()} Consulte a <a href={ensoOutlook} target="_blank" rel="noreferrer">previsão da NOAA</a> antes de cada safra.</p>
              <p className="hint">{limits}</p></div>
            <div className="panel report-card"><div className="report-cover"><span>PDF</span><b>Relatório da sua fazenda</b><small>{location.name}</small></div>
              <div className="report-body"><h3>Seu relatório está pronto</h3><p>Montado com as suas respostas, em linguagem simples, para ler e levar ao agrônomo.</p>
                <ul className="report-list"><li><Check size={14} /> Resumo para você e suas respostas</li><li><Check size={14} /> Gráfico do clima e calendário de meses vulneráveis</li><li><Check size={14} /> Problemas da região e El Niño / La Niña</li><li><Check size={14} /> Comparação das estratégias com notas, custos e lucros</li><li><Check size={14} /> Gráficos de lucro e saúde do solo em 3 anos</li><li><Check size={14} /> Lista "o que fazer agora"</li><li><Check size={14} /> Tabela com os dados oficiais da NASA e links das fontes</li></ul>
                <div className="report-actions"><button className="button primary-solid" onClick={() => download()}><FileDown size={17} /> Baixar PDF</button><button className="button secondary" onClick={() => download(true)}>Visualizar</button><span role="status">{reportStatus}</span></div></div></div>
          </>}
        </section>}

        <div className="step-nav">
          <button className="button secondary" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Voltar</button>
          {step < steps.length - 1 ? <button className="button primary-solid" onClick={() => setStep(step + 1)}>Próximo: {steps[step + 1].title} <ArrowRight size={17} /></button>
            : <button className="button primary-solid" disabled={!climate} onClick={() => download()}><FileDown size={17} /> Baixar relatório</button>}
        </div>

        <section id="termos" className="section">
          <div className="section-head"><div><p className="eyebrow"><BookOpen size={16} /> Dicionário do campo</p><h2>Não entendeu algum termo?</h2><p>Toque em uma palavra para ver a explicação.</p></div></div>
          <Dictionary />
        </section>
        <section id="dados" className="section">
          <div className="section-head"><div><p className="eyebrow"><Satellite size={16} /> Base de dados</p><h2>De onde vêm as informações</h2><p>As fontes que o EarthVision usa e o que tiramos de cada uma.</p></div></div>
          <DataSources />
          <details className="panel method about"><summary>Sobre o projeto (NASA Space Apps Challenge 2026)</summary>
            <p className="hint">O EarthVision foi criado para o desafio <a href={challenge} target="_blank" rel="noreferrer">Field Shift: Adapting Farms with NASA Data</a>. Veja como cada pedido do desafio foi atendido:</p>
            <ol className="about-list">{challengeSteps.map((c) => <li key={c.title}><b>{c.title}.</b> {c.how}</li>)}</ol></details>
        </section>
      </div>
    </main>
    <footer><div className="shell"><strong><Globe2 size={19} /> EarthVision</strong><span>Ferramenta de apoio: não substitui o agrônomo · Dados NASA POWER, MERRA-2, MODIS e SRTM</span></div></footer>
  </>
}
createRoot(document.getElementById('root')!).render(<App />)
