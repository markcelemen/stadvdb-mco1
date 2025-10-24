const API_BASE = "http://localhost:5000/api";

function getPlatformColor(platform) {
  switch(platform) {
    case 'Windows': return 'rgba(54,162,235,0.7)';
    case 'Mac': return 'rgba(255,99,132,0.7)';
    case 'Linux': return 'rgba(75,192,192,0.7)';
    default: return 'rgba(201,203,207,0.7)';
  }
}

(async function() {
  const root = document.getElementById('root') || (() => {
    const r = document.createElement('div');
    r.id = 'root';
    document.body.appendChild(r);
    return r;
  })();

  // Main dashboard container
  const main = document.createElement('main');
  main.style.display = 'grid';
  main.style.gridTemplateColumns = 'repeat(12, 1fr)';
  main.style.gridTemplateRows = '32vh 50vh'; // taller panels
  main.style.gap = '20px';
  main.style.padding = '20px';
  root.appendChild(main);

  const widgets = [
    { id: 'mostPlayed', label: 'Most Played', endpoint: `${API_BASE}/most-played`, cssClass:'panel-1', row:1, colSpan:4 },
    { id: 'trending', label: 'Trending Releases', endpoint: `${API_BASE}/trending-games`, cssClass:'panel-2', row:2, colSpan:6 },
    { id: 'sales', label: 'Sales Revenue', endpoint: `${API_BASE}/sales-revenue`, cssClass:'panel-3', row:1, colSpan:4 },
    { id: 'priceRating', label: 'Price vs Rating', endpoint: `${API_BASE}/price-vs-rating`, cssClass:'panel-4', row:2, colSpan:6 },
    { id: 'platforms', label: 'Platforms Breakdown', endpoint: `${API_BASE}/platforms-breakdown`, cssClass:'panel-5', row:1, colSpan:4 }
  ];

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  for (const widget of widgets) {
    const container = document.createElement('div');
    container.className = 'chart-container ' + widget.cssClass;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gridColumn = `span ${widget.colSpan}`;
    container.style.gridRow = widget.row;

    const title = document.createElement('h3');
    title.textContent = widget.label;
    title.style.textAlign = 'center';
    container.appendChild(title);

    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    chartWrapper.style.flex = '1';
    chartWrapper.style.position = 'relative';
    container.appendChild(chartWrapper);

    const canvas = document.createElement('canvas');
    canvas.id = `chart-${widget.id}`;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    chartWrapper.appendChild(canvas);

    main.appendChild(container);

    try {
      const data = await fetchJson(widget.endpoint);
      if (widget.id === 'mostPlayed') {
        drawMostPlayedTable(chartWrapper, data);
      } else {
        drawChart(widget.id, canvas, data);
      }
    } catch (err) {
      console.error(err);
      const errMsg = document.createElement('p');
      errMsg.style.color = 'red';
      errMsg.textContent = `Error fetching ${widget.label}: ${err.message}`;
      container.appendChild(errMsg);
    }
  }

  function drawMostPlayedTable(container, data) {
    container.innerHTML = ''; // remove canvas wrapper
    const table = document.createElement('div');
    table.className = 'peak-table';
    table.style.overflowY = 'auto'; // scroll if too tall

    const sorted = data
      .map(r => ({
        name: r.GameName ?? r.appname ?? r.name ?? 'Unknown',
        peak: Number(r.TotalPeakUsers ?? r.Peak_CCU ?? 0),
        platform: r.Platform ?? r.platform ?? 'Unknown',
        year: r.ReleaseYear ?? r.releaseyear ?? 'N/A'
      }))
      .sort((a,b) => b.peak - a.peak)
      .slice(0, 10);

    sorted.forEach((row,i) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'peak-row';
      rowDiv.innerHTML = `
        <span class="peak-rank">${i+1}</span>
        <span class="peak-name">${row.name}</span>
        <span class="peak-value">${row.peak.toLocaleString()}</span>
      `;
      table.appendChild(rowDiv);
    });

    container.appendChild(table);
  }

  function drawChart(id, canvas, data) {
    const ctx = canvas.getContext('2d');
    switch(id) {
      case 'trending': {
        const mapped = data
          .filter(r => r.ReleaseYear !== 'ALL YEARS')
          .map(r => ({ year: Number(r.ReleaseYear), count: Number(r.GamesReleased) }))
          .sort((a,b)=>a.year-b.year);
        new Chart(ctx, {
          type: 'line',
          data: { labels: mapped.map(m=>m.year), datasets:[{ label:'# Games Released', data:mapped.map(m=>m.count), borderColor:'rgb(75,192,192)', fill:false }] },
          options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
        });
        break;
      }
      case 'sales': {
        new Chart(ctx, {
          type: 'bar',
          data: { labels: data.map(r=>r.Platform), datasets:[{ label:'Estimated Revenue', data:data.map(r=>Number(r.EstimatedRevenue)), backgroundColor:'rgba(54,162,235,0.6)' }] },
          options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
        });
        break;
      }
      case 'priceRating': {
        const points = data.map(r=>({ x: Math.min(100, Number(r.price)||0), y: Number(r.metacritic)||0 }));
        new Chart(ctx, {
          type: 'scatter',
          data: { datasets:[{ label:'Games', data:points, backgroundColor:'rgba(255,99,132,0.7)' }] },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ title:{ display:true, text:'Price vs Rating' }, tooltip:{ callbacks:{ label: ctx=>`Price: $${ctx.raw.x}, Metacritic: ${ctx.raw.y}` } } }, scales:{ x:{ title:{ display:true, text:'Price ($)' }, min:0, max:100 }, y:{ title:{ display:true, text:'Metacritic Score' }, min:0, max:100 } } }
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
        new Chart(ctx, {
          type: 'pie',
          data: { labels, datasets:[{ data: values, backgroundColor:['#0088FE','#FFBB28','#FF6384'] }] },
          plugins: [ChartDataLabels],
          options: { 
            responsive:true, maintainAspectRatio:false,
            plugins: {
              datalabels: {
                color: '#222',
                font: { weight: 'bold', size: 10 },
                formatter: function(value, context) {
                  const total = context.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                  const percent = total ? ((value/total)*100).toFixed(1) : 0;
                  return percent + '%';
                }
              }
            }
          }
        });
        break;
      }
      default: break;
    }
  }
})();