import 'bootstrap/dist/css/bootstrap.min.css';
import WatchJS from 'melanke-watchjs';
import isURL from 'validator/lib/isURL';
import axios from 'axios';

const { watch } = WatchJS;
const cors = 'https://cors-anywhere.herokuapp.com/';


const app = () => {
  const state = {
    inputValue: '',
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
    state.inputValue = target.value;
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
      state.existingFeeds.add(state.inputValue);
      state.form = 'init';
      state.inputValue = '';
      state.xmlDocument = doc;
    };
    axios.get(`${cors}${state.inputValue}`)
      .then(({ data }) => changeState(data))
      .catch(({ response: { statusText, status } }) => changeState(null, `${status} ${statusText}`));
  });

  watch(state, 'error', () => {
    const alert = document.querySelector('.alert-danger');
    alert.textContent = state.error;
    alert.classList.add('show');
    setTimeout(() => {
      alert.classList.remove('show');
      alert.textContent = '';
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

  const container = document.querySelector('.feeds-list');
  watch(state, 'xmlDocument', () => {
    const div = document.createElement('div');
    div.classList.add('feed', 'mt-5');
    const ul = document.createElement('ul');
    ul.classList.add('list-group');
    const header = document.createElement('h2');
    const p = document.createElement('p');
    const doc = state.xmlDocument;
    const channel = doc.querySelector('channel');
    [...channel.children].forEach((child) => {
      if (child.nodeName === 'title') {
        header.textContent = child.textContent;
      }
      if (child.nodeName === 'description') {
        p.textContent = child.textContent;
      }
    });
    container.append(div);
    div.append(header);
    div.append(p);
    div.append(ul);
    doc.querySelectorAll('item').forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      [...item.children].forEach((child) => {
        if (child.nodeName === 'title') {
          a.textContent = child.textContent;
        }
        if (child.nodeName === 'link') {
          a.href = child.textContent;
        }
      });
      li.append(a);
      ul.append(li);
    });
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
