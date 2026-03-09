let allRows = [];
let allSources = [];
let barChart;
let lineChart;

const filters = {
  date: document.getElementById('filterDate'),
  state: document.getElementById('filterState'),
  city: document.getElementById('filterCity'),
  package: document.getElementById('filterPackage'),
  brand: document.getElementById('filterBrand'),
  channel: document.getElementById('filterChannel'),
  source: document.getElementById('filterSource')
};

const filterOrder = ['date', 'state', 'city', 'package', 'brand', 'channel', 'source'];

const normalize = (v) => String(v ?? '').trim().toLowerCase();

function brl(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function populateFilter(select, values, previous = '') {
  const unique = [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  select.innerHTML = '<option value="">Todos</option>';
  unique.forEach((v) => {
    const option = document.createElement('option');
    option.value = v;
    option.textContent = v;
    if (v === previous) option.selected = true;
    select.appendChild(option);
  });
  if (previous && !unique.includes(previous)) {
    select.value = '';
  }
}

function matches(row, activeFilters) {
  return (!activeFilters.date || normalize(row.date) === normalize(activeFilters.date))
    && (!activeFilters.state || normalize(row.state) === normalize(activeFilters.state))
    && (!activeFilters.city || normalize(row.city) === normalize(activeFilters.city))
    && (!activeFilters.package || normalize(row.package) === normalize(activeFilters.package))
    && (!activeFilters.brand || normalize(row.brand) === normalize(activeFilters.brand))
    && (!activeFilters.channel || normalize(row.channel) === normalize(activeFilters.channel))
    && (!activeFilters.source || normalize(row.source) === normalize(activeFilters.source));
}

function getActiveFilters() {
  return {
    date: filters.date.value,
    state: filters.state.value,
    city: filters.city.value,
    package: filters.package.value,
    brand: filters.brand.value,
    channel: filters.channel.value,
    source: filters.source.value
  };
}

function applyFilters() {
  const activeFilters = getActiveFilters();
  return allRows.filter((row) => matches(row, activeFilters));
}

function refreshFilterOptions() {
  const current = getActiveFilters();

  filterOrder.forEach((field) => {
    const partialFilters = { ...current, [field]: '' };
    const values = allRows
      .filter((row) => matches(row, partialFilters))
      .map((row) => row[field]);
    populateFilter(filters[field], values, current[field]);
    current[field] = filters[field].value;
  });
}

function renderKPIs(rows) {
  const wholesale = rows.reduce((sum, r) => sum + r.wholesale_price, 0) / (rows.length || 1);
  const retail = rows.reduce((sum, r) => sum + r.retail_price, 0) / (rows.length || 1);
  const kpis = [
    ['Registros', rows.length.toString()],
    ['Preço médio atacado', brl(wholesale)],
    ['Preço médio varejo', brl(retail)],
    ['Diferença média', brl(retail - wholesale)]
  ];

  const container = document.getElementById('kpis');
  container.innerHTML = '';
  kpis.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h4>${label}</h4><strong>${value}</strong>`;
    container.appendChild(card);
  });
}

function asLink(url) {
  const safeUrl = url || '#';
  return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
}

function renderTable(rows) {
  const body = document.getElementById('tableBody');
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.date}</td><td>${r.state}</td><td>${r.city}</td><td>${r.package}</td>
      <td>${r.brand}</td><td>${r.channel}</td><td>${asLink(r.research_location)}</td>
      <td>${r.source}</td><td>${brl(r.wholesale_price)}</td><td>${brl(r.retail_price)}</td>
    </tr>
  `).join('');
}

function renderSourcesTable() {
  const body = document.getElementById('sourcesBody');
  body.innerHTML = allSources.map((s) => `
    <tr>
      <td>${s.name}</td><td>${s.type}</td><td>${s.state}</td><td>${s.city}</td><td>${asLink(s.url)}</td>
    </tr>
  `).join('');
}

function renderCharts(rows) {
  const groupedByState = rows.reduce((acc, row) => {
    if (!acc[row.state]) acc[row.state] = { w: [], r: [] };
    acc[row.state].w.push(row.wholesale_price);
    acc[row.state].r.push(row.retail_price);
    return acc;
  }, {});

  const states = Object.keys(groupedByState);
  const avgW = states.map((s) => groupedByState[s].w.reduce((a, b) => a + b, 0) / groupedByState[s].w.length);
  const avgR = states.map((s) => groupedByState[s].r.reduce((a, b) => a + b, 0) / groupedByState[s].r.length);

  barChart?.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: states,
      datasets: [
        { label: 'Atacado', data: avgW, backgroundColor: '#29b6f6' },
        { label: 'Varejo', data: avgR, backgroundColor: '#01579b' }
      ]
    }
  });

  const groupedByDate = rows.reduce((acc, row) => {
    if (!acc[row.date]) acc[row.date] = [];
    acc[row.date].push(row.retail_price);
    return acc;
  }, {});
  const dates = Object.keys(groupedByDate).sort();
  const timeline = dates.map((d) => groupedByDate[d].reduce((a, b) => a + b, 0) / groupedByDate[d].length);

  lineChart?.destroy();
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Preço médio varejo',
        data: timeline,
        borderColor: '#0277bd',
        tension: 0.25,
        fill: false
      }]
    }
  });
}

function rerender() {
  refreshFilterOptions();
  const rows = applyFilters();
  renderKPIs(rows);
  renderTable(rows);
  renderCharts(rows);
}

function clearFilters() {
  Object.values(filters).forEach((select) => {
    select.value = '';
  });
  rerender();
}

async function init() {
  const [pricesResponse, sourcesResponse] = await Promise.all([
    fetch('data/prices.json'),
    fetch('config/sources.json')
  ]);
  const payload = await pricesResponse.json();
  const sourcePayload = await sourcesResponse.json();

  allRows = payload.data;
  allSources = sourcePayload.sources;
  document.getElementById('lastUpdated').textContent = payload.last_updated;

  Object.values(filters).forEach((f) => f.addEventListener('change', rerender));
  document.getElementById('clearFilters').addEventListener('click', clearFilters);

  renderSourcesTable();
  rerender();
}

init();
