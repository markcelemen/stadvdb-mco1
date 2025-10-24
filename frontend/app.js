const API_BASE = "http://localhost:5000/api";

function getPlatformColor(platform) {
  switch(platform) {
    case 'Windows': return 'rgba(54,162,235,0.7)';
    case 'Mac': return 'rgba(255,99,132,0.7)';
    case 'Linux': return 'rgba(75,192,192,0.7)';
    default: return 'rgba(201,203,207,0.7)';
  }
}

(function () {
  const root = document.getElementById('root') || (() => {
    const r = document.createElement('div');
    r.id = 'root';
    document.body.appendChild(r);
    return r;
  })();

  const tabs = [
    { id: 'mostPlayed', label: 'Most Played', endpoint: `${API_BASE}/most-played` },
    { id: 'trending', label: 'Trending Releases', endpoint: `${API_BASE}/trending-games` },
    { id: 'sales', label: 'Sales Revenue', endpoint: `${API_BASE}/sales-revenue` },
    { id: 'priceRating', label: 'Price vs Rating', endpoint: `${API_BASE}/price-vs-rating` },
    { id: 'platforms', label: 'Platforms Breakdown', endpoint: `${API_BASE}/platforms-breakdown` },
  ];


  let currentTab = tabs[0].id;
  let currentChart = null;

  const tabsContainer = document.createElement('div');
  tabsContainer.style.marginBottom = '12px';
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    btn.style.marginRight = '8px';
    btn.dataset.tab = t.id;
    btn.addEventListener('click', () => activateTab(t.id));
    tabsContainer.appendChild(btn);
  });

  const content = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.id = 'chart';
  canvas.style.maxHeight = '500px';
  canvas.style.width = '100%';
  content.appendChild(canvas);

  root.appendChild(tabsContainer);
  root.appendChild(content);

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  function activateTab(tabId) {
    currentTab = tabId;
    renderTab();
  }

  async function renderTab() {
    const tabCfg = tabs.find(t => t.id === currentTab);
    try {
      const data = await fetchJson(tabCfg.endpoint);

      if(currentChart) {
        currentChart.destroy();
        currentChart = null;
      }
      canvas.style.display = '';
      content.querySelector('table')?.remove();

      switch(currentTab){
        case 'mostPlayed':
          drawMostPlayedTable(data);
          break;
        default:
          drawChart(currentTab, data);
      }

    } catch (err) {
      console.error(err);
      if(currentChart) currentChart.destroy();
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      alert(`Error fetching ${tabCfg.label}: ${err.message}`);
    }
  }

  function drawMostPlayedTable(data) {
    canvas.style.display = 'none';
    const table = document.createElement('table');
    table.border = '1';
    table.cellPadding = '4';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const headers = ['Rank', 'Game Name', 'Peak Users', 'Platform', 'Release Year'];
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    headers.forEach(h=>{
      const th = document.createElement('th');
      th.textContent = h;
      th.style.background='#eee';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const sorted = data
      .map(r => ({
        name: r.GameName ?? r.appname ?? r.name ?? 'Unknown',
        peak: Number(r.TotalPeakUsers ?? r.Peak_CCU ?? 0),
        platform: r.Platform ?? r.platform ?? 'Unknown',
        year: r.ReleaseYear ?? r.releaseyear ?? 'N/A'
      }))
      .sort((a,b)=>b.peak - a.peak);

    sorted.forEach((row,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${row.name}</td>
        <td>${row.peak.toLocaleString()}</td>
        <td>${row.platform}</td>
        <td>${row.year}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    content.appendChild(table);
  }

  function drawChart(tabId, data) {
    const ctx = canvas.getContext('2d');

    switch(tabId) {
      case 'trending': {
        const mapped = data
          .filter(r => r.ReleaseYear !== 'ALL YEARS')
          .map(r => ({ year: Number(r.ReleaseYear), count: Number(r.GamesReleased) }))
          .sort((a,b)=>a.year-b.year);
        const labels = mapped.map(m=>m.year);
        const values = mapped.map(m=>m.count);

        currentChart = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets:[{ label:'# Games Released', data:values, borderColor:'rgb(75,192,192)', fill:false }] },
          options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
        });
        break;
      }

      case 'sales': {
        const labels = data.map(r => r.Platform);
        const values = data.map(r => Number(r.EstimatedRevenue));

        currentChart = new Chart(ctx, {
          type: 'bar',
          data: { labels, datasets:[{ label:'Estimated Revenue', data:values, backgroundColor:'rgba(54,162,235,0.6)' }] },
          options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
        });
        break;
      }

      case 'priceRating': {
        // Map data to points
        const points = data.map(r => ({
          x: Math.min(100, Number(r.price) || 0), // cap at $100
          y: Number(r.metacritic) || 0
        }));

        currentChart = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Games',
              data: points,
              backgroundColor: 'rgba(255,99,132,0.7)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Price vs Rating'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const d = context.raw;
                    return `Price: $${d.x}, Metacritic: ${d.y}`;
                  }
                }
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Price ($)' },
                min: 0,
                max: 100
              },
              y: {
                title: { display: true, text: 'Metacritic Score' },
                min: 0,
                max: 100
              }
            }
          }
        });
        break;
      }

      case 'platforms': {
        const labels = ['Windows','Mac','Linux'];
        const values = [
          data.reduce((sum,r)=>sum+Number(r.WindowsCount),0),
          data.reduce((sum,r)=>sum+Number(r.MacCount),0),
          data.reduce((sum,r)=>sum+Number(r.LinuxCount),0)
        ];

        currentChart = new Chart(ctx, {
          type: 'pie',
          data: { labels, datasets:[{ data: values, backgroundColor:['#0088FE','#FFBB28','#FF6384'] }] },
          options: { responsive:true, maintainAspectRatio:false }
        });
        break;
      }

      default: break;
    }
  }

  renderTab();
})();