import 'bootstrap/js/dist/modal';

const descBtnHandler = (event) => {
  const descText = event.target.closest('li').querySelector('.desc').textContent;
  const descModalBody = document.querySelector('.modal-body');
  descModalBody.textContent = descText;
  $('#myModal').modal();
};

export const fillList = (articles, items, position = 'append') => {
  console.log(items.length, 'ITEMS ADDED');
  console.log('---------------------------------------------------------------------------------------------');
  items.forEach((item) => {
    const article = document.createElement('li');
    article.classList.add('list-group-item', 'mb-2');

    const link = document.createElement('a');
    link.setAttribute('target', '_blank');

    const description = document.createElement('div');
    description.classList.add('desc', 'd-none');

    const button = document.createElement('button');
    button.textContent = 'desc';
    button.classList.add('btn', 'btn-primary', 'btn-sm', 'ml-2');
    button.addEventListener('click', descBtnHandler);

    const map = {
      title: [link, 'textContent'],
      link: [link, 'href'],
      description: [description, 'textContent'],
    };
    [...item.children]
      .filter(({ nodeName }) => map[nodeName] !== undefined)
      .forEach(({ nodeName, textContent }) => {
        const [element, property] = map[nodeName];
        element[property] = textContent;
      });
    articles[position](article);

    article.append(link);
    article.append(description);
    article.append(button);
  });
};

const createFeedItem = (doc) => {
  const feed = document.createElement('div');
  feed.classList.add('feed', 'mt-5');

  const feedHeading = document.createElement('h2');
  const feedDesc = document.createElement('p');

  const articles = document.createElement('ul');
  articles.classList.add('list-goup', 'articles');

  const channel = doc.querySelector('channel');

  const map = {
    title: feedHeading,
    description: feedDesc,
  };
  [...channel.children]
    .filter(({ nodeName }) => map[nodeName] !== undefined)
    .forEach(({ nodeName, textContent }) => {
      map[nodeName].textContent = textContent;
    });

  const items = doc.querySelectorAll('item');
  fillList(articles, items);

  feed.append(feedHeading);
  feed.append(feedDesc);
  feed.append(articles);

  return feed;
};

export default createFeedItem;
