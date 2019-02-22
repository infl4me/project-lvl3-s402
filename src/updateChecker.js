import axios from 'axios';
import { format } from 'date-fns';
import parse, { getPubDate } from './xmlParser';
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
        const index = items.findIndex(item => getPubDate(item) === oldPubDate);
        const oldArticleIndex = index === -1 ? items.length : index;
        console.log('---------------------------------------------------------------------------------------------');
        console.log(oldArticleIndex, 'oldArticleIndex');
        const newArticles = items.slice(0, oldArticleIndex);
        newArticles.forEach(() => {
          articles.removeChild(articles.lastElementChild);
        });
        console.log(url, '<<<>>>', format(new Date(), 'HH:mm:ss'), '<<<>>>', status, statusText, '<<<>>>', `length ${newArticles.length}`);
        if (newArticles.length > 0) {
          const newPubDate = getPubDate(newArticles[0]);
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
