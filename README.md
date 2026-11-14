# EarthVision

EarthVision helps farmers compare crop rotations using NASA Earth observation data, local field information, and their priorities. It was built for **Field Shift: Adapting Farms with NASA Data** at the NASA Space Apps Challenge 2026.

## Run locally

Use Node.js 22.12 or newer. In Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Open http://127.0.0.1:5173. The production build is in `dist/`; serve it locally with `npm.cmd run preview`.

## Plan a rotation

1. Search for a city, use your device location, or select a point on the map.
2. Choose a historical year from 2020 to 2025. Review regional risks, monthly climate, and ENSO context.
3. Enter your current crop, planting month, soil type, field area, market access, equipment, irrigation, and priority.
4. Compare the current practice with up to three eligible alternatives. Review water, soil, climate, and profit scores and adjust financial assumptions.
5. Review the three-year plan and export a PDF with the evidence, assumptions, risks, and source links.

## Data and interpretation

- [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) provides regional historical weather and MERRA-2 soil moisture. A saved 2025 response for Sorriso is available when the live request fails near the example location.
- [MODIS Terra](https://lpdaac.usgs.gov/products/mod13q1v061/) provides vegetation greenness. [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) provides terrain elevation used to estimate slope.
- [NOAA's Oceanic Niño Index](https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php) informs the ENSO scenarios.
- [Open-Meteo](https://open-meteo.com/en/docs/geocoding-api) provides city search. [OpenStreetMap](https://www.openstreetmap.org/copyright) provides the basemap.
- [FAO](https://www.fao.org/4/s2022e/s2022e07.htm) and [Embrapa](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1190579) provide technical references for crop water requirements.

The interface and PDF display temperatures in Fahrenheit. The calculations use the original Celsius values supplied by NASA POWER. Rainfall remains in millimeters, area in hectares, and monetary estimates in Brazilian reais (BRL).

The planting windows and default financial values are indicative for Brazil. The three-year plan and climate scenarios are illustrative. Review the assumptions, crop choices, and field-specific risks with an agronomist.

English (US) is the default. Use the language selector in the header to switch to Portuguese (Brazil). The browser remembers your choice, and the exported report uses the selected language.
