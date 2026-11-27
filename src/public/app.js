const state = {
  theme: localStorage.getItem('poc-theme') || 'dark',
  activeEndpoint: '/api/info',
};

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('poc-theme', theme);
}

function formatUptime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}h ${m}m ${rem}s`;
  if (m > 0) return `${m}m ${rem}s`;
  return `${rem}s`;
}

async function fetchJson(url, options) {
  const start = performance.now();
  const res = await fetch(url, options);
  const duration = Math.round(performance.now() - start);
  const data = await res.json();
  return { status: res.status, ok: res.ok, duration, data };
}

async function loadTelemetry() {
  const healthPill = document.getElementById('health-pill');
  const healthText = document.getElementById('health-pill-text');

  try {
    const [infoRes, healthRes, readyRes, liveRes] = await Promise.all([
      fetchJson('/api/info'),
      fetchJson('/health'),
      fetchJson('/health/ready'),
      fetchJson('/health/live'),
    ]);

    const info = infoRes.data;
    document.getElementById('meta-version').textContent = info.version || '--';
    document.getElementById('meta-env').textContent = info.environment || '--';
    document.getElementById('meta-region').textContent = info.region || '--';
    document.getElementById('meta-build').textContent = info.buildNumber || '--';
    document.getElementById('meta-uptime').textContent = formatUptime(healthRes.data.uptime || 0);

    const readyEl = document.getElementById('probe-ready');
    const liveEl = document.getElementById('probe-live');
    readyEl.textContent = `Ready: ${readyRes.data.ready ? 'UP' : 'DOWN'}`;
    readyEl.className = `probe-badge ${readyRes.ok ? 'ok' : 'fail'}`;
    liveEl.textContent = `Live: ${liveRes.data.alive ? 'UP' : 'DOWN'}`;
    liveEl.className = `probe-badge ${liveRes.ok ? 'ok' : 'fail'}`;

    healthPill.className = 'status-pill status-healthy';
    healthText.textContent = `Healthy (${info.environment})`;
  } catch (err) {
    healthPill.className = 'status-pill status-error';
    healthText.textContent = 'Service unreachable';
  }
}

async function loadItems() {
  const category = document.getElementById('filter-category').value;
  const active = document.getElementById('filter-active').value;

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (active) params.set('active', active);

  const query = params.toString() ? `?${params.toString()}` : '';
  const listEl = document.getElementById('items-list');
  const countEl = document.getElementById('items-count');

  try {
    const { data } = await fetchJson(`/api/items${query}`);
    const items = data.data || [];
    countEl.textContent = String(data.count ?? items.length);

    if (items.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No items match the current filter.</div>';
      return;
    }

    listEl.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'item-row';

      const main = document.createElement('div');
      main.className = 'item-main';

      const idSpan = document.createElement('span');
      idSpan.className = 'item-id';
      idSpan.textContent = `#${item.id}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = item.name;

      main.append(idSpan, nameSpan);

      const tags = document.createElement('div');
      tags.className = 'item-tags';

      const catTag = document.createElement('span');
      catTag.className = 'tag tag-category';
      catTag.textContent = item.category;

      const statusTag = document.createElement('span');
      statusTag.className = `tag ${item.active ? 'tag-active' : 'tag-inactive'}`;
      statusTag.textContent = item.active ? 'active' : 'inactive';

      tags.append(catTag, statusTag);
      row.append(main, tags);
      listEl.appendChild(row);
    });
  } catch (err) {
    listEl.innerHTML = '<div class="empty-state">Failed to load items.</div>';
  }
}

async function inspectEndpoint(endpoint) {
  state.activeEndpoint = endpoint;
  document.querySelectorAll('.endpoint-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.endpoint === endpoint);
  });

  const urlEl = document.getElementById('inspector-url');
  const statusEl = document.getElementById('inspector-status');
  const latencyEl = document.getElementById('inspector-latency');
  const outputEl = document.getElementById('inspector-output');

  urlEl.textContent = `GET ${endpoint}`;
  outputEl.textContent = 'Fetching...';

  try {
    const res = await fetchJson(endpoint);
    statusEl.textContent = `HTTP ${res.status}`;
    latencyEl.textContent = `${res.duration} ms`;
    outputEl.textContent = JSON.stringify(res.data, null, 2);
  } catch (err) {
    statusEl.textContent = 'ERR';
    latencyEl.textContent = '-- ms';
    outputEl.textContent = String(err);
  }
}

async function handleCreateItem(event) {
  event.preventDefault();
  const nameInput = document.getElementById('item-name');
  const categoryInput = document.getElementById('item-category');
  const feedbackEl = document.getElementById('form-feedback');

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  if (!name) return;

  try {
    const res = await fetchJson('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    });

    if (!res.ok) {
      feedbackEl.className = 'form-feedback err';
      feedbackEl.textContent = res.data.error || 'Failed to add item.';
      return;
    }

    nameInput.value = '';
    feedbackEl.className = 'form-feedback ok';
    feedbackEl.textContent = `Created "${res.data.data.name}" in ${res.data.data.category}.`;
    await loadItems();
    if (state.activeEndpoint === '/api/items') {
      await inspectEndpoint('/api/items');
    }
  } catch (err) {
    feedbackEl.className = 'form-feedback err';
    feedbackEl.textContent = 'Network error while creating item.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);

  document.getElementById('theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
  });

  document.getElementById('refresh-telemetry').addEventListener('click', loadTelemetry);
  document.getElementById('filter-category').addEventListener('change', loadItems);
  document.getElementById('filter-active').addEventListener('change', loadItems);
  document.getElementById('add-item-form').addEventListener('submit', handleCreateItem);

  document.querySelectorAll('.endpoint-chip').forEach((chip) => {
    chip.addEventListener('click', () => inspectEndpoint(chip.dataset.endpoint));
  });

  loadTelemetry();
  loadItems();
  inspectEndpoint(state.activeEndpoint);
});
