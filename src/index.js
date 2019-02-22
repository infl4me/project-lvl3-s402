import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';
import { format } from 'date-fns';
import parse, { getPubDate } from './xmlParser';
import createFeedItem, { fillList } from './feed';
// import checkUpdate from './updateChecker';

const { watch } = WatchJS;
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const timeout = 5000;

const app = () => {
  const state = {
    inputValue: '',
    form: 'init',
    loading: false,
    feeds: {},
    updatedXml: {},
    errors: {
      counter: 0,
      message: '',
    },
    currentUrl: '',
  };

  const form = document.querySelector('.needs-validation');
  const input = document.getElementById('address');
  const button = document.querySelector('[type="submit"]');
  input.addEventListener('input', ({ target }) => {
    state.form = target.value === '' ? 'init' : 'process';
    state.inputValue = target.value;
  });

  const checkUpdate = (url) => {
    const proxyUrl = `${corsProxy}${url}`;

    const loop = () => {
      axios.get(proxyUrl)
        .then(({ data }) => {
          const xml = parse(data);
          const newPubDate = getPubDate(xml);
          const oldPubDate = state.feeds[url].pubDate;
          console.log('---------------------------------------------------------------------------------------------');
          console.log(url, '<<<>>>', format(new Date(), 'HH:mm:ss'));
          if (newPubDate !== oldPubDate) {
            console.log('UPDATED!');
            state.updatedXml[url] = { xml, oldPubDate };
            state.feeds[url].pubDate = newPubDate;
          } else {
            console.log('NOT UPDATED');
            console.log('---------------------------------------------------------------------------------------------');
          }
        })
        .finally(() => setTimeout(loop, timeout));
    };

    setTimeout(loop, timeout);
  };

  form.addEventListener('submit', (e) => {
    console.log(format(new Date(), 'HH:mm:ss'));
    e.preventDefault();
    state.loading = true;

    const changeState = (value, err) => {
      state.loading = false;
      if (err) {
        state.errors.counter += 1;
        state.errors.message = err;
        return;
      }
      const doc = parse(value);
      const pubDate = getPubDate(doc);
      const url = state.inputValue;
      state.feeds[url] = { pubDate };
      state.form = 'init';
      state.inputValue = '';
      state.feeds[url].xml = doc;
      state.currentUrl = url;
      checkUpdate(url);
    };
    const url = `${corsProxy}${state.inputValue}`;
    axios.get(url, { timeout: 30000 })
      .then(({ data }) => changeState(data))
      .catch(({ message }) => changeState(null, `${message}`));
  });

  watch(state, 'errors', () => {
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

  watch(state, 'currentUrl', () => {
    const url = state.currentUrl;
    const feed = createFeedItem(state.feeds[url].xml);
    feed.setAttribute('data-url', url);
    feeds.prepend(feed);
    // checkUpdate(url, state.feeds[url].pubDate, feed);
  });

  watch(state.updatedXml, (url) => {
    // console.log(typeof url, '!!!!!!!')
    if (url === 'root') return;
    const { xml, oldPubDate } = state.updatedXml[url];
    console.log('update for ' + url);
    console.log(state.updatedXml);
    const items = [...xml.querySelectorAll('item')];
    const articles = document.querySelector(`[data-url="${url}"]`).querySelector('.articles');
    const index = items.findIndex(item => getPubDate(item) === oldPubDate);
    const oldArticleIndex = index === -1 ? items.length : index;
    console.log(oldArticleIndex, 'oldArticleIndex');
    const newArticles = items.slice(0, oldArticleIndex);
    newArticles.forEach(() => {
      articles.removeChild(articles.lastElementChild);
    });
    console.log(url, '<<<>>>', oldPubDate, '<<<>>>', `length ${newArticles.length}`);
    fillList(articles, newArticles.reverse(), 'prepend'); // Careful: reverse is destructive. It also changes the original array...
  }, 10, true);

  watch(state, 'inputValue', () => {
    if (isURL(state.inputValue) && !state.feeds[state.inputValue]) {
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
};

app();
