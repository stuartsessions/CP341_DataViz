import {
  parseMapData,
  parseStateData,
  parseTownData,
  getTownData,
} from './dataProcessing.js';

import {
  //svg,
  width,
  height,
  margin,
  colorscale,
  stateToMapURL,
} from './setup.js';

import {
  highlightMarks,
  resetMarks,
  popUpTooltip,
  adjustTooltip,
  hideTooltip,
} from './events.js';

/*
 */
//ISSUE: Background counts as being clicked even if something on svg event is clicked,
// causing the map to not actually change.

var allStateData;
var pointData = [];

function render(mapData, csvData) {
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed);

  const svg = d3
    .select('#myMap')
    .append('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('class', 'parent')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'max-width: 100%; height: auto;')
    .on('click', reset);
  var projection = d3
    .geoMercator()
    .fitSize([width, height], mapData);
  var path = d3.geoPath(projection);

  colorscale
    .domain(
      d3.extent(
        Array.from(
          allStateData.values(),
          (d) => d.toilets.length,
        ),
      ),
    )
    .range(['white', 'blue']);
  //Normalize Map Data

  var g = svg.append('g');

  var stateMarks = g
    .selectAll('path')
    .data(mapData.features)
    .join('path')
    .attr('fill', (d) =>
      colorscale(
        allStateData.get(d.properties.State).toilets.length,
      ),
    )
    .attr('id', (d) => `SC${d.id}`)
    .attr('d', (data) => path(data));

  //Add action listeners
  stateMarks
    .on('mouseover', function (event, data) {
      highlightMarks(this.id);
      popUpTooltip(event, data, allStateData);
      //orig_data.features.filter((d) => d.id == data.id)
    })
    .on('mousemove', function (event, data) {
      adjustTooltip(event);
    })
    .on('mouseleave', function (event, data) {
      resetMarks(this.id, allStateData);
      hideTooltip();
    })
    .on('click', function (event, data) {
      clicked(event, data, this);
      loadSubMap(event, data, path);
    });
  /*
    .on('click', function (event, data) {
      loadSubMap(event, data);
    });
*/
  //put circles on screen for the individual toilets

  //get all toilets into an array.

  /*
  
*/
  svg.call(zoom);
  //Zoom functionality here

  function loadSubMap(event, d, path) {
    const newURL = stateToMapURL.get(d.properties.State); //Use STATE_NAME to get parsed name
    const townData = getTownData(
      allStateData.get(d.properties.State).toilets,
    );
    colorscale
      .domain(
        d3.extent(
          Array.from(
            townData.values(),
            (d) => d.toilets.length,
          ),
        ),
      )
      .range(['white', 'blue']);
    console.log(newURL);
    d3.json(newURL).then((data) => {
      console.log(data);
      const tData = parseTownData(data);
      console.log(tData);
      stateMarks
        .append('path')
        .data(tData.features)
        .join('path')
        .classed('subgraph', true)
        .attr('fill', (d) => {
          if (
            townData.get(d.properties.Town) != undefined
          ) {
            return colorscale(
              townData.get(d.properties.Town).toilets
                .length,
            );
          } else {
            //console.log(d.properties.Town);
            return 'white';
          }
        })
        .attr('id', (d) => `${d.id.replaceAll('.', '_')}`)
        .attr('d', path);

      stateMarks;

      //Issue is here, seems that stateMarks gets overwritten
      // and loses pointer functionality
    });
  }

  //-----Functions handling zoom in and out-----
  function reset() {
    stateMarks.transition().style('fill', null);
    stateMarks.transition();
    d3.selectAll('.subgraph').remove();
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity,
        d3
          .zoomTransform(svg.node())
          .invert([width / 2, height / 2]),
      );
  }
  function clicked(event, d, that) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    stateMarks.transition().style('fill', null);
    //d3.select(that).transition().attr('fill', 'grey');
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(
              8,
              0.9 /
                Math.max(
                  (x1 - x0) / width,
                  (y1 - y0) / height,
                ),
            ),
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node()),
      );
  }

  d3.select('#toggleToilets').on('click', () => {
    toggleToiletPoints();
  });
  //d3.select('#townInput').on('');

  function zoomed(event) {
    const { transform } = event; //equal to const transform = event.tranform
    g.attr('transform', transform);
    g.attr('stroke-width', 1 / transform.k);
  }

  function toggleToiletPoints() {
    if (pointData.length === 0) {
      return loadToiletPoints();
    } else {
      return removeToiletPoints();
    }
  }

  //--> Creating circles of individual toilets <--
  function loadToiletPoints() {
    allStateData
      .values()
      .forEach(function getToilets(value) {
        pointData = pointData.concat(value.toilets);
      });

    const toiletPoints = g
      .selectAll('circle.point')
      .data(pointData)
      .join('circle')
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('z-index', 3)
      .attr('r', 0.5)
      .attr('opacity', '0.5')
      .attr('transform', function (d) {
        return (
          'translate(' +
          projection([+d.Longitude, +d.Latitude]) +
          ')'
        );
      });
    toiletPoints.append('title').text((d) => d.Name);
  }
  function removeToiletPoints() {
    g.selectAll('circle').remove();
    pointData = [];
  }
}

//Data Reading
const ausURL =
  'https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson';
const dataURL =
  'https://raw.githubusercontent.com/stuartsessions/CP341_DataViz/main/toilets/34076296-6692-4e30-b627-67b7c4eb1027.csv';
//Gives files, then jump up to render
Promise.all([d3.json(ausURL), d3.csv(dataURL)]).then(
  ([mapData, csvData]) => {
    //console.log(csvData);
    //console.log(mapData);
    allStateData = parseStateData(csvData);
    mapData = parseMapData(mapData);
    //console.log(mapData);
    render(mapData, csvData);
  },
);
