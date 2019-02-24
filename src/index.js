import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';
import { isAfter } from 'date-fns';
import parse from './xmlParser';
import createFeedItem, { fillList } from './feed';

const { watch } = WatchJS;
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const timeout = 5000;

const app = () => {
  const state = {
    inputValue: '',
    formState: 'init',
    feeds: [],
    updatedFeedIndex: [],
    error: [],
  };

  const form = document.querySelector('.needs-validation');
  const input = document.getElementById('address');
  const button = document.querySelector('[type="submit"]');

  input.addEventListener('input', ({ target }) => {
    state.formState = target.value === '' ? 'init' : 'process';
    state.inputValue = target.value;
  });

  const checkUpdate = (url, index) => {
    const proxyUrl = `${corsProxy}${url}`;

    const loop = () => {
      axios.get(proxyUrl)
        .then((res) => {
          const { pubDate: newPubDate, articles } = parse(res.data);
          const oldPubDate = state.feeds[index].pubDate;
          const hasNewArticles = isAfter(newPubDate, oldPubDate);
          if (!hasNewArticles) {
            return;
          }
          const newArticles = articles
            .filter(({ pubDate }) => isAfter(pubDate, oldPubDate))
            .reverse();
          const newData = {
            pubDate: newPubDate, index, articles: newArticles, url,
          };
          state.feeds[index] = newData;
          state.updatedFeedIndex = [index];
        })
        .finally(() => setTimeout(loop, timeout));
    };

    setTimeout(loop, timeout);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.formState = 'loading';

    const changeState = (value, err) => {
      if (err) {
        state.error = [err];
        state.formState = 'process';
        return;
      }
      const data = parse(value);
      const url = state.inputValue;
      state.formState = 'init';
      state.inputValue = '';
      data.url = url;
      const index = state.feeds.length;
      data.index = index;
      state.feeds.push(data);
      checkUpdate(url, index);
    };

    const url = `${corsProxy}${state.inputValue}`;
    axios.get(url, { timeout: 30000 })
      .then(({ data }) => changeState(data))
      .catch(({ message }) => changeState(null, `${message}`));
  });

  watch(state, 'error', () => {
    const alert = document.querySelector('.alert-danger');
    const [error] = state.error;
    alert.textContent = error;
    alert.classList.add('show');
    setTimeout(() => {
      alert.classList.remove('show');
      alert.textContent = '';
    }, 3000);
  });

  const feeds = document.querySelector('.feeds');

  watch(state.feeds, () => {
    const lastIndex = state.feeds.length - 1;
    const feed = createFeedItem(state.feeds[lastIndex]);
    feeds.prepend(feed);
  });

  watch(state, 'updatedFeedIndex', (_prop, _action, [index]) => {
    const newArticles = state.feeds[index].articles;
    const reversedIndex = state.feeds.length - 1 - index;
    const articles = feeds.children[reversedIndex].querySelector('.articles');
    fillList(articles, newArticles, 'prepend');
    newArticles.forEach(() => {
      articles.removeChild(articles.lastElementChild);
    });
  });

  const activateBtn = () => {
    button.disabled = false;
    button.innerHTML = 'Submit';
  };
  const disableBtn = (isLoading = false) => {
    button.innerHTML = isLoading ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Loading...` : 'Submit';
    button.disabled = true;
  };

  watch(state, 'inputValue', () => {
    const url = state.inputValue;
    const doesUrlExist = state.feeds.some(feed => url === feed.url);
    if (isURL(url) && !doesUrlExist) {
      activateBtn();
      input.setCustomValidity('');
    } else {
      disableBtn();
      input.setCustomValidity('invalid');
    }
  });

  const formStateActions = {
    init: () => {
      form.classList.remove('was-validated');
      input.value = '';
      activateBtn();
    },
    process: () => {
      form.classList.add('was-validated');
      activateBtn();
    },
    loading: () => {
      disableBtn(true);
    },
  };
  watch(state, 'formState', () => {
    formStateActions[state.formState]();
  });
};

app();
