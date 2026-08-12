import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/+esm';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from '../supabase-config.js';

const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');
const setupView = document.getElementById('setupView');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const sessionEmail = document.getElementById('sessionEmail');
const photoGrid = document.getElementById('photoGrid');
const saveState = document.getElementById('saveState');

let supabase;
let sortable;
let saveTimer;
let items = [];

const setSaveState = (text, className = '') => {
  saveState.textContent = text;
  saveState.className = `save-state ${className}`.trim();
};

const setLoginMessage = (text, isError = false) => {
  loginMessage.textContent = text;
  loginMessage.classList.toggle('error', isError);
};

const normalizePath = value => {
  if (!value) return '';
  return value.replace(/^\.\//, '').replace(/^\.\.\//, '');
};

const readGalleryFromSite = async () => {
  const response = await fetch(`../index.html?admin=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Não consegui ler o index.html.');

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return [...doc.querySelectorAll('.masonry .shot')]
    .map(figure => {
      const img = figure.querySelector('img');
      if (!img) return null;
      const src = normalizePath(img.getAttribute('src'));
      return {
        src,
        label: figure.dataset.label || '',
        alt: img.getAttribute('alt') || '',
      };
    })
    .filter(Boolean);
};

const loadSavedOrder = async () => {
  const { data, error } = await supabase
    .from('gallery_settings')
    .select('photo_order')
    .eq('id', 'main')
    .maybeSingle();

  if (error) throw error;
  return Array.isArray(data?.photo_order) ? data.photo_order.map(normalizePath) : [];
};

const mergeOrder = (galleryItems, order) => {
  const bySrc = new Map(galleryItems.map(item => [item.src, item]));
  const ordered = [];
  const used = new Set();

  order.forEach(src => {
    const item = bySrc.get(src);
    if (!item || used.has(src)) return;
    ordered.push(item);
    used.add(src);
  });

  galleryItems.forEach(item => {
    if (!used.has(item.src)) ordered.push(item);
  });

  return ordered;
};

const updateIndexes = () => {
  [...photoGrid.children].forEach((card, index) => {
    card.dataset.index = String(index + 1).padStart(2, '0');
  });
};

const renderGrid = orderedItems => {
  photoGrid.innerHTML = '';

  orderedItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.dataset.src = item.src;
    card.title = item.label || item.src;

    const img = document.createElement('img');
    img.src = `../${item.src}`;
    img.alt = item.alt;
    img.loading = 'lazy';
    img.draggable = false;

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⋮⋮';
    handle.setAttribute('aria-hidden', 'true');

    card.append(img, handle);
    photoGrid.appendChild(card);
  });

  updateIndexes();

  sortable?.destroy();
  sortable = new Sortable(photoGrid, {
    animation: 170,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.photo-card',
    delay: 90,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    onEnd: () => {
      updateIndexes();
      scheduleSave();
    },
  });
};

const saveOrder = async () => {
  const order = [...photoGrid.children].map(card => card.dataset.src);
  setSaveState('SALVANDO...', 'saving');

  const { error } = await supabase
    .from('gallery_settings')
    .update({
      photo_order: order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'main');

  if (error) {
    console.error(error);
    setSaveState('ERRO AO SALVAR', 'error');
    return;
  }

  setSaveState('ORDEM SALVA', 'saved');
};

function scheduleSave() {
  window.clearTimeout(saveTimer);
  setSaveState('ALTERAÇÃO PENDENTE', 'saving');
  saveTimer = window.setTimeout(saveOrder, 350);
}

const loadAdmin = async session => {
  loginView.hidden = true;
  setupView.hidden = true;
  adminView.hidden = false;
  logoutButton.hidden = false;
  sessionEmail.textContent = session?.user?.email || '';
  setSaveState('CARREGANDO...');

  try {
    const [galleryItems, savedOrder] = await Promise.all([
      readGalleryFromSite(),
      loadSavedOrder(),
    ]);
    items = mergeOrder(galleryItems, savedOrder);
    renderGrid(items);
    setSaveState('PRONTO', 'saved');
  } catch (error) {
    console.error(error);
    setSaveState('ERRO AO CARREGAR', 'error');
  }
};

const showLogin = () => {
  adminView.hidden = true;
  setupView.hidden = true;
  loginView.hidden = false;
  logoutButton.hidden = true;
  sessionEmail.textContent = '';
  passwordInput.value = '';
};

if (!isSupabaseConfigured()) {
  loginView.hidden = true;
  adminView.hidden = true;
  setupView.hidden = false;
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: { session } } = await supabase.auth.getSession();
  if (session) await loadAdmin(session);
  else showLogin();

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) showLogin();
  });
}

loginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return;

  setLoginMessage('');
  loginButton.disabled = true;
  loginButton.textContent = 'ENTRANDO...';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value,
  });

  loginButton.disabled = false;
  loginButton.textContent = 'ENTRAR';

  if (error || !data.session) {
    setLoginMessage('E-mail ou senha incorretos.', true);
    return;
  }

  setLoginMessage('');
  await loadAdmin(data.session);
});

logoutButton?.addEventListener('click', async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  showLogin();
});
