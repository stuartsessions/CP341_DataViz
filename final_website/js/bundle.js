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
    console.log(stateData);
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
  const tooltip = d3
    .select('#myMap')
    .append('div')
    .attr('id', 'tooltip');

  const colorscale = d3.scaleLinear();

  //******HIGHLIGHTING and TOOLTIP******
  function highlightMarks(id) {
    // Select everything with this id (polygon and dot), and set the fill
    // color for both
    d3.selectAll(`#${id}`)
      .attr('fill', 'red')
      .style('opacity', 1);
  }

  function resetMarks(id, allStateData) {
    d3.selectAll(`#${id}`).attr('fill', (d) =>
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

    const g = svg.append('g');

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
      });
    /*
      .on('click', function (event, data) {
        loadSubMap(event, data);
      });
  */

    svg
      .selectAll('circle')
      .data(allStateData.values().toilets)
      .join('circle')
      .attr('fill', 'red')
      .attr('cr', 0.5)
      .attr('cx', (d) => path([+d.Latitude, +d.Longitude])[0])
      .attr(
        'cy',
        (d) => path([+d.Latitude, +d.Longitude])[1],
      );

    svg.call(zoom);
    //Zoom functionality here

    function reset() {
      stateMarks.transition().style('fill', null);
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
    function clicked(event, d) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      stateMarks.transition().style('fill', null);
      //d3.select(this).transition().style('fill', 'red');
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

    function zoomed(event) {
      const { transform } = event; //equal to const transform = event.tranform
      g.attr('transform', transform);
      g.attr('stroke-width', 1 / transform.k);
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
      console.log(csvData);
      console.log(mapData);
      allStateData = parseStateData(csvData);
      mapData = parseMapData(mapData);
      console.log(mapData);
      render(mapData);
    },
  );

})();
