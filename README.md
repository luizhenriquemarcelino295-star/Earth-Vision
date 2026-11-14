# EarthVision

Inteligência espacial para decisões agrícolas. MVP do desafio Field Shift do NASA Space Apps Challenge 2026.

## Executar no Windows

Requer Node.js 22.12+ ou 24. No PowerShell:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abra http://127.0.0.1:5173. O build estático fica em `dist/`. Também é possível servi-lo com `npm.cmd run preview`. O projeto usa React, TypeScript, Vite, Leaflet, Recharts e jsPDF.

## Fluxo de demonstração

1. Escolha um local de exemplo, clique no mapa ou aplique coordenadas.
2. Consulte as séries mensais e os indicadores históricos.
3. Informe a cultura atual, a textura do solo, a janela e a prioridade.
4. Leia vantagens e riscos das três estratégias e exporte o relatório em PDF.

## Dados e limites

O EarthVision consulta a API diária pública NASA POWER diretamente pelo navegador, sem credenciais. Usa o ano civil completo de 2025 e os parâmetros T2M (°C), PRECTOTCORR (mm/dia) e ALLSKY_SFC_SW_DWN (MJ/m²/dia), comunidade AG. A média anual utiliza os dias válidos e os totais de chuva exigem cobertura integral do período. A interface exibe o número de dias válidos.

A cópia histórica de Sorriso (MT) em `public/power-sorriso-2025.json` é a resposta original da NASA POWER. Ela é usada para o mesmo ponto quando a API falha, com a origem identificada. Outros locais exigem acesso à API. O mapa-base usa OpenStreetMap e requer internet. O perfil do talhão e a localização são salvos no navegador.

A comparação usa uma janela histórica de quatro meses, com retorno a janeiro quando cruza dezembro. A nota de água é 100 × chuva acumulada ÷ demanda indicativa, limitada a 100. A nota de solo soma 30 pontos de base, 22 por mudança de família botânica e 16, 20 ou 37 conforme a estratégia, com 10 adicionais para cobertura em solo arenoso. A nota de produção parte de 60 pontos, soma 34, 24 ou 8 conforme a finalidade e desconta 8 por grau fora da faixa indicativa da cultura. As notas são arredondadas, limitadas a 0–100 e ponderadas pela prioridade. Irrigação declarada modifica a interpretação do risco. A simulação não dispõe de volume de irrigação, produtividade, preços, umidade do solo, relevo ou dados de vegetação.

A pontuação é exploratória. Os valores de demanda hídrica orientam a comparação e não substituem dimensionamento de irrigação. Os parâmetros térmicos e pesos são escolhas de modelagem do MVP. A resolução é regional, portanto a seleção indica a grade de interesse e os valores não são medições do talhão.

## Fontes

- [Desafio Field Shift](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). A descrição pede dados de observação da Terra da NASA, informações locais do solo, características das culturas e prioridades do produtor para explorar rotações. A aba Resources não abriu durante a implementação.
- [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
- [FAO | Necessidades hídricas das culturas](https://www.fao.org/4/s2022e/s2022e07.htm)
- [Embrapa | Água nas culturas de milho, sorgo e milheto](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1190579)
- [OpenStreetMap](https://www.openstreetmap.org/copyright)
