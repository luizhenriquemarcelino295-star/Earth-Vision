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

/** Base de dados: só as fontes que o EarthVision usa de verdade, e o que tiramos de cada uma. */
export interface DataSource { id: 'power' | 'merra' | 'modis' | 'srtm' | 'oni' | 'fao' | 'geo'; name: string; org: string; url: string; about: string; what: string; idea: string }
export const dataSources: DataSource[] = [
  { id: 'power', about: 'Projeto da NASA que junta dados de satélites e modelos para entregar o clima de qualquer ponto do planeta, dia a dia, desde 1981. Foi feito pensando em agricultura e energia solar.', name: 'NASA POWER', org: 'NASA · Langley Research Center', url: powerDocs, what: 'Temperatura média, máxima e mínima, chuva diária, radiação solar e umidade do ar.', idea: 'Gráfico do clima, calor acima de 35 °C, risco de geada, chuva extrema, evapotranspiração e se a chuva do ciclo atende cada cultura.' },
  { id: 'merra', about: 'Modelo da NASA que reconstrói a atmosfera e o solo combinando milhões de observações. Dele vem a estimativa de quanta água há no solo onde estão as raízes.', name: 'MERRA-2 (via NASA POWER)', org: 'NASA · GMAO', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/', what: 'Umidade do solo na camada das raízes.', idea: 'Ajusta a nota de água: solo mais úmido segura melhor a lavoura nos veranicos.' },
  { id: 'modis', about: 'Sensor a bordo do satélite Terra, da NASA, que fotografa a Terra inteira a cada 1 ou 2 dias. A cada 16 dias ele gera um mapa do "verde" das plantas (NDVI).', name: 'MODIS Terra MOD13Q1', org: 'NASA · LP DAAC / ORNL DAAC', url: ndviProduct, what: 'Índice de vegetação (NDVI) a cada 16 dias, em pixels de 250 m.', idea: 'Mostra os meses em que o solo fica descoberto e valoriza as plantas de cobertura.' },
  { id: 'srtm', about: 'Missão do ônibus espacial Endeavour (2000) que mapeou o relevo de quase todo o planeta com radar. Mostra a altura do terreno a cada 30 metros.', name: 'SRTM', org: 'NASA · Shuttle Radar Topography Mission', url: srtmDocs, what: 'Altitude do terreno em 30 m.', idea: 'Calcula a declividade e o risco de erosão do talhão.' },
  { id: 'oni', about: 'Índice oficial da agência americana NOAA que mede a temperatura do Oceano Pacífico e diz se o ano é de El Niño, La Niña ou neutro.', name: 'Índice ONI', org: 'NOAA · Climate Prediction Center', url: ensoDocs, what: 'Fase de El Niño, La Niña ou neutro de cada ano.', idea: 'Cenários de El Niño e La Niña no plano de 3 anos.' },
  { id: 'fao', about: 'Referências técnicas da FAO (ONU) e da Embrapa sobre quanta água e que temperatura cada cultura precisa para produzir bem.', name: 'Necessidade de água das culturas', org: 'FAO e Embrapa', url: 'https://www.fao.org/4/s2022e/s2022e07.htm', what: 'Quanta água cada cultura precisa no ciclo e faixa de temperatura ideal.', idea: 'Base das notas de água e clima de cada cultura.' },
  { id: 'geo', about: 'Serviço gratuito que transforma o nome de uma cidade em coordenadas no mapa, em qualquer país.', name: 'Busca de cidades', org: 'Open-Meteo Geocoding', url: geocodingDocs, what: 'Coordenadas de cidades do mundo todo.', idea: 'Permite achar a fazenda pelo nome da cidade, sem digitar latitude e longitude.' },
]

export interface Term { term: string; group: 'Clima' | 'Solo e água' | 'Satélite' | 'Lavoura'; text: string; example?: string }
export const glossary: Term[] = [
  { term: 'Evapotranspiração', group: 'Solo e água', text: 'É a água que sai do solo e das folhas e vai para o ar. Quanto mais sol, calor e vento, mais água a lavoura "gasta".', example: 'Se chove 100 mm no mês e a evapotranspiração é 150 mm, faltam 50 mm: a planta usa a água guardada no solo.' },
  { term: 'Balanço hídrico', group: 'Solo e água', text: 'É a conta da chuva menos a evapotranspiração. Positivo: sobra água. Negativo: falta água.', example: 'No calendário do passo 2, o número embaixo de cada mês é o balanço hídrico.' },
  { term: 'Umidade do solo', group: 'Solo e água', text: 'Quanto de água existe no solo, de 0% (seco) a 100% (encharcado). Vem de modelos da NASA, não de um sensor na sua fazenda.' },
  { term: 'Declividade', group: 'Solo e água', text: 'É a inclinação do terreno. Acima de 8% a chuva escorre com força e leva solo junto (erosão).' },
  { term: 'Erosão', group: 'Solo e água', text: 'Perda da camada fértil do solo levada pela chuva ou pelo vento. Solo coberto com palhada sofre muito menos.' },
  { term: 'El Niño', group: 'Clima', text: 'Aquecimento das águas do Oceano Pacífico que muda a chuva no mundo. No Sul do Brasil costuma trazer mais chuva; no Norte e Nordeste, seca.' },
  { term: 'La Niña', group: 'Clima', text: 'Resfriamento das águas do Pacífico. No Sul do Brasil e na Argentina costuma trazer seca; no Nordeste, mais chuva.' },
  { term: 'Risco de geada', group: 'Clima', text: 'Dias em que a temperatura mínima fica abaixo de 2 °C. Perto do chão pode gear e queimar a lavoura.' },
  { term: 'Veranico', group: 'Clima', text: 'Sequência de dias sem chuva no meio da estação chuvosa. É perigoso no florescimento.' },
  { term: 'NDVI', group: 'Satélite', text: 'Medida do "verde" da vegetação vista pelo satélite, de 0 a 1. Abaixo de 0,35 indica solo descoberto ou planta fraca.' },
  { term: 'Satélite × medição no campo', group: 'Satélite', text: 'O satélite enxerga o mundo todo, mas cada valor representa uma área grande (de 250 m a 50 km). Pluviômetro, análise de solo e a sua experiência mostram o talhão. O melhor é usar os dois.' },
  { term: 'Rotação de culturas', group: 'Lavoura', text: 'Alternar culturas diferentes no mesmo talhão ao longo do tempo. Quebra o ciclo de pragas e doenças e melhora o solo.' },
  { term: 'Safrinha', group: 'Lavoura', text: 'A segunda safra do ano, plantada logo depois da colheita de verão, aproveitando as últimas chuvas.' },
  { term: 'Planta de cobertura', group: 'Lavoura', text: 'Cultura plantada para proteger e melhorar o solo, não para vender grão. Ex.: milheto, braquiária, crotalária.' },
  { term: 'Fixação de nitrogênio', group: 'Lavoura', text: 'Leguminosas (soja, feijão, crotalária) tiram nitrogênio do ar e deixam no solo. A próxima cultura precisa de menos adubo.' },
  { term: 'Pousio', group: 'Lavoura', text: 'Deixar o talhão parado, sem cultura. Economiza custo, mas deixa o solo exposto à erosão e ao mato.' },
  { term: 'Nota de 0 a 100', group: 'Lavoura', text: 'Resumo do EarthVision para comparar opções: junta água, solo, clima e lucro, com o peso da sua prioridade. Serve para conversar com o agrônomo, não é uma ordem.' },
]
