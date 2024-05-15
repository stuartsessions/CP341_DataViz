//This function normalizes data. Right now, it sets 'name' equal to the filtered version
// and leaves 'STATE_NAME' as the visual version
function normalizeStateName(s) {
  if (s == undefined) {
    return undefined;
  }
  return s.replaceAll(' ', '_').toLowerCase();
}

export function parseTownData(townData) {
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
export function getTownData(data) {
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

export function parseMapData(mapData) {
  mapData.features.forEach((f) => {
    f.properties.State = normalizeStateName(
      f.properties.STATE_NAME,
    );
  });
  return mapData;
}

//Function to create COUNTRYDATA, which will be used as a map for
//running the main render with colors.
export function parseStateData(csvData) {
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
