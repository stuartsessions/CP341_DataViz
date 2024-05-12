import { tooltip, colorscale } from './setup.js';

//******HIGHLIGHTING and TOOLTIP******
export function highlightMarks(id) {
  // Select everything with this id (polygon and dot), and set the fill
  // color for both
  d3.selectAll(`#${id}`)
    .attr('fill', 'red')
    .style('opacity', 1);
}

export function resetMarks(id, allStateData) {
  d3.selectAll(`#${id}`).attr('fill', (d) =>
    colorscale(
      allStateData.get(d.properties.State).toilets.length,
    ),
  );
}

export function popUpTooltip(event, data, allStateData) {
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

export function adjustTooltip(event) {
  tooltip
    .style('left', event.x - 80 + 'px')
    .style('top', event.y - 80 + 'px');
}

export function hideTooltip() {
  tooltip.style('opacity', 0).style('z-index', -1);
}
