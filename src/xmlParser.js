const parser = new DOMParser();

export default (data) => {
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Parse ERROR');
  }
  const result = {
    articles: [],
  };
  const channel = doc.querySelector('channel');

  const map = {
    title: true,
    description: true,
  };
  [...channel.children]
    .filter(({ nodeName }) => map[nodeName] !== undefined)
    .forEach(({ nodeName, textContent }) => {
      result[nodeName] = textContent;
    });
  const articles = doc.querySelectorAll('item');

  result.pubDate = articles[0].querySelector('pubDate').textContent;

  articles.forEach((article) => {
    const articleData = {};
    const map2 = {
      title: true,
      link: true,
      description: true,
      pubDate: true,
    };
    [...article.children]
      .filter(({ nodeName }) => map2[nodeName] !== undefined)
      .forEach(({ nodeName, textContent }) => {
        articleData[nodeName] = textContent;
      });
    result.articles.push(articleData);
  });

  return result;
};
