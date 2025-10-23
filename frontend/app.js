const API_BASE = "http://localhost:5000/api";

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

  const root = document.getElementById('root') || (function () {
    const r = document.createElement('div');
    r.id = 'root';
    document.body.appendChild(r);
    return r;
  })();

  const tabs = [
    { id: 'peak', label: 'Peak Users', endpoint: `${API_BASE}/most-played` },
    { id: 'releases', label: 'Releases', endpoint: `${API_BASE}/release-trends?granularity=year` },
    { id: 'platforms', label: 'Platforms', endpoint: `${API_BASE}/platforms-breakdown` },
    { id: 'ratings', label: 'Top Rated', endpoint: `${API_BASE}/top-rated` },
    { id: 'priceScore', label: 'Price vs Rating', endpoint: `${API_BASE}/price-vs-rating` },
  ];

  const cache = {};
  tabs.forEach(t => cache[t.id] = { loading: false, data: null, error: null });

  let currentChart = null;
  let currentTab = tabs[0].id;

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  tabs.forEach(t => {
    const el = document.createElement('div');
    el.className = `tab-item ${t.id === currentTab ? 'active' : ''}`;
    el.textContent = t.label;
    el.dataset.tab = t.id;
    el.addEventListener('click', () => activateTab(t.id));
    el.addEventListener('keypress', (e) => { if (e.key === 'Enter') activateTab(t.id); });
    el.addEventListener('dblclick', () => forceRefresh(t.id));
    tabsContainer.appendChild(el);
  });

  const content = document.createElement('div');
  content.style.padding = '12px';

  const statusEl = document.createElement('div');
  statusEl.style.padding = '8px 0';
  statusEl.style.color = '#9aa4b2';

  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'chart-wrapper';
  chartWrapper.style.minHeight = '420px';

  const title = document.createElement('h2');
  title.textContent = '';

  const canvas = document.createElement('canvas');
  canvas.id = 'reportChart';
  canvas.style.width = '100%';
  canvas.style.height = '420px';

  chartWrapper.appendChild(title);
  chartWrapper.appendChild(canvas);

  root.innerHTML = '';
  root.appendChild(tabsContainer);
  content.appendChild(statusEl);
  content.appendChild(chartWrapper);
  root.appendChild(content);

  // Utilities
  function setStatus(text, isError = false) {
    statusEl.textContent = text || '';
    statusEl.style.color = isError ? 'tomato' : '#9aa4b2';
  }
  function clearStatus() { statusEl.textContent = ''; }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  function activateTab(tabId) {
    if (currentTab === tabId) return;
    currentTab = tabId;
    $$('.tab-item', tabsContainer).forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
    renderTab();
  }

  function forceRefresh(tabId) {
    cache[tabId] = { loading: false, data: null, error: null };
    if (tabId === currentTab) renderTab();
  }

  function renderTab() {
    const slot = cache[currentTab];
    const tabCfg = tabs.find(t => t.id === currentTab);
    title.textContent = getTitle(currentTab);

    // clear previous chart
    if (currentChart) {
        try { currentChart.destroy(); } catch (e) {}
        currentChart = null;
    }

    // clear previous peak table
    const oldTable = document.querySelector('.peak-table');
    if (oldTable) oldTable.remove();

    // always ensure the canvas is visible before new render
    const canvas = document.getElementById('reportChart');
    if (canvas) canvas.style.display = '';

    if (slot.loading) { setStatus('Loading...'); return; }
    if (slot.error) { setStatus(`Error: ${slot.error}`, true); return; }
    if (slot.data) {
        clearStatus();
        drawForTab(currentTab, slot.data);
        return;
    }

    loadTabData(currentTab, tabCfg.endpoint);
  }


  function getTitle(tabId) {
    switch (tabId) {
      case 'peak': return 'Highest Peak Concurrent Users';
      case 'releases': return 'Game Releases Over Time (Year)';
      case 'platforms': return 'Platform Distribution';
      case 'ratings': return 'Top Rated Games (Metacritic vs User Score)';
      case 'priceScore': return 'Price vs Metacritic Score (Bubble size = Reviews)';
      default: return '';
    }
  }

  async function loadTabData(tabId, endpoint) {
    const slot = cache[tabId];
    slot.loading = true;
    slot.error = null;
    setStatus('Loading...');

    try {
      const data = await fetchJson(endpoint);
      slot.data = Array.isArray(data) ? data : (data && data.rows ? data.rows : []);
      slot.loading = false;
      if (!slot.data || slot.data.length === 0) {
        setStatus('No data available for this report.');
        canvas.style.display = 'none';
      } else {
        canvas.style.display = '';
        clearStatus();
        drawForTab(tabId, slot.data);
      }
    } catch (err) {
      console.error('API fetch error', endpoint, err);
      slot.error = err.message || String(err);
      slot.loading = false;
      setStatus(`Error: ${slot.error}`, true);
      canvas.style.display = 'none';
    }
  }

  // Chart render switch
  function drawForTab(tabId, data) {
    const ctx = canvas.getContext('2d');
    // destroy any existing chart
    if (currentChart) try { currentChart.destroy(); } catch (e) {}
    switch (tabId) {
      case 'peak': drawPeak(ctx, data); break;
      case 'releases': drawReleases(ctx, data); break;
      case 'platforms': drawPlatforms(ctx, data); break;
      case 'ratings': drawRatings(ctx, data); break;
      case 'priceScore': drawPriceBubble(ctx, data); break;
      default: setStatus('Unknown tab', true);
    }
  }

  // 1) Peak CCU - bar
  function drawPeak(ctx, raw) {
    const canvas = document.getElementById('reportChart');
    canvas.style.display = 'none';

    const wrapper = document.querySelector('.chart-wrapper');
    if (!wrapper) return;

    const oldTable = wrapper.querySelector('.peak-table');
    if (oldTable) oldTable.remove();

    const mapped = (raw || [])
        .map(r => ({
        name: r.AppName ?? r.appname ?? r.name ?? 'Unknown',
        peak: Number(r.Peak_CCU ?? r.Peak ?? r.peak ?? 0)
        }))
        .sort((a, b) => b.peak - a.peak);

    const table = document.createElement('div');
    table.className = 'peak-table';

    mapped.forEach((row, i) => {
        const item = document.createElement('div');
        item.className = 'peak-row';
        item.innerHTML = `
        <span class="peak-rank">${i + 1}.</span>
        <span class="peak-name">${row.name}</span>
        <span class="peak-value">${row.peak.toLocaleString()}</span>
        `;
        table.appendChild(item);
    });

    wrapper.appendChild(table);
  }

  // 2) Releases over time (year) - line
  function drawReleases(ctx, raw) {
    const mapped = (raw || [])
      .map(r => ({ year: r.year ?? r.Year ?? r.date ?? r.Date, count: Number(r.count ?? r.Count ?? 0) }))
      .filter(r => r.year != null)
      .sort((a,b) => Number(a.year) - Number(b.year));

    const labels = mapped.map(m => String(m.year));
    const values = mapped.map(m => m.count);

    currentChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: '# Games Released', data: values, borderColor: 'rgb(130,202,157)', tension: 0.3, fill: false }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }

  // 3) Platform distribution - pie
  function drawPlatforms(ctx, raw) {
    const mapped = (raw || []).map(r => ({ platform: r.platform ?? r.Platform ?? r.name ?? 'Unknown', count: Number(r.count ?? r.Count ?? r.value ?? 0) })).filter(x => x.count > 0);
    const labels = mapped.map(m => m.platform);
    const values = mapped.map(m => m.count);
    const palette = ['#0088FE','#00C49F','#FFBB28','#FF6384','#845EC2'];

    currentChart = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: labels.map((_,i)=>palette[i%palette.length]) }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 4) Top rated scatter/bubble (Metacritic X, User Y, reviews->radius)
  function drawRatings(ctx, raw) {
    const mapped = (raw || [])
      .filter(r => (r.Metacritic_Score ?? r.metacritic_score ?? r.metacritic) != null && (r.User_Score ?? r.user_score ?? r.user) != null)
      .map(r => {
        const reviews = Number(r.TotalReviews ?? r.totalreviews ?? (r.Positive && r.Negative ? (Number(r.Positive)+Number(r.Negative)) : 0));
        return { x: Number(r.Metacritic_Score ?? r.metacritic_score ?? r.metacritic), y: Number(r.User_Score ?? r.user_score ?? r.user), r: Math.min(25, Math.max(4, Math.sqrt(reviews)/20)), label: r.AppName ?? r.appname ?? r.name ?? 'Unknown' };
      });

    currentChart = new Chart(ctx, {
      type: 'bubble',
      data: { datasets: [{ label: 'Games', data: mapped, backgroundColor: 'rgba(136,132,216,0.9)' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { title: { display: true, text: 'Metacritic Score' }, min: 0, max: 100 }, y: { title: { display: true, text: 'User Score' }, min: 0, max: 10 } },
        plugins: {
          tooltip: { callbacks: { label: ctx => `${ctx.raw.label}: Metacritic ${ctx.raw.x}, User ${ctx.raw.y}` } }
        }
      }
    });
  }

  // 5) Price vs Metacritic bubble (price X, score Y, reviews->radius)
  function drawPriceBubble(ctx, raw) {
    const mapped = (raw || [])
      .filter(r => (r.Launch_Price ?? r.launch_price ?? r.LaunchPrice) != null && (r.Metacritic_Score ?? r.metacritic_score ?? r.metacritic) != null)
      .map(r => {
        const reviews = Number(r.TotalReviews ?? r.totalreviews ?? r.reviews ?? 0);
        return { x: Number(r.Launch_Price ?? r.launch_price ?? r.LaunchPrice ?? 0), y: Number(r.Metacritic_Score ?? r.metacritic_score ?? r.metacritic ?? 0), r: Math.min(30, Math.max(4, Math.sqrt(reviews)/10)), label: r.AppName ?? r.appname ?? r.name ?? 'Unknown' };
      });

    currentChart = new Chart(ctx, {
      type: 'bubble',
      data: { datasets: [{ label: 'Games', data: mapped, backgroundColor: 'rgba(130,202,157,0.9)' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { title: { display: true, text: 'Price ($)' } }, y: { title: { display: true, text: 'Metacritic Score' }, min: 0, max: 100 } },
        plugins: { tooltip: { callbacks: { label: ctx => `${ctx.raw.label}: $${ctx.raw.x}, Score ${ctx.raw.y}` } } }
      }
    });
  }

  renderTab();

})();