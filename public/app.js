const $ = (sel) => document.querySelector(sel);
const state = { movies: [], search: '', sort: 'year-desc' };

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

async function fetchMovies() {
  try {
    const res = await fetch('/movies');
    state.movies = await res.json();
    render();
  } catch (err) {
    console.error('falha ao buscar filmes', err);
  }
}

function render() {
  renderStats();
  renderGrid();
}

function renderStats() {
  const { movies } = state;
  $('#stat-total').textContent = movies.length;

  const withRating = movies.filter((m) => m.rating != null);
  $('#stat-avg').textContent = withRating.length
    ? (withRating.reduce((s, m) => s + m.rating, 0) / withRating.length).toFixed(1)
    : '—';

  const directors = new Set(movies.map((m) => m.director).filter(Boolean));
  $('#stat-directors').textContent = directors.size;
}

function getFilteredSorted() {
  let list = [...state.movies];

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
  const noResults = $('#no-results');

  if (state.movies.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    noResults.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  const list = getFilteredSorted();

  if (list.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  grid.innerHTML = list.map(renderCard).join('');

  grid.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', () => openDetail(Number(el.dataset.id)));
  });
}

function renderCard(m) {
  const grad = gradientFor(m.title);
  const initial = m.title.charAt(0).toUpperCase();
  return `
    <article
      data-id="${m.id}"
      class="group cursor-pointer animate-fade-in"
    >
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
      <div class="flex gap-2">
        <button id="detail-close-btn" class="flex-1 text-sm font-medium py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition">
          Fechar
        </button>
        <button data-delete="${m.id}" id="detail-delete-btn" class="flex-1 text-sm font-medium py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-950 dark:text-red-400 transition">
          Excluir
        </button>
      </div>
    </div>
  `;

  $('#detail-dialog').showModal();
  $('#close-detail').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-close-btn').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-delete-btn').addEventListener('click', () => deleteMovie(m.id));
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
    fetchMovies();
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = 'text-xs min-h-[1rem] text-red-500';
  }
}

async function deleteMovie(id) {
  if (!confirm('Excluir este filme?')) return;
  await fetch(`/movies/${id}`, { method: 'DELETE' });
  $('#detail-dialog').close();
  fetchMovies();
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

[$('#add-dialog'), $('#detail-dialog')].forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
});

checkHealth();
fetchMovies();
setInterval(checkHealth, 10000);
