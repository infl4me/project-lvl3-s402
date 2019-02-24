const parser = new DOMParser();

export default (data) => {
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Parse ERROR');
  }
  const extract = nodes => (
    nodes.reduce((acc, node) => ({ ...acc, [node.nodeName]: node.textContent }), {})
  );
  const channel = doc.querySelector('channel');
  const channelData = extract(
    [...channel.children].filter(node => node.nodeName !== 'item'),
  );
  const articles = [...doc.querySelectorAll('item')]
    .map(node => extract([...node.childNodes]));
  const { pubDate } = articles[0];
  return ({ ...channelData, pubDate, articles });
};
