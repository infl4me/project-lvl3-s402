const parser = new DOMParser();

export const getPubDate = (element) => {
  const item = element.nodeName === '#document' ? element.querySelector('item') : element;
  if (!item) {
    return null;
  }
  const pubDate = item.querySelector('pubDate').textContent;
  return pubDate;
};

export default (data) => {
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Parse ERROR');
  }
  return doc;
};
