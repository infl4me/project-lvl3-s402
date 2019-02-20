import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';
import createFeedItem, { fillList } from './feed';

const { watch } = WatchJS;
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const parser = new DOMParser();

const app = () => {
  const state = {
    inputValue: '',
    form: 'init',
    loading: false,
    feeds: {},
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.loading = true;

    const changeState = (value, err) => {
      state.loading = false;
      if (err) {
        state.errors.counter += 1;
        state.errors.message = err;
        return;
      }
      const doc = parser.parseFromString(value, 'application/xml');
      if (doc.querySelector('parsererror')) {
        state.errors.counter += 1;
        state.errors.message = 'parse error';
        return;
      }
      const pubDate = doc.querySelector('item').querySelector('pubDate').textContent;
      const url = state.inputValue;
      state.feeds[url] = { pubDate };
      state.form = 'init';
      state.inputValue = '';
      state.feeds[url].xml = doc;
      state.currentUrl = url;
    };
    const url = `${corsProxy}${state.inputValue}`;
    axios.get(url, { timeout: 30000 })
      .then(({ data }) => changeState(data))
      .catch(({ message }) => changeState(null, `${message}`));
  });

  const checkUpdate = (url) => {
    const loop = () => {
      axios.get(`${corsProxy}${url}`, { timeout: 30000 })
        .then((res) => {
          const { data } = res;
          const doc = parser.parseFromString(data, 'application/xml');
          const item = doc.querySelector('item');
          const newPubDate = item.querySelector('pubDate').textContent;
          const { pubDate } = state.feeds[url];
          if (pubDate === newPubDate) {
            setTimeout(() => loop(url), 5000);
            return;
          }
          const newArticles = [item];
          let current = item;
          while (true) {
            current = current.nextElementSibling;
            if (current && current.matches('item')) {
              const currentPubDate = current.querySelector('pubDate').textContent;
              if (currentPubDate === pubDate) {
                break;
              }
              newArticles.push(current);
            } else {
              break;
            }
          }
          if (newArticles.length > 0) {
            const feed = document.querySelector(`[data-url="${url}"]`);
            const articles = feed.querySelector('.articles');
            fillList(articles, newArticles.reverse(), 'prepend');
          }
          state.feeds[url].pubDate = newPubDate;
          setTimeout(() => loop(url), 5000);
        });
    };
    setTimeout(loop, 5000);
  };

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
    checkUpdate(state.currentUrl);
  });

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
