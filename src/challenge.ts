import { powerDocs } from './power'
import { ndviProduct } from './ndvi'
import { ensoDocs } from './enso'
import { geocodingDocs } from './geo'
import { srtmDocs } from './terrain'

export const challengeUrl = 'https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/'

/** Pedidos do desafio "Field Shift: Adapting Farms with NASA Data" e onde o EarthVision atende cada um. */
export const challengeSteps = [
  { title: "Understand the farmer's problem", how: "Locate the farm and review local climate risks and the crop risk calendar." },
  { title: "Combine NASA data with local information", how: "Compare climate, soil moisture, vegetation, and terrain with the farmer's crop, soil, and constraints." },
  { title: "Respect the farmer's priorities", how: "Account for production goals, markets, equipment, livestock, and irrigation." },
  { title: "Compare crop rotations", how: "Compare the current practice and alternatives using scores, evidence, costs, and risks." },
  { title: "Explore scenarios and long-term outcomes", how: "Test rainfall and temperature changes and view the three-year plan under ENSO scenarios." },
  { title: "Support agronomic decisions", how: "Use the glossary, evidence, and downloadable report to discuss options with local advisers." },
]

/** Data sources: só as fontes que o EarthVision usa de verdade, e o que tiramos de cada uma. */
export interface DataSource { id: 'power' | 'merra' | 'modis' | 'srtm' | 'oni' | 'fao' | 'geo'; name: string; org: string; url: string; about: string; what: string; idea: string }
export const dataSources: DataSource[] = [
  { id: 'power', about: 'Projeto da NASA que junta dados de satélites e modelos para entregar o clima de qualquer ponto do planeta, dia a dia, desde 1981. Foi feito pensando em agricultura e energia solar.', name: 'NASA POWER', org: 'NASA · Langley Research Center', url: powerDocs, what: 'Daily temperatures, rainfall, solar radiation, and humidity.', idea: 'Gráfico do clima, calor acima de 95 °F, risco de geada, chuva extrema, evapotranspiração e se a chuva do ciclo atende cada cultura.' },
  { id: 'merra', about: 'Modelo da NASA que reconstrói a atmosfera e o solo combinando milhões de observações. Dele vem a estimativa de quanta água há no solo onde estão as raízes.', name: 'MERRA-2 (via NASA POWER)', org: 'NASA · GMAO', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/', what: 'Soil moisture in the root zone.', idea: 'Ajusta a nota de água: solo mais úmido segura melhor a lavoura nos veranicos.' },
  { id: 'modis', about: 'Sensor a bordo do satélite Terra, da NASA, que fotografa a Terra inteira a cada 1 ou 2 dias. A cada 16 dias ele gera um mapa do "verde" das plantas (NDVI).', name: 'MODIS Terra MOD13Q1', org: 'NASA · LP DAAC / ORNL DAAC', url: ndviProduct, what: 'Vegetation index (NDVI) every 16 days at 250 m resolution.', idea: 'Mostra os meses em que o solo fica descoberto e valoriza as plantas de cobertura.' },
  { id: 'srtm', about: 'Missão do ônibus espacial Endeavour (2000) que mapeou o relevo de quase todo o planeta com radar. Mostra a altura do terreno a cada 30 metros.', name: 'SRTM', org: 'NASA · Shuttle Radar Topography Mission', url: srtmDocs, what: 'Terrain elevation at 30 m resolution.', idea: 'Calcula a declividade e o risco de erosão do talhão.' },
  { id: 'oni', about: 'Índice oficial da agência americana NOAA que mede a temperatura do Oceano Pacífico e diz se o ano é de El Niño, La Niña ou neutro.', name: 'Oceanic Niño Index', org: 'NOAA · Climate Prediction Center', url: ensoDocs, what: 'Historical El Niño, La Niña, and neutral phases.', idea: 'Cenários de El Niño e La Niña no plano de 3 anos.' },
  { id: 'fao', about: 'Referências técnicas da FAO (ONU) e da Embrapa sobre quanta água e que temperatura cada cultura precisa para produzir bem.', name: 'Crop water requirements', org: 'FAO e Embrapa', url: 'https://www.fao.org/4/s2022e/s2022e07.htm', what: 'Crop water needs and suitable temperature ranges.', idea: 'Base das notas de água e clima de cada cultura.' },
  { id: 'geo', about: 'Serviço gratuito que transforma o nome de uma cidade em coordenadas no mapa, em qualquer país.', name: 'City search', org: 'Open-Meteo Geocoding', url: geocodingDocs, what: 'Coordinates for cities worldwide.', idea: 'Permite achar a fazenda pelo nome da cidade, sem digitar latitude e longitude.' },
]

export interface Term { term: string; group: 'Climate' | 'Soil and water' | 'Satellite' | 'Crops'; text: string; example?: string }
export const glossary: Term[] = [
  { term: "Evapotranspiration", group: "Soil and water", text: "Water that evaporates from soil and transpires from plants.", example: "If rainfall is 100 mm and evapotranspiration is 150 mm, the difference is a 50 mm deficit." },
  { term: "Water balance", group: "Soil and water", text: "Rainfall minus evapotranspiration. A negative balance indicates a water deficit." },
  { term: "Soil moisture", group: "Soil and water", text: "The model estimates how wet the soil is in the root zone." },
  { term: "Slope", group: "Soil and water", text: "The steepness of the field. Steeper slopes can increase runoff and erosion." },
  { term: "Erosion", group: "Soil and water", text: "Loss of topsoil to rain or wind. Crop residue helps protect it." },
  { term: "El Niño", group: "Climate", text: "The warm phase of a Pacific climate pattern that can change regional rainfall." },
  { term: "La Niña", group: "Climate", text: "The cool phase of a Pacific climate pattern that can change regional rainfall." },
  { term: "Frost risk", group: "Climate", text: "EarthVision flags days when the minimum temperature is below 35.6 °F. Temperatures at ground level can be lower." },
  { term: "Dry spell", group: "Climate", text: "Several days without rain during the rainy season. This can be especially harmful during flowering." },
  { term: "NDVI", group: "Satellite", text: "A satellite index of vegetation greenness. Low values can indicate bare soil or sparse vegetation." },
  { term: "Satellite vs. field measurements", group: "Satellite", text: "Satellite data summarize an area. Rain gauges and soil tests provide measurements at the field." },
  { term: "Crop rotation", group: "Crops", text: "Growing different crops in sequence on the same field to support soil health and interrupt pest cycles." },
  { term: "Second growing season", group: "Crops", text: "The season after the summer harvest, often timed to use remaining rainfall." },
  { term: "Cover crop", group: "Crops", text: "A crop grown to protect and improve the soil, such as pearl millet or sunn hemp." },
  { term: "Nitrogen fixation", group: "Crops", text: "Legumes can use bacteria to convert atmospheric nitrogen into forms plants can use." },
  { term: "Fallow", group: "Crops", text: "Leaving a field out of production. Bare fallow can expose soil to erosion and weeds." },
  { term: "Score out of 100", group: "Crops", text: "A weighted comparison of water, soil, climate, and profit based on your priority." },
]
