const capitals = [
  { lat: -15.7939, lon: -47.8828, en: 'Brasília, Brazil', pt: 'Brasília, Brasil' },
  { lat: 38.9072, lon: -77.0369, en: 'Washington, D.C., United States', pt: 'Washington, D.C., Estados Unidos' },
  { lat: 38.7223, lon: -9.1393, en: 'Lisbon, Portugal', pt: 'Lisboa, Portugal' },
  { lat: -1.2921, lon: 36.8219, en: 'Nairobi, Kenya', pt: 'Nairóbi, Quênia' },
  { lat: 35.6762, lon: 139.6503, en: 'Tokyo, Japan', pt: 'Tóquio, Japão' },
  { lat: -35.2809, lon: 149.1300, en: 'Canberra, Australia', pt: 'Camberra, Austrália' },
]

export function capitalExamples(language: 'en' | 'pt') {
  return capitals.map(({ lat, lon, ...names }) => ({ lat, lon, name: names[language] }))
}

export const bundledLocation = { name: 'Sorriso, MT', lat: -12.55, lon: -55.71 }
