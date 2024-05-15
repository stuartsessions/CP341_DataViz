export const width = 900;
export const height = 500;

export const margin = 60;
/*
export const svg = d3
  .select('#myMap')
  .append('svg')
  .attr('viewBox', [0, 0, width, height])
  .attr('class', 'parent')
  .attr('width', width)
  .attr('height', height)
  .attr("style", "max-width: 100%; height: auto;")
      .on("click", reset);;
*/
export const tooltip = d3
  .select('#myMap')
  .append('div')
  .attr('id', 'tooltip');

export const colorscale = d3.scaleLinear();

export const stateToMapURL = new Map([
  [
    'australian_capital_territory',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-act.geojson',
  ],
  [
    'new_south_wales',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-nsw.geojson',
  ],
  [
    'northern_territory',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-nt.geojson',
  ],
  [
    'queensland',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-qld.geojson',
  ],
  [
    'south_australia',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-sa.geojson',
  ],
  [
    'tasmania',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-tas.geojson',
  ],
  [
    'victoria',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-vic.geojson',
  ],
  [
    'western_australia',
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/suburb-10-wa.geojson',
  ],
]);
