import { powerDocs } from './power'
import { ndviProduct } from './ndvi'
import { ensoDocs } from './enso'
import { geocodingDocs } from './geo'
import { srtmDocs } from './terrain'

export const challengeUrl = 'https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/'

/** Pedidos do desafio "Field Shift: Adapting Farms with NASA Data" e onde o EarthVision atende cada um. */
export const challengeSteps = [
  { title: 'Entender o problema do agricultor', how: 'Passos 1 e 2: busca da fazenda no mundo todo, problemas da região (seca, déficit hídrico, calor, geada, chuva extrema, erosão, solo descoberto, El Niño) e calendário de meses vulneráveis.', data: 'NASA POWER · MERRA-2 · MODIS · SRTM · NOAA ONI' },
  { title: 'Combinar dados da NASA com informação local', how: 'Clima diário, umidade do solo, vegetação e relevo da NASA, harmonizados por mês no ponto da fazenda, junto com o solo, a cultura atual e as restrições informadas pelo produtor.', data: 'Grade comum: série mensal no ponto escolhido' },
  { title: 'Respeitar as prioridades e restrições do produtor', how: 'Passo 3: 9 prioridades (água, solo, lucro, risco, adubo, erosão, forragem…), mercado local, equipamento, gado e irrigação.', data: 'As culturas sem mercado ou sem equipamento saem da lista' },
  { title: 'Comparar pelo menos 3 estratégias, incluindo a atual', how: 'Passo 4: a rotação atual (referência) e as 3 melhores alternativas, cada uma com motivo, evidências dos dados, benefícios, riscos para revisão local e lacunas de informação.', data: 'Notas de água, solo, clima e lucro' },
  { title: 'Explorar cenários e o longo prazo', how: 'Controles "e se" de chuva e temperatura, cenários El Niño/La Niña e plano de 3 anos com lucro e saúde do solo.', data: 'Gráficos, calendário e resumo em texto' },
  { title: 'Apoiar, não substituir, o agrônomo', how: 'Glossário em linguagem simples, aviso de incerteza em cada etapa e relatório PDF para levar à assistência técnica.', data: 'Lacunas e riscos listados em cada estratégia' },
]

export interface Resource { name: string; url: string; use: string; status: 'usado' | 'próxima versão' }
export const resources: Resource[] = [
  { name: 'NASA POWER', url: powerDocs, use: 'Temperatura, máximas/mínimas, chuva, radiação e umidade: geada, calor, chuva extrema e evapotranspiração.', status: 'usado' },
  { name: 'MERRA-2 / GMAO (via POWER)', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/', use: 'Umidade do solo na zona das raízes.', status: 'usado' },
  { name: 'MODIS MOD13Q1 (NDVI)', url: ndviProduct, use: 'Vigor da vegetação e meses de solo descoberto.', status: 'usado' },
  { name: 'SRTM (relevo)', url: srtmDocs, use: 'Altitude e declividade para o risco de erosão.', status: 'usado' },
  { name: 'NOAA CPC · ONI', url: ensoDocs, use: 'Fases de El Niño / La Niña e cenários.', status: 'usado' },
  { name: 'Open-Meteo Geocoding', url: geocodingDocs, use: 'Busca de cidades no mundo.', status: 'usado' },
  { name: 'SMAP', url: 'https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap', use: 'Umidade do solo medida por satélite a cada 2–3 dias e congelamento.', status: 'próxima versão' },
  { name: 'GPM IMERG', url: 'https://gpm.nasa.gov/data', use: 'Chuva por satélite e frequência de tempestades.', status: 'próxima versão' },
  { name: 'ECOSTRESS', url: 'https://ecostress.jpl.nasa.gov/data', use: 'Temperatura da superfície e evapotranspiração em alta resolução.', status: 'próxima versão' },
  { name: 'Landsat / VIIRS', url: 'https://earthexplorer.usgs.gov/', use: 'NDVI em 30 m para ver o talhão.', status: 'próxima versão' },
  { name: 'GRACE / GRACE-FO', url: 'https://grace.jpl.nasa.gov/data/get-data/', use: 'Tendência da água subterrânea.', status: 'próxima versão' },
  { name: 'NLDAS / GLDAS', url: 'https://www.earthdata.nasa.gov/', use: 'Umidade do solo e evapotranspiração contínuas.', status: 'próxima versão' },
  { name: 'GEDI', url: 'https://gedi.umd.edu/data', use: 'Biomassa e estrutura da vegetação ao redor.', status: 'próxima versão' },
  { name: 'Sentinel-2 (ESA)', url: 'https://dataspace.copernicus.eu/', use: 'NDVI/EVI em 10 m e solo exposto.', status: 'próxima versão' },
  { name: 'ERA5 (ECMWF)', url: 'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview', use: 'Clima horário onde faltam estações.', status: 'próxima versão' },
  { name: 'FAO GAEZ', url: 'https://gaez.fao.org/', use: 'Aptidão agroclimática de culturas no mundo.', status: 'próxima versão' },
  { name: 'USDA SSURGO / Web Soil Survey', url: 'https://websoilsurvey.nrcs.usda.gov/app/', use: 'Textura, matéria orgânica e drenagem do solo (EUA).', status: 'próxima versão' },
  { name: 'USDA CropScape (CDL)', url: 'https://nassgeodata.gmu.edu/CropScape/', use: 'Rotação real de cada talhão nos EUA.', status: 'próxima versão' },
  { name: 'USDA NASS QuickStats / AMS Market News', url: 'https://quickstats.nass.usda.gov/', use: 'Produtividades e preços para calibrar o lucro.', status: 'próxima versão' },
  { name: 'OpenET', url: 'https://openetdata.org/', use: 'Evapotranspiração por talhão (oeste dos EUA).', status: 'próxima versão' },
  { name: 'PRISM / CoCoRaHS / NWIS', url: 'https://prism.oregonstate.edu/', use: 'Clima, chuva de campo e água subterrânea para validar o satélite (EUA).', status: 'próxima versão' },
]

export const glossary = [
  { term: 'Evapotranspiração (ET)', text: 'Água que sai do solo e das plantas para o ar. Quanto mais calor e sol, maior. Se a ET passa da chuva, falta água.' },
  { term: 'Balanço hídrico', text: 'Chuva menos evapotranspiração. Negativo = a lavoura depende da água guardada no solo ou de irrigação.' },
  { term: 'Umidade do solo', text: 'Quanto de água há no solo (0% seco, 100% encharcado). Vem de modelos e satélites da NASA, não de um sensor na sua fazenda.' },
  { term: 'NDVI', text: 'Índice do "verde" visto do satélite (0 a 1). Abaixo de 0,35 indica solo descoberto ou planta estressada.' },
  { term: 'Risco de geada', text: 'Dias em que a mínima fica abaixo de 2 °C a 2 m do chão; na superfície pode gear.' },
  { term: 'Declividade', text: 'Inclinação do terreno. Acima de 8% a água da chuva escorre com força e leva solo.' },
  { term: 'El Niño / La Niña', text: 'Aquecimento ou resfriamento do Oceano Pacífico que muda a chuva em várias partes do mundo.' },
  { term: 'Satélite × medição no campo', text: 'Satélites e modelos cobrem o mundo todo, mas cada valor representa uma área grande (de 250 m a 50 km). Pluviômetro, análise de solo e a experiência do produtor mostram o que acontece no talhão. O melhor é combinar os dois.' },
]
