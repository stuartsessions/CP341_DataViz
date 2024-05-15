(function () {
  'use strict';

  //This function normalizes data. Right now, it sets 'name' equal to the filtered version
  // and leaves 'STATE_NAME' as the visual version
  function normalizeStateName(s) {
    if (s == undefined) {
      return undefined;
    }
    return s.replaceAll(' ', '_').toLowerCase();
  }

  function parseTownData(townData) {
    const regEx1 = /_local_2/;
    const regEx2 = /_loca_2/;
    var exp;
    console.log(townData.features[0].properties);
    Object.keys(townData.features[0].properties).forEach(
      function (d) {
        const property1 = regEx1.exec(d);
        const property2 = regEx2.exec(d);
        if (property1 != undefined) {
          exp = property1.input;
        } else if (property2 != undefined) {
          exp = property2.input;
        }
      },
    );
    console.log(exp);
    townData.features.forEach((f) => {
      f.properties.Town = normalizeStateName(
        f.properties[exp],
      );
    });
    return townData;
  }
  function getTownData(data) {
    const townData = new Map();
    data.forEach((row) => {
      //if (initialToMapNames.has(row.State)) {
      // }
      // Cleaning specific columns of my data
      // Each row is an object with attributes corresponding to the columns,
      // so I am going to overwrite the values for some of the attributes
      // to be the correct type/format
      //Set stateData map to contain
      if (!townData.has(row.Town)) {
        townData.set(row.Town, { toilets: [] });
      }
      townData.get(row.Town).toilets.push(row);
    });
    return townData;
  }

  function parseMapData(mapData) {
    mapData.features.forEach((f) => {
      f.properties.State = normalizeStateName(
        f.properties.STATE_NAME,
      );
    });
    return mapData;
  }

  //Function to create COUNTRYDATA, which will be used as a map for
  //running the main render with colors.
  function parseStateData(csvData) {
    var stateData = new Map();
    var initialToMapNames = new Map([
      ['WA', 'Western Australia'],
      ['QLD', 'Queensland'],
      ['ACT', 'Australian Capital Territory'],
      ['VIC', 'Victoria'],
      ['NT', 'Northern Territory'],
      ['TAS', 'Tasmania'],
      ['SA', 'South Australia'],
      ['NSW', 'New South Wales'],
    ]);
    csvData.forEach((row) => {
      //if (initialToMapNames.has(row.State)) {
      row.STATE_NAME = initialToMapNames.get(row.State);
      row.State = normalizeStateName(row.STATE_NAME);
      // }
      // Cleaning specific columns of my data
      // Each row is an object with attributes corresponding to the columns,
      // so I am going to overwrite the values for some of the attributes
      // to be the correct type/format
      row.Town_orig = row.Town;
      row.Town = normalizeStateName(row.Town);

      //Set stateData map to contain
      if (!stateData.has(row.State)) {
        stateData.set(row.State, { toilets: [] });
      }
      stateData.get(row.State).toilets.push(row);
    });
    //console.log(stateData);
    return stateData;
  }

  const width = 900;
  const height = 500;
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

  const tooltip = d3v6
    .select('#myMap')
    .append('div')
    .attr('id', 'tooltip');

  const colorscale = d3v6.scaleLinear();

  const stateToMapURL = new Map([
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

  //******HIGHLIGHTING and TOOLTIP******
  function highlightMarks(id) {
    // Select everything with this id (polygon and dot), and set the fill
    // color for both
    d3v6.selectAll(`#${id}`)
      .attr('fill', 'red')
      .style('opacity', 1);
  }

  function resetMarks(id, allStateData) {
    colorscale
      .domain(
        d3v6.extent(
          Array.from(
            allStateData.values(),
            (d) => d.toilets.length,
          ),
        ),
      )
      .range(['white', 'blue']);

    d3v6.selectAll(`#${id}`).attr('fill', (d) =>
      colorscale(
        allStateData.get(d.properties.State).toilets.length,
      ),
    );
  }

  function popUpTooltip(event, data, allStateData) {
    tooltip
      .style('opacity', 1)
      .style('z-index', 10)
      .html(
        `${data.properties.STATE_NAME} <br/> Toilets: ${
        allStateData.get(data.properties.State).toilets
          .length
      }`,
      );
  }

  function adjustTooltip(event) {
    tooltip
      .style('left', event.x - 80 + 'px')
      .style('top', event.y - 80 + 'px');
  }

  function hideTooltip() {
    tooltip.style('opacity', 0).style('z-index', -1);
  }

  /*
   */
  //ISSUE: Background counts as being clicked even if something on svg event is clicked,
  // causing the map to not actually change.

  var allStateData;
  var pointData = [];

  function render(mapData, csvData) {
    const zoom = d3v6
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', zoomed);
    
    const svg = d3v6.select('#myMap')
      .append('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('class', 'parent')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'max-width: 100%; height: auto;')
      .on('click', reset);
    var projection = d3v6
      .geoMercator()
      .fitSize([width, height], mapData);
    var path = d3v6.geoPath(projection);

    colorscale
      .domain(
        d3v6.extent(
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
        clicked(event, data);
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
          d3v6.extent(
            Array.from(
              townData.values(),
              (d) => d.toilets.length,
            ),
          ),
        )
        .range(['white', 'blue']);
      console.log(newURL);
      d3v6.json(newURL).then((data) => {
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

        //Issue is here, seems that stateMarks gets overwritten
        // and loses pointer functionality
      });
    }

    //-----Functions handling zoom in and out-----
    function reset() {
      stateMarks.transition().style('fill', null);
      stateMarks.transition();
      d3v6.selectAll('.subgraph').remove();
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3v6.zoomIdentity,
          d3v6
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
          d3v6.zoomIdentity
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
          d3v6.pointer(event, svg.node()),
        );
    }

    d3v6.select('#toggleToilets').on('click', () => {
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
  Promise.all([d3v6.json(ausURL), d3v6.csv(dataURL)]).then(
    ([mapData, csvData]) => {
      //console.log(csvData);
      //console.log(mapData);
      allStateData = parseStateData(csvData);
      mapData = parseMapData(mapData);
      //console.log(mapData);
      render(mapData);
    },
  );

})();
