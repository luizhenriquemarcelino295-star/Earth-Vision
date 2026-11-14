import { useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTooltip, useMap, useMapEvents } from 'react-leaflet'
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDown, ArrowRight, BarChart3, CloudRain, Droplets, FileDown, Globe2, Info, Layers3, MapPin, Satellite, Sprout, Sun, Thermometer } from 'lucide-react'
import '@fontsource-variable/inter'
import 'leaflet/dist/leaflet.css'
import './style.css'
import { challenge, fetchClimate, format, locations, monthNames, period, powerDocs, type Climate, type Location } from './power'
import { compare, criteria, crops, defaultFarm, embrapa, fao, limits, methodology, priorities, soils, weights, type Farm } from './rotation'

function readSaved<T>(key: string, fallback: T, validate: (value: T) => boolean): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && validate(value) ? value : fallback
  } catch { return fallback }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage is optional. */ }
}
const validCoords = (lat: number, lon: number) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180

function MapSelection({ location, select }: { location: Location; select: (location: Location) => void }) {
  const map = useMap()
  useMapEvents({ click: ({ latlng }) => {
    const point = latlng.wrap()
    const lat = +point.lat.toFixed(4), lon = +point.lng.toFixed(4)
    if (validCoords(lat, lon)) select({ lat, lon, name: 'Ponto selecionado' })
  } })
  useEffect(() => { map.panTo([location.lat, location.lon], { animate: false }) }, [map, location])
  return <CircleMarker center={[location.lat, location.lon]} radius={10} pathOptions={{ color: 'white', weight: 3, fillColor: '#13844f', fillOpacity: 1 }}><MapTooltip>{location.name}</MapTooltip></CircleMarker>
}

function App() {
  const [location, setLocation] = useState(() => readSaved<Location>('earthvision-location', locations[0], (value) => validCoords(value.lat, value.lon) && typeof value.name === 'string'))
  const [farm, setFarm] = useState(() => readSaved<Farm>('earthvision-farm', defaultFarm, (value) => Object.hasOwn(crops, value.crop) && Object.hasOwn(soils, value.soil) && Object.hasOwn(priorities, value.priority) && typeof value.name === 'string' && typeof value.area === 'string' && typeof value.irrigated === 'boolean' && Number.isInteger(value.month) && value.month >= 0 && value.month < 12))
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState<{ key: string; climate?: Climate; error?: string } | null>(null)
  const [reportStatus, setReportStatus] = useState('')
  const requestKey = [location.lat, location.lon, retry].join(',')
  const active = request?.key === requestKey ? request : null
  const climate = active?.climate ?? null
  const strategies = compare(farm, climate)
  const window = monthNames[farm.month] + ' a ' + monthNames[(farm.month + 3) % 12]
  const best = strategies[0].total
  useEffect(() => {
    const controller = new AbortController()
    fetchClimate(location, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setRequest({ key: requestKey, climate: data }) })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setRequest({ key: requestKey, error: error instanceof Error && error.message.startsWith('A NASA') ? error.message : 'Não foi possível consultar a NASA POWER para este ponto.' })
      })
    save('earthvision-location', location)
    return () => controller.abort()
  }, [location, requestKey])
  useEffect(() => { save('earthvision-farm', farm) }, [farm])
  function update<K extends keyof Farm>(key: K, value: Farm[K]) { setFarm((previous) => ({ ...previous, [key]: value })) }
  async function download() {
    if (!climate) return
    setReportStatus('Gerando PDF…')
    try {
      const { exportReport } = await import('./report')
      exportReport(location, farm, climate, strategies, window)
      setReportStatus('PDF gerado.')
    } catch { setReportStatus('Falha ao gerar o PDF. Tente novamente.') }
  }
  const cards = [
    { icon: Thermometer, name: 'Temperatura média', value: climate?.temperature ?? null, unit: '°C', detail: 'Média diária a 2 m', color: 'amber' },
    { icon: CloudRain, name: 'Chuva acumulada', value: climate?.rain ?? null, unit: 'mm', detail: 'Soma do ano', color: 'blue', digits: 0 },
    { icon: Sun, name: 'Radiação solar', value: climate?.solar ?? null, unit: 'MJ/m²/dia', detail: 'Média diária na superfície', color: 'amber' },
    { icon: Droplets, name: 'Meses pouco chuvosos', value: climate?.dryMonths ?? null, unit: '/ 12', detail: 'Meses com chuva abaixo de 60 mm', color: 'green', digits: 0 },
  ]
  return <>
    <header className="top">
      <div className="shell top-inner">
        <a href="#inicio" className="brand"><span className="brand-icon"><Globe2 size={23} /></span>EarthVision</a>
        <nav aria-label="Navegação"><a href="#territorio"><MapPin size={15} /> Território</a><a href="#simulador"><Sprout size={16} /> Rotação de culturas</a></nav>
        <a className="challenge" target="_blank" rel="noreferrer" href={challenge}><Satellite size={15} /> NASA Space Apps 2026</a>
      </div>
    </header>
    <main id="inicio">
      <section className="hero"><div className="shell hero-inner">
        <div className="hero-copy"><p className="eyebrow"><Satellite size={16} /> Inteligência espacial para decisões agrícolas</p><h1>Planeje sua<br />próxima <em>safra.</em></h1><p>Explore o clima da sua região e compare rotações de culturas com dados históricos da NASA POWER.</p><a className="button primary" href="#simulador">Comparar estratégias <ArrowRight size={18} /></a></div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="planet"></div><div className="star one"></div><div className="star two"></div><div className="star three"></div></div>
      </div></section>
      <div className="shell content">
        <section id="territorio" className="section">
          <div className="section-head"><div><p className="eyebrow"><MapPin size={16} /> Território</p><h2>Clima da propriedade</h2><p>Selecione a área de interesse para consultar o histórico da região.</p></div><span className="tag"><Satellite size={15} /> NASA POWER · {period}</span></div>
          <div className="territory">
            <div className="panel map-card">
              <div className="panel-head"><div><h3>Localização</h3><p>Clique no mapa para selecionar um ponto.</p></div><Layers3 size={19} /></div>
              <MapContainer center={[location.lat, location.lon]} zoom={6} minZoom={3} maxZoom={18} scrollWheelZoom={false} className="map">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapSelection location={location} select={setLocation} />
              </MapContainer>
              <div className="location-strip"><div><strong>{location.name}</strong><small>{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</small></div>
                <select aria-label="Locais de exemplo" value={locations.findIndex((item) => location.lat === item.lat && location.lon === item.lon)} onChange={(event) => { const point = locations[Number(event.target.value)]; if (point) setLocation(point) }}>
                  <option value={-1} disabled>Locais de exemplo</option>{locations.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}
                </select></div>
              <Coordinates key={location.lat + ',' + location.lon} location={location} select={setLocation} />
            </div>
            <div className="panel chart-card">
              <div className="panel-head"><div><h3>Clima ao longo do ano</h3><p>Precipitação e temperatura por mês de 2025</p></div><BarChart3 size={19} /></div>
              {climate ? <><div className="chart" role="img" aria-label="Gráfico mensal de precipitação e temperatura">
                <ResponsiveContainer width="100%" height="100%"><ComposedChart data={climate.months} margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7eee9" strokeDasharray="4 4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52665d' }} />
                  <YAxis yAxisId="rain" width={37} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#52665d' }} />
                  <YAxis yAxisId="temp" orientation="right" width={33} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#52665d' }} />
                  <Tooltip formatter={(value, name) => [format(Number(value)), name]} />
                  <Bar yAxisId="rain" name="Chuva (mm)" dataKey="rain" fill="#8acdb0" radius={[4,4,0,0]} maxBarSize={26} />
                  <Area yAxisId="temp" name="Temperatura (°C)" type="monotone" dataKey="temperature" stroke="#a86429" fill="none" strokeWidth={2} dot />
                </ComposedChart></ResponsiveContainer></div>
                <div className="legend"><span><i /> Chuva (mm)</span><span><i /> Temperatura (°C)</span></div>
                <details className="monthly"><summary>Ver valores mensais</summary><table><thead><tr><th>Mês</th><th>Chuva (mm)</th><th>Temperatura (°C)</th></tr></thead><tbody>{climate.months.map((month) => <tr key={month.name}><th>{month.name}</th><td>{format(month.rain)}</td><td>{format(month.temperature)}</td></tr>)}</tbody></table></details>
              </> : <div className="empty" role="status"><Satellite size={25} /><p>{active?.error ?? 'Consultando NASA POWER…'}</p>{active?.error && <button className="button secondary" onClick={() => setRetry(retry + 1)}>Tentar novamente</button>}</div>}
            </div>
          </div>
          <div className="metrics">{cards.map(({ icon: Icon, name, value, unit, detail, color, digits }) => <article className="panel metric" key={name}><span className={'metric-icon ' + color}><Icon size={19} /></span><p>{name}</p><div><strong>{format(value, digits)}</strong> <small>{value !== null ? unit : 'indisponível'}</small></div><span>{detail}</span></article>)}</div>
          {climate && <p className="source"><Info size={15} /> <span>{climate.origin === 'live' ? 'Consulta on-line' : 'Cópia histórica local para Sorriso (MT)'} · {climate.coverage.T2M}/{climate.coverage.PRECTOTCORR}/{climate.coverage.ALLSKY_SFC_SW_DWN} de 365 dias válidos (temperatura, chuva e radiação). <a href={climate.url} target="_blank" rel="noreferrer">Dados originais</a></span></p>}
        </section>
        <section id="simulador" className="section">
          <div className="section-head"><div><p className="eyebrow"><Sprout size={17} /> Simulador</p><h2>Rotação de culturas</h2><p>Informe as condições do talhão e veja quais estratégias atendem suas prioridades.</p></div><button className="button secondary" disabled={!climate || reportStatus === 'Gerando PDF…'} onClick={download}><FileDown size={18} /> Exportar PDF</button></div>
          <p className="report-status" role="status">{reportStatus}</p>
          <div className="simulator">
            <div className="panel farm"><h3>Seu talhão</h3><label>Nome da propriedade<input placeholder="Ex.: Fazenda Boa Vista" maxLength={100} value={farm.name} onChange={(event) => update('name', event.target.value)} /></label>
              <div className="field-grid"><label>Área (ha)<input type="number" min="0" step="any" placeholder="Opcional" value={farm.area} onChange={(event) => update('area', event.target.validity.valid ? event.target.value : '')} /></label><label>Textura do solo<select value={farm.soil} onChange={(event) => update('soil', event.target.value as Farm['soil'])}>{Object.entries(soils).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
              <label>Cultura atual<select value={farm.crop} onChange={(event) => update('crop', event.target.value as Farm['crop'])}>{Object.entries(crops).map(([key, crop]) => <option key={key} value={key}>{crop.name}</option>)}</select></label>
              <label>Início da próxima janela<select value={farm.month} onChange={(event) => update('month', Number(event.target.value))}>{monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}</select></label>
              <label className="checkbox"><input type="checkbox" checked={farm.irrigated} onChange={(event) => update('irrigated', event.target.checked)} /> Talhão com irrigação</label>
              <fieldset><legend>Prioridade do agricultor</legend><div className="priorities">{Object.entries(priorities).map(([key, label]) => <label key={key} className={key === farm.priority ? 'picked' : ''}><input type="radio" name="priority" value={key} checked={key === farm.priority} onChange={() => update('priority', key as Farm['priority'])} />{label}</label>)}</div></fieldset>
            </div>
            <div className="results">
              <div className="result-summary"><div><strong>Janela histórica · {window}</strong><p>Pesos de água, solo e produção · {weights[farm.priority].map((weight) => Math.round(weight * 100) + '%').join(' / ')}</p></div><span className="tag"><ArrowDown size={15} /> Maior nota primeiro</span></div>
              <div className="strategies">{strategies.map((item) => <article className={'panel strategy ' + (item.total !== null && item.total === best ? 'best' : '')} key={item.id}>
                <div className="strategy-top"><span className="metric-icon green">{item.id === 'water' ? <Droplets size={19} /> : item.id === 'soil' ? <Sprout size={19} /> : <BarChart3 size={19} />}</span><div className="score" aria-label={item.total === null ? 'Nota indisponível' : 'Nota ' + item.total + ' de 100'}>{item.total ?? '—'}<small>/100</small></div></div>
                <h3>{item.name}</h3><strong className="sequence">{item.sequence}</strong><p>{item.description}</p>
                <div className="bars">{item.scores.map((score, index) => <div key={criteria[index]}><span>{criteria[index]} <b>{score ?? '—'}</b></span><div className="track"><div style={{ width: (score ?? 0) + '%' }} /></div></div>)}</div>
                <p className="water-note">Chuva histórica {format(item.windowRain, 0)} mm · Demanda {item.waterNeed} mm</p>
                <details><summary>Vantagens e riscos</summary><p>{item.benefit}</p><ul>{item.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></details>
              </article>)}</div>
              {best === null && <p className="source"><Info size={15} /> A nota final exige chuva e temperatura suficientes para a análise.</p>}
              <details className="panel method"><summary>Como as notas são calculadas?</summary><p>{methodology}</p><p>{limits}</p><div className="links"><a href={powerDocs}>NASA POWER</a><a href={fao}>FAO</a><a href={embrapa}>Embrapa</a></div></details>
            </div>
          </div>
        </section>
      </div>
    </main>
    <footer><div className="shell"><strong><Globe2 size={19} /> EarthVision</strong><span>Dados climáticos NASA POWER · Mapa OpenStreetMap</span></div></footer>
  </>
}
function Coordinates({ location, select }: { location: Location; select: (location: Location) => void }) {
  const [lat, setLat] = useState(String(location.lat))
  const [lon, setLon] = useState(String(location.lon))
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const latitude = Number(lat), longitude = Number(lon)
    if (!lat.trim() || !lon.trim() || !validCoords(latitude, longitude)) { setError('Use latitude entre −85 e 85 e longitude entre −180 e 180.'); return }
    setError('')
    select(locations.find((item) => item.lat === latitude && item.lon === longitude) ?? { lat: latitude, lon: longitude, name: 'Ponto selecionado' })
  }
  return <form className="coordinates" onSubmit={submit}><label>Latitude<input type="number" step="any" value={lat} onChange={(event) => setLat(event.target.value)} /></label><label>Longitude<input type="number" step="any" value={lon} onChange={(event) => setLon(event.target.value)} /></label><button className="button secondary">Aplicar</button>{error && <small role="alert">{error}</small>}</form>
}
createRoot(document.getElementById('root')!).render(<App />)
