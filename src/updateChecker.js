import axios from 'axios';
import { format } from 'date-fns';
import parse from './xmlParser';
import { fillList } from './feed';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const timeout = 5000;

export default (url, pubDate, feed) => {
  let oldPubDate = pubDate;
  const articles = feed.querySelector('.articles');
  const loop = () => {
    axios.get(`${corsProxy}${url}`)
      .then((res) => {
        const { data, status, statusText } = res;
        const doc = parse(data);
        const items = [...doc.querySelectorAll('item')];
        const index = items.findIndex(item => item.querySelector('pubDate').textContent === oldPubDate);
        const oldArticleIndex = index === -1 ? items.length : index;
        console.log('---------------------------------------------------------------------------------------------');
        console.log(oldArticleIndex, 'oldArticleIndex');
        const newArticles = items.slice(0, oldArticleIndex);
        newArticles.forEach(() => {
          articles.removeChild(articles.lastElementChild);
        });
        console.log(url, '<<<>>>', format(new Date(), 'HH:mm:ss'), '<<<>>>', status, statusText, '<<<>>>', `length ${newArticles.length}`);
        if (newArticles.length > 0) {
          const newPubDate = newArticles[0].querySelector('pubDate').textContent;
          fillList(articles, newArticles.reverse(), 'prepend'); // Careful: reverse is destructive. It also changes the original array...
          oldPubDate = newPubDate;
        }
        setTimeout(loop, timeout);
      })
      .catch(({ message }) => {
        console.log(url, '<<<>>>', format(new Date(), 'HH:mm:ss'), '<<<>>>', message);
        setTimeout(loop, timeout);
      });
  };

  setTimeout(loop, timeout);
};
