const parser = new DOMParser();

export default (data) => {
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Parse ERROR');
  }
  const channel = [...doc.querySelector('channel').childNodes];
  const extract = nodes => (
    nodes
      .map(v => ({ [v.nodeName]: v.textContent }))
      .reduce((acc, v) => ({ ...acc, ...v }), {})
  );
  const feed = extract(channel.filter(v => v.nodeName !== 'item'));
  const articles = channel.filter(v => v.nodeName === 'item').map(v => extract([...v.childNodes]));
  const { pubDate } = articles[0];
  return ({ ...feed, pubDate, articles });
};
