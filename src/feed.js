import $ from 'jquery';
import 'bootstrap/js/dist/modal';

const descBtnHandler = (event) => {
  const descText = event.target.closest('li').querySelector('.desc').textContent;
  const descModalBody = document.querySelector('.modal-body');
  descModalBody.textContent = descText;
  $('#myModal').modal();
};

export const fillList = (articles, items, position = 'append') => {
  items.forEach(({ title, link: href, description }) => {
    const article = document.createElement('li');
    article.classList.add('list-group-item', 'mb-2');

    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.textContent = title;
    link.href = href;

    const descriptionContainer = document.createElement('div');
    descriptionContainer.classList.add('desc', 'd-none');
    descriptionContainer.textContent = description;

    const button = document.createElement('button');
    button.textContent = 'desc';
    button.classList.add('btn', 'btn-primary', 'btn-sm', 'ml-2');
    button.addEventListener('click', descBtnHandler);

    articles[position](article);

    article.append(link);
    article.append(descriptionContainer);
    article.append(button);
  });
};

const createFeedItem = (data) => {
  const feed = document.createElement('div');
  feed.classList.add('feed', 'mt-5');

  const feedHeading = document.createElement('h2');
  feedHeading.textContent = data.title;

  const feedDesc = document.createElement('p');
  feedDesc.textContent = data.description;

  const articles = document.createElement('ul');
  articles.classList.add('list-goup', 'articles');

  fillList(articles, data.articles);

  feed.append(feedHeading);
  feed.append(feedDesc);
  feed.append(articles);

  return feed;
};

export default createFeedItem;
