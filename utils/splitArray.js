module.exports.splitArray = (map, len = 10) => {
  let mappedMap = [];
  while (map.length) {
    const partialMap = map.splice(0, len);
    mappedMap.push(partialMap);
  }
  return mappedMap;
};
