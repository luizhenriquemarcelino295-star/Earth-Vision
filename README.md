# EarthVision

Inteligência espacial para decisões agrícolas. MVP do desafio **Field Shift: Adapting Farms with NASA Data** do NASA Space Apps Challenge 2026.

## Executar no Windows

Requer Node.js 22.12+ ou 24. No PowerShell:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abra http://127.0.0.1:5173. O build estático fica em `dist/`. Também é possível servi-lo com `npm.cmd run preview`. O projeto usa React, TypeScript, Vite, Leaflet, Recharts e jsPDF.

## Fluxo em 5 passos

1. **Onde fica** – busca de cidade em qualquer país, GPS do celular ou clique no mapa (sem digitar coordenadas).
2. **Clima e problemas** – escolha o ano (2020–2025), veja a fase de El Niño/La Niña, os efeitos na região, os problemas detectados (seca, calor, chuva concentrada, solo descoberto) e o gráfico mensal.
3. **Seu talhão** – mês do próximo plantio (safra de verão, safrinha ou inverno), cultura atual com breve explicação, tipo de solo, área, irrigação e 7 prioridades.
4. **Proposta de plantio** – as 3 melhores culturas para aquele mês, com nota, motivos, cuidados, receita, custo, lucro e economia de adubo/água. Preços e custos são editáveis.
5. **Próximos 3 anos** – lucro acumulado e saúde do solo da rotação × sem rotação, nos cenários normal, El Niño e La Niña, com calendário e resumo em texto.

## Etapas do desafio no EarthVision

| Etapa do desafio | Como o app atende |
|---|---|
| 1. Escolher a área de cultivo | Mapa, coordenadas ou locais de exemplo |
| 2. Ler condições ambientais com dados da NASA | NASA POWER (clima e umidade do solo MERRA-2) e MODIS NDVI |
| 3. Incluir solo e características da cultura | Textura do solo, cultura atual, irrigação, família botânica, demanda hídrica e faixa térmica |
| 4. Considerar prioridades do produtor | Pesos para água, solo e produção |
| 5. Explorar e comparar rotações | Três estratégias pontuadas com vantagens e riscos |
| 6. Comunicar a decisão | Relatório PDF com dados, riscos e fontes |

A página também tem a seção **Desafio**, que mostra essas etapas e os dados NASA usados.

## Dados da NASA

| Fonte | Variáveis | Uso |
|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) (comunidade AG) | T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M | Clima, chuva, radiação e dias de calor extremo (> 35 °C) |
| [MERRA-2 / GMAO](https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/) via POWER | GWETTOP, GWETROOT | Umidade do solo; ajusta a nota de água em ±15% |
| [NOAA CPC ONI](https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php) | Fase El Niño / La Niña por ano | Cenários do plano de 3 anos |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Cidades do mundo | Busca da fazenda |
| [MODIS Terra MOD13Q1 v061](https://lpdaac.usgs.gov/products/mod13q1v061/) via [API ORNL DAAC](https://modis.ornl.gov/data/modis_webservice.html) | NDVI 250 m, 16 dias | Ciclo da vegetação e solo exposto; risco e bônus de cobertura |

Nenhuma fonte exige credenciais. Próximos passos sugeridos (exigem login Earthdata): SMAP, GPM IMERG e HLS/Landsat.

## Dados e limites

O EarthVision consulta a API diária pública NASA POWER diretamente pelo navegador, sem credenciais. Usa o ano civil completo de 2025 e os parâmetros T2M (°C), PRECTOTCORR (mm/dia) e ALLSKY_SFC_SW_DWN (MJ/m²/dia), comunidade AG. A média anual utiliza os dias válidos e os totais de chuva exigem cobertura integral do período. A interface exibe o número de dias válidos.

A cópia histórica de Sorriso (MT) em `public/power-sorriso-2025.json` é a resposta original da NASA POWER. Ela é usada para o mesmo ponto quando a API falha, com a origem identificada. Outros locais exigem acesso à API. O mapa-base usa OpenStreetMap e requer internet. O perfil do talhão e a localização são salvos no navegador.

A comparação usa uma janela histórica de quatro meses, com retorno a janeiro quando cruza dezembro. A nota de água é 100 × chuva acumulada ÷ demanda indicativa, limitada a 100. A nota de solo soma 30 pontos de base, 22 por mudança de família botânica e 16, 20 ou 37 conforme a estratégia, com 10 adicionais para cobertura em solo arenoso. A nota de produção parte de 60 pontos, soma 34, 24 ou 8 conforme a finalidade e desconta 8 por grau fora da faixa indicativa da cultura. As notas são arredondadas, limitadas a 0–100 e ponderadas pela prioridade. Irrigação declarada modifica a interpretação do risco. A simulação não dispõe de volume de irrigação, produtividade, preços, umidade do solo, relevo ou dados de vegetação.

A pontuação é exploratória. Os valores de demanda hídrica orientam a comparação e não substituem dimensionamento de irrigação. Os parâmetros térmicos e pesos são escolhas de modelagem do MVP. A resolução é regional, portanto a seleção indica a grade de interesse e os valores não são medições do talhão.

## Fontes

- [Desafio Field Shift](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/). A descrição pede dados de observação da Terra da NASA, informações locais do solo, características das culturas e prioridades do produtor para explorar rotações. A aba Resources não abriu durante a implementação.
- [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
- [FAO | Necessidades hídricas das culturas](https://www.fao.org/4/s2022e/s2022e07.htm)
- [Embrapa | Água nas culturas de milho, sorgo e milheto](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1190579)
- [OpenStreetMap](https://www.openstreetmap.org/copyright)
