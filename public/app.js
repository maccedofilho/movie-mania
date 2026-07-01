const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const USER_ID = 1;

const state = {
  movies: [],
  watchlist: [],
  view: 'collection',
  watchlistFilter: 'all',
  search: '',
  sort: 'year-desc',
};

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function gradientFor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10;
}

function getWatchlistItem(movieId) {
  return state.watchlist.find((w) => w.movieId === movieId);
}

async function checkHealth() {
  const dot = $('#health-dot');
  const text = $('#health-text');
  try {
    const res = await fetch('/health');
    if (!res.ok) throw new Error();
    dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
    text.textContent = 'online';
    text.className = 'text-neutral-500 dark:text-neutral-400 hidden sm:inline';
  } catch {
    dot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
    text.textContent = 'offline';
    text.className = 'text-red-500 hidden sm:inline';
  }
}

async function fetchAll() {
  try {
    const [moviesRes, watchlistRes] = await Promise.all([
      fetch('/movies'),
      fetch(`/watchlist/user/${USER_ID}`),
    ]);
    state.movies = await moviesRes.json();
    state.watchlist = await watchlistRes.json();
    render();
  } catch (err) {
    console.error('falha ao buscar dados', err);
  }
}

function render() {
  renderStats();
  renderGrid();
}

function renderStats() {
  const { movies, watchlist } = state;
  $('#stat-total').textContent = movies.length;

  const withRating = movies.filter((m) => m.rating != null);
  $('#stat-avg').textContent = withRating.length
    ? (withRating.reduce((s, m) => s + m.rating, 0) / withRating.length).toFixed(1)
    : '—';

  $('#stat-to-watch').textContent = watchlist.filter((w) => w.status === 'to_watch').length;
  $('#stat-watched').textContent = watchlist.filter((w) => w.status === 'watched').length;
}

function getVisibleMovies() {
  let list;

  if (state.view === 'collection') {
    list = [...state.movies];
  } else {
    let watchlistItems = state.watchlist;
    if (state.watchlistFilter !== 'all') {
      watchlistItems = watchlistItems.filter((w) => w.status === state.watchlistFilter);
    }
    const movieIds = new Set(watchlistItems.map((w) => w.movieId));
    list = state.movies.filter((m) => movieIds.has(m.id));
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter((m) =>
      m.title.toLowerCase().includes(q) ||
      (m.director ?? '').toLowerCase().includes(q)
    );
  }

  switch (state.sort) {
    case 'year-asc':
      list.sort((a, b) => a.year - b.year);
      break;
    case 'title':
      list.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
      break;
    case 'rating':
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    case 'year-desc':
    default:
      list.sort((a, b) => b.year - a.year);
  }

  return list;
}

function renderGrid() {
  const grid = $('#movie-grid');
  const empty = $('#empty-state');
  const emptyWatchlist = $('#empty-watchlist');
  const noResults = $('#no-results');
  const label = $('#section-label');
  const filters = $('#watchlist-filters');

  empty.classList.add('hidden');
  emptyWatchlist.classList.add('hidden');
  noResults.classList.add('hidden');

  if (state.view === 'collection') {
    label.textContent = 'Biblioteca';
    filters.classList.add('hidden');

    if (state.movies.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
  } else {
    label.textContent = 'Watchlist';
    filters.classList.remove('hidden');

    if (state.watchlist.length === 0) {
      grid.innerHTML = '';
      emptyWatchlist.classList.remove('hidden');
      return;
    }
  }

  const list = getVisibleMovies();

  if (list.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  grid.innerHTML = list.map(renderCard).join('');
  grid.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', () => openDetail(Number(el.dataset.id)));
  });
}

function renderCard(m) {
  const grad = gradientFor(m.title);
  const initial = m.title.charAt(0).toUpperCase();
  const wl = getWatchlistItem(m.id);
  const badge = wl
    ? `<div class="watchlist-badge ${wl.status === 'watched' ? 'watched' : 'to-watch'}" title="${wl.status === 'watched' ? 'Assistido' : 'A assistir'}">
        ${wl.status === 'watched'
          ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>'
          : '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/></svg>'
        }
      </div>`
    : '';

  return `
    <article
      data-id="${m.id}"
      class="group cursor-pointer animate-fade-in relative"
    >
      ${badge}
      <div class="poster gradient-${grad} rounded-2xl shadow-sm group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-300">
        <div class="absolute inset-0 flex items-center justify-center text-white/20 text-7xl font-bold select-none">
          ${escapeHtml(initial)}
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 class="text-white text-sm font-semibold leading-tight line-clamp-2 drop-shadow">
            ${escapeHtml(m.title)}
          </h3>
          <div class="flex items-center gap-2 mt-1 text-white/80 text-xs">
            <span>${m.year}</span>
            ${m.rating != null ? `<span class="opacity-60">·</span><span>★ ${m.rating}</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `;
}

function openDetail(id) {
  const m = state.movies.find((x) => x.id === id);
  if (!m) return;

  const grad = gradientFor(m.title);
  const initial = m.title.charAt(0).toUpperCase();
  const wl = getWatchlistItem(m.id);

  let watchlistSection;
  if (!wl) {
    watchlistSection = `
      <button id="btn-add-wl" data-movie-id="${m.id}" class="w-full text-sm font-medium py-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Adicionar à watchlist
      </button>
    `;
  } else if (wl.status === 'to_watch') {
    watchlistSection = `
      <div class="flex items-center gap-2 px-3 py-2 bg-accent/10 text-accent rounded-lg mb-2 text-xs">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
        </svg>
        <span>Na sua lista de "a assistir"</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button id="btn-mark-watched" data-wl-id="${wl.id}" class="text-sm font-medium py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition">
          Marcar como assistido
        </button>
        <button id="btn-remove-wl" data-wl-id="${wl.id}" class="text-sm font-medium py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition">
          Remover
        </button>
      </div>
    `;
  } else {
    watchlistSection = `
      <div class="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg mb-2 text-xs">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
        </svg>
        <span>Assistido${wl.watchedAt ? ' em ' + new Date(wl.watchedAt).toLocaleDateString('pt-BR') : ''}</span>
      </div>
      <button id="btn-remove-wl" data-wl-id="${wl.id}" class="w-full text-sm font-medium py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition">
        Remover da watchlist
      </button>
    `;
  }

  $('#detail-content').innerHTML = `
    <div class="relative h-48 gradient-${grad}">
      <div class="absolute inset-0 flex items-center justify-center text-white/20 text-8xl font-bold select-none">
        ${escapeHtml(initial)}
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      <button id="close-detail" class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="p-6">
      <h3 class="text-xl font-semibold tracking-tight mb-1">${escapeHtml(m.title)}</h3>
      <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        <span>${escapeHtml(m.director ?? '—')}</span>
        <span class="opacity-50">·</span>
        <span>${m.year}</span>
        ${m.duration ? `<span class="opacity-50">·</span><span>${m.duration} min</span>` : ''}
        ${m.rating != null ? `<span class="opacity-50">·</span><span class="text-amber-500">★ ${m.rating}</span>` : ''}
      </div>
      ${m.synopsis ? `
        <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
          ${escapeHtml(m.synopsis)}
        </p>
      ` : `
        <p class="text-sm text-neutral-400 italic mb-6">Sem sinopse.</p>
      `}
      <div class="mb-4">
        ${watchlistSection}
      </div>
      <div class="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <button id="detail-close-btn" class="flex-1 text-sm font-medium py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition">
          Fechar
        </button>
        <button data-delete="${m.id}" id="detail-delete-btn" class="flex-1 text-sm font-medium py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-950 dark:text-red-400 transition">
          Excluir filme
        </button>
      </div>
    </div>
  `;

  $('#detail-dialog').showModal();
  $('#close-detail').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-close-btn').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-delete-btn').addEventListener('click', () => deleteMovie(m.id));

  const addBtn = document.getElementById('btn-add-wl');
  if (addBtn) addBtn.addEventListener('click', () => addToWatchlist(m.id));

  const markBtn = document.getElementById('btn-mark-watched');
  if (markBtn) markBtn.addEventListener('click', () => markAsWatched(Number(markBtn.dataset.wlId)));

  const removeBtn = document.getElementById('btn-remove-wl');
  if (removeBtn) removeBtn.addEventListener('click', () => removeFromWatchlist(Number(removeBtn.dataset.wlId)));
}

async function addToWatchlist(movieId) {
  try {
    const res = await fetch('/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, movieId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'erro ao adicionar');
      return;
    }
    await fetchAll();
    openDetail(movieId);
  } catch (err) {
    console.error(err);
  }
}

async function markAsWatched(wlId) {
  const item = state.watchlist.find((w) => w.id === wlId);
  const movieId = item?.movieId;
  try {
    await fetch(`/watchlist/${wlId}/watched`, { method: 'PUT' });
    await fetchAll();
    if (movieId) openDetail(movieId);
  } catch (err) {
    console.error(err);
  }
}

async function removeFromWatchlist(wlId) {
  const item = state.watchlist.find((w) => w.id === wlId);
  const movieId = item?.movieId;
  try {
    await fetch(`/watchlist/${wlId}`, { method: 'DELETE' });
    await fetchAll();
    if (movieId) openDetail(movieId);
  } catch (err) {
    console.error(err);
  }
}

async function createMovie(payload) {
  const feedback = $('#form-feedback');
  feedback.textContent = '';
  feedback.className = 'text-xs min-h-[1rem]';

  try {
    const res = await fetch('/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors ? data.errors.join(', ') : data.error || 'erro';
      feedback.textContent = msg;
      feedback.className = 'text-xs min-h-[1rem] text-red-500';
      return;
    }

    $('#movie-form').reset();
    $('#add-dialog').close();
    fetchAll();
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = 'text-xs min-h-[1rem] text-red-500';
  }
}

async function deleteMovie(id) {
  if (!confirm('Excluir este filme? Todos os registros da watchlist relacionados também serão removidos.')) return;
  await fetch(`/movies/${id}`, { method: 'DELETE' });
  $('#detail-dialog').close();
  fetchAll();
}

function setView(view) {
  state.view = view;
  $$('.tab-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === view;
    btn.classList.toggle('tab-active', isActive);
    btn.classList.toggle('text-neutral-500', !isActive);
    btn.classList.toggle('dark:text-neutral-400', !isActive);
  });
  renderGrid();
}

function setWatchlistFilter(filter) {
  state.watchlistFilter = filter;
  $$('.wfilter-btn').forEach((btn) => {
    const isActive = btn.dataset.wfilter === filter;
    btn.classList.toggle('wfilter-active', isActive);
    btn.classList.toggle('text-neutral-500', !isActive);
    btn.classList.toggle('dark:text-neutral-400', !isActive);
  });
  renderGrid();
}

$('#movie-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const payload = {
    title: data.title,
    director: data.director,
    year: Number(data.year),
  };
  if (data.duration) payload.duration = Number(data.duration);
  if (data.rating) payload.rating = Number(data.rating);
  if (data.synopsis) payload.synopsis = data.synopsis;
  createMovie(payload);
});

$('#open-add').addEventListener('click', () => $('#add-dialog').showModal());
$('#close-add').addEventListener('click', () => $('#add-dialog').close());
$('#cancel-add').addEventListener('click', () => $('#add-dialog').close());
$('#theme-toggle').addEventListener('click', toggleTheme);

$('#search').addEventListener('input', (e) => {
  state.search = e.target.value;
  renderGrid();
});

$('#sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  renderGrid();
});

$$('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => setView(btn.dataset.tab));
});

$$('.wfilter-btn').forEach((btn) => {
  btn.addEventListener('click', () => setWatchlistFilter(btn.dataset.wfilter));
});

[$('#add-dialog'), $('#detail-dialog')].forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
});

checkHealth();
fetchAll();
setInterval(checkHealth, 10000);
