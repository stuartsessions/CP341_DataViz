function getData() {
  d3.queue().defer(
    d3.json,
    'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json',
  );
}
