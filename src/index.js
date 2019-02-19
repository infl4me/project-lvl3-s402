import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';
import createFeedItem from './feed';

const { watch } = WatchJS;
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const parser = new DOMParser();

const app = () => {
  const state = {
    inputValue: '',
    form: 'init',
    loading: false,
    xml: null,
    existingFeeds: new Set(),
    errors: {
      count: 0,
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.loading = true;

    const changeState = (value, err) => {
      state.loading = false;
      if (err) {
        state.errors.count += 1;
        state.errors.message = err;
        return;
      }
      const doc = parser.parseFromString(value, 'application/xml');
      if (doc.querySelector('parsererror')) {
        state.errors.count += 1;
        state.errors.message = 'parse error';
        return;
      }
      state.existingFeeds.add(state.inputValue);
      state.form = 'init';
      state.inputValue = '';
      state.xml = doc;
    };

    axios.get(`${corsProxy}${state.inputValue}`, { timeout: 30000 })
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

  watch(state, 'xml', () => {
    const feed = createFeedItem(state.xml);
    feeds.prepend(feed);
  });

  watch(state, 'inputValue', () => {
    if (isURL(state.inputValue) && !state.existingFeeds.has(state.inputValue)) {
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
