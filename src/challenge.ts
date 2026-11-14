import { powerDocs } from './power'
import { ndviProduct } from './ndvi'
import { ensoDocs } from './enso'
import { geocodingDocs } from './geo'

/** Etapas do desafio (NASA Space Apps 2026 · Adapting Farms with NASA Data) e como o EarthVision atende cada uma. */
export const challengeSteps = [
  { title: 'Identificar o problema do agricultor', how: 'Passos 1 e 2: o produtor encontra a fazenda por cidade, GPS ou mapa, em qualquer país, e vê os problemas climáticos da região (seca, calor, chuva concentrada, solo descoberto, El Niño/La Niña).', data: 'Busca mundial Open-Meteo · NASA POWER · MODIS · NOAA ONI' },
  { title: 'Usar dados da NASA na pesquisa', how: 'Clima diário de 2020 a 2025, umidade do solo e vegetação por satélite, agregados por mês e explicados em linguagem simples.', data: 'NASA POWER (T2M, chuva, radiação, máximas), MERRA-2 (GWETROOT), MODIS NDVI' },
  { title: 'Incluir solo, culturas e prioridades', how: 'Passo 3: tipo de solo, cultura atual com breve explicação, mês de plantio (safra, safrinha ou inverno) e 7 prioridades do agricultor.', data: '10 culturas com família, ciclo, necessidade de água e faixa de temperatura (FAO/Embrapa)' },
  { title: 'Propor uma solução de plantio', how: 'Passo 4: as 3 melhores culturas para o mês escolhido, com nota, motivos, cuidados, receita, custo, lucro e economia de adubo e água.', data: 'Preços e custos editáveis pelo produtor' },
  { title: 'Prever o longo prazo', how: 'Passo 5: plano de 3 anos com lucro acumulado e saúde do solo, comparando anos normais, de El Niño e de La Niña com a opção de não fazer rotação.', data: 'Gráficos, calendário e resumo em texto' },
  { title: 'Comunicar a decisão', how: 'Relatório PDF com clima, problemas, proposta, finanças e plano, pronto para levar ao agrônomo.', data: 'Gerado no navegador' },
]

export const nasaSources = [
  { name: 'NASA POWER (LaRC)', url: powerDocs, use: 'Clima diário: temperatura, máximas, chuva, radiação e umidade do ar.', variables: 'Comunidade AG · 2020–2025' },
  { name: 'MERRA-2 / GMAO via POWER', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/', use: 'Umidade do solo na zona das raízes, que ajusta a nota de água.', variables: 'GWETTOP · GWETROOT' },
  { name: 'MODIS Terra MOD13Q1', url: ndviProduct, use: 'Verde da vegetação a cada 16 dias: mostra quando o solo fica descoberto.', variables: 'NDVI 250 m · ORNL DAAC' },
  { name: 'NOAA CPC · índice ONI', url: ensoDocs, use: 'Fase de El Niño / La Niña em cada ano e seus efeitos na região.', variables: 'Cenários no plano de 3 anos' },
  { name: 'Open-Meteo Geocoding', url: geocodingDocs, use: 'Busca de cidades no mundo todo.', variables: 'Sem chave' },
]
