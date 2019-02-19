/* eslint-disable no-restricted-syntax */
import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';

const { watch } = WatchJS;
const cors = 'https://cors-anywhere.herokuapp.com/';


const app = () => {
  const state = {
    value: '',
    form: 'init',
    loading: false,
    xmlDocument: null,
    existingFeeds: new Set(),
    error: null,
  };

  const form = document.querySelector('.needs-validation');
  const input = document.getElementById('address');
  const button = document.querySelector('[type="submit"]');
  input.addEventListener('input', ({ target }) => {
    state.form = target.value === '' ? 'init' : 'process';
    state.value = target.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.loading = true;
    const changeState = (value, err) => {
      state.loading = false;
      if (err) {
        state.error = err;
        return;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'application/xml');
      if (doc.querySelector('parsererror')) {
        state.error = 'parse error';
        return;
      }
      state.existingFeeds.add(state.value);
      state.form = 'init';
      state.value = '';
      state.xmlDocument = doc;
    };
    axios.get(`${cors}${state.value}`)
      .then(({ data }) => changeState(data))
      .catch(({ response: { data, status } }) => changeState(null, `${data}. STATUS CODE: ${status}`));
  });

  watch(state, 'error', () => {
    const alert = document.querySelector('.alert-danger');
    const errSpan = alert.querySelector('.err-message');
    errSpan.textContent = state.error;
    alert.prepend(errSpan);
    alert.classList.add('show');
    setTimeout(() => {
      alert.classList.remove('show');
    }, 5000);
  });

  watch(state, 'loading', () => {
    if (state.loading) {
      button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Loading...`;
    } else {
      button.innerHTML = 'Submit';
    }
  });

  watch(state, 'xmlDocument', () => {
    const container = document.querySelector('.content');
    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'mt-5');
    const header = document.createElement('h2');
    const p = document.createElement('p');
    const doc = state.xmlDocument;
    const channel = doc.querySelector('channel');
    header.textContent = [...channel.children].filter(n => n.nodeName === 'title')[0].textContent;
    p.textContent = [...channel.children].filter(n => n.nodeName === 'description')[0].textContent;
    container.append(ul);
    ul.append(header);
    ul.append(p);
    doc.querySelectorAll('item').forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      for (const child of item.children) {
        if (child.nodeName === 'title') {
          a.textContent = child.textContent;
        }
        if (child.nodeName === 'link') {
          a.href = child.textContent;
        }
      }
      li.append(a);
      ul.append(li);
    });
  });

  watch(state, 'value', () => {
    if (isURL(state.value) && !state.existingFeeds.has(state.value)) {
      button.disabled = false;
      input.setCustomValidity('');
    } else {
      button.disabled = true;
      input.setCustomValidity('invalid');
    }
  });
  watch(state, 'form', () => {
    const map = {
      init: () => {
        form.classList.remove('was-validated');
        input.value = '';
      },
      process: () => {
        form.classList.add('was-validated');
      },
    };
    map[state.form]();
  });
};

app();
