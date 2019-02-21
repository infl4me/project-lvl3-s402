const parser = new DOMParser();

export default (data) => {
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Parse ERROR');
  }

  return doc;
};
