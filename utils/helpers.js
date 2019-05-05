// @flow
  
  export const hashCode = (str) => {
    return str
      .split('')
      .reduce(
        (prevHash, currVal) =>
          ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
        0,
      );
  };
  
  export const deepCopyBeaconsLists = (beaconsLists) => {
    const initial = {};
    return Object.keys(beaconsLists)
      .map(key => ({ [key]: [...beaconsLists[key]] }))
      .reduce((prev, next) => {
        return { ...prev, ...next };
      }, initial);
  };