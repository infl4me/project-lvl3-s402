import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';
import { format, isAfter } from 'date-fns';
import parse from './xmlParser';
import createFeedItem, { fillList } from './feed';
// import testArticles from './testArticles';

const { watch } = WatchJS;
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const timeout = 5000;

const app = () => {
  const state = {
    inputValue: '',
    form: 'init',
    loading: false,
    feeds: [],
    errors: {
      counter: 0,
      message: '',
    },
  };

  const form = document.querySelector('.needs-validation');
  const input = document.getElementById('address');
  const button = document.querySelector('[type="submit"]');

  input.addEventListener('input', ({ target }) => {
    state.form = target.value === '' ? 'init' : 'process';
    state.inputValue = target.value;
  });

  const checkUpdate = (url, index) => {
    const proxyUrl = `${corsProxy}${url}`;

    const loop = () => {
      axios.get(proxyUrl)
        .then((res) => {
          console.log('---------------------------------------------------------------------------------------------');
          console.log(url, '<<<>>>', format(new Date(), 'HH:mm:ss'));
          const { pubDate: newPubDate, articles } = parse(res.data);
          const oldPubDate = state.feeds[index].pubDate;
          if (!isAfter(newPubDate, oldPubDate)) {
            console.log('NOT UPDATED!');
            console.log('---------------------------------------------------------------------------------------------');
            return;
          }
          console.log('UPDATED!');
          const newArticles = articles
            .filter(({ pubDate }) => isAfter(pubDate, oldPubDate))
            .reverse();
          console.log(`${newArticles.length} new articles, LOOP`);
          state.feeds[index].pubDate = newPubDate;
          state.feeds[index].articles = newArticles;
        })
        .finally(() => setTimeout(loop, timeout));
    };

    setTimeout(loop, timeout);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.loading = true;

    const changeState = (value, err) => {
      state.loading = false;
      if (err) {
        state.errors.message = err;
        state.errors.counter += 1;
        return;
      }
      const data = parse(value);
      const url = state.inputValue;
      state.form = 'init';
      state.inputValue = '';
      const feedIndex = state.feeds.push(data) - 1;
      state.feeds[feedIndex].url = url;
      state.feeds[feedIndex].index = feedIndex;
      checkUpdate(url, feedIndex);
    };

    const url = `${corsProxy}${state.inputValue}`;
    axios.get(url, { timeout: 30000 })
      .then(({ data }) => changeState(data))
      .catch(({ message }) => changeState(null, `${message}`));
  });

  watch(state.errors, 'counter', () => {
    const alert = document.querySelector('.alert-danger');
    const { message } = state.errors;
    alert.textContent = message;
    alert.classList.add('show');
    setTimeout(() => {
      alert.classList.remove('show');
      alert.textContent = '';
    }, 3000);
  });

  watch(state, 'loading', () => {
    if (state.loading) {
      button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Loading...`;
      button.disabled = true;
    } else {
      button.innerHTML = 'Submit';
      button.disabled = false;
    }
  });

  const feeds = document.querySelector('.feeds');

  watch(state, 'feeds', function cb(prop, action) {
    if (action === 'set' && prop !== 'pubDate') {
      return;
    }
    if (action === 'push') {
      const feed = createFeedItem(state.feeds[prop]);
      feeds.prepend(feed);
      return;
    }
    const { index, articles: newArticles } = this;
    console.log(`${newArticles.length} length <<<>>> ${format(new Date(), 'HH:mm:ss')} <<>> WATCHER`);
    const reversedIndex = state.feeds.length - 1 - index;
    console.log(
      'index', index,
      'reversed', reversedIndex,
      'maxsize', state.feeds.length,
    );
    const articles = feeds.children[reversedIndex].querySelector('.articles');
    fillList(articles, newArticles, 'prepend');
    newArticles.forEach(() => {
      articles.removeChild(articles.lastElementChild);
    });
  });

  watch(state, 'inputValue', () => {
    const url = state.inputValue;
    if (isURL(url) && !state.feeds.some(feed => url === feed.url)) {
      button.disabled = false;
      input.setCustomValidity('');
    } else {
      button.disabled = true;
      input.setCustomValidity('invalid');
    }
  });

  const formStateActions = {
    init: () => {
      form.classList.remove('was-validated');
      input.value = '';
    },
    process: () => {
      form.classList.add('was-validated');
    },
  };
  watch(state, 'form', () => {
    formStateActions[state.form]();
  });
  // setInterval(testArticles, 5000);
};

app();
