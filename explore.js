/* =============================================
   Underflow Explore — Artist Relations Graph
   D3.js force-directed visualization
   ============================================= */

// ---- Mock Data ----

const MOCK_DATA = {
  "Sepp": [
    { name: "Ada Kaleh", type: "remixer", track_count: 5 },
    { name: "Arapu", type: "collaborator", track_count: 8 },
    { name: "Priku", type: "remixer", track_count: 3 },
    { name: "Dubfound", type: "featuring", track_count: 2 },
    { name: "Fumiya Tanaka", type: "remixer", track_count: 4 },
    { name: "Vlad Caia", type: "collaborator", track_count: 6 },
    { name: "Cap", type: "remixer", track_count: 2 },
    { name: "Rhadoo", type: "collaborator", track_count: 3 },
    { name: "Gescu", type: "featuring", track_count: 1 },
    { name: "Barac", type: "remixer", track_count: 7 }
  ],
  "Arapu": [
    { name: "Sepp", type: "collaborator", track_count: 8 },
    { name: "Raresh", type: "remixer", track_count: 6 },
    { name: "Petre Inspirescu", type: "collaborator", track_count: 4 },
    { name: "Pedro", type: "remixer", track_count: 3 },
    { name: "Rhadoo", type: "collaborator", track_count: 5 },
    { name: "Sit", type: "featuring", track_count: 2 },
    { name: "Praslea", type: "remixer", track_count: 4 },
    { name: "Cezar", type: "collaborator", track_count: 3 }
  ],
  "Priku": [
    { name: "Sepp", type: "remixer", track_count: 3 },
    { name: "Barac", type: "collaborator", track_count: 5 },
    { name: "Rhadoo", type: "remixer", track_count: 4 },
    { name: "Arapu", type: "collaborator", track_count: 2 },
    { name: "Vlad Caia", type: "featuring", track_count: 1 },
    { name: "Cosmin TRG", type: "remixer", track_count: 3 },
    { name: "Cristi Cons", type: "collaborator", track_count: 6 }
  ],
  "Barac": [
    { name: "Priku", type: "collaborator", track_count: 5 },
    { name: "Sepp", type: "remixer", track_count: 7 },
    { name: "Rhadoo", type: "collaborator", track_count: 4 },
    { name: "Arapu", type: "remixer", track_count: 3 },
    { name: "Cap", type: "featuring", track_count: 2 },
    { name: "Cristi Cons", type: "collaborator", track_count: 4 },
    { name: "Raresh", type: "remixer", track_count: 5 }
  ],
  "Rhadoo": [
    { name: "Arapu", type: "collaborator", track_count: 5 },
    { name: "Priku", type: "remixer", track_count: 4 },
    { name: "Petre Inspirescu", type: "collaborator", track_count: 8 },
    { name: "Raresh", type: "collaborator", track_count: 7 },
    { name: "Sepp", type: "collaborator", track_count: 3 },
    { name: "Barac", type: "collaborator", track_count: 4 },
    { name: "Dan Andrei", type: "remixer", track_count: 2 },
    { name: "Vlad Caia", type: "featuring", track_count: 3 }
  ],
  "Raresh": [
    { name: "Arapu", type: "remixer", track_count: 6 },
    { name: "Rhadoo", type: "collaborator", track_count: 7 },
    { name: "Petre Inspirescu", type: "collaborator", track_count: 5 },
    { name: "Praslea", type: "remixer", track_count: 4 },
    { name: "Pedro", type: "collaborator", track_count: 3 },
    { name: "Dan Andrei", type: "collaborator", track_count: 2 },
    { name: "Barac", type: "remixer", track_count: 5 }
  ],
  "Vlad Caia": [
    { name: "Sepp", type: "collaborator", track_count: 6 },
    { name: "Priku", type: "featuring", track_count: 1 },
    { name: "Rhadoo", type: "featuring", track_count: 3 },
    { name: "Gescu", type: "collaborator", track_count: 4 },
    { name: "Ada Kaleh", type: "remixer", track_count: 2 },
    { name: "Cristi Cons", type: "collaborator", track_count: 3 }
  ],
  "Ada Kaleh": [
    { name: "Sepp", type: "remixer", track_count: 5 },
    { name: "Vlad Caia", type: "remixer", track_count: 2 },
    { name: "Gescu", type: "collaborator", track_count: 3 },
    { name: "Dubfound", type: "collaborator", track_count: 2 },
    { name: "Cap", type: "remixer", track_count: 1 }
  ],
  "Petre Inspirescu": [
    { name: "Arapu", type: "collaborator", track_count: 4 },
    { name: "Rhadoo", type: "collaborator", track_count: 8 },
    { name: "Raresh", type: "collaborator", track_count: 5 },
    { name: "Praslea", type: "remixer", track_count: 3 },
    { name: "Dan Andrei", type: "featuring", track_count: 2 }
  ]
};

// ---- Constants ----

const COLORS = {
  remixer:      '#a855f7',
  collaborator: '#3b82f6',
  featured:     '#22c55e',
  original:     '#f59e0b',
  center:       '#e05588',
  default:      '#8b5cf6'
};

const MIN_RADIUS = 16;
const MAX_RADIUS = 48;
const CENTER_RADIUS = 56;
const LABEL_SIZE_MIN = 10;
const LABEL_SIZE_MAX = 15;

// ---- Embed Mode ----

const _params = new URLSearchParams(window.location.search);
const IS_EMBED = _params.get('embed') === '1';
const AUTO_ARTIST = _params.get('artist');

if (IS_EMBED) {
  document.body.classList.add('embed-mode');
}

// ---- State ----

let svg, g, simulation;
let nodes = [];
let links = [];
let nodeElements, linkElements, labelElements, glowElements;
let centerArtist = null;
let history = [];
let width, height;

let isLoading = false;          // block new requests while one is in flight
let currentAbortController = null; // cancel previous fetch on new request

// ---- DOM Elements ----

const searchContainer = document.getElementById('search-container');
const graphContainer = document.getElementById('graph-container');
const searchForm = document.getElementById('search-form');
const artistInput = document.getElementById('artist-input');
const tooltip = document.getElementById('tooltip');
const backBtn = document.getElementById('back-btn');
const graphSearchForm = document.getElementById('graph-search-form');
const graphSearchInput = document.getElementById('graph-search-input');

// ---- Init ----

function init() {
  setupSVG();
  setupEvents();
}

function setupSVG() {
  width = window.innerWidth;
  height = window.innerHeight;

  svg = d3.select('#graph-svg')
    .attr('width', width)
    .attr('height', height);

  // SVG filters for glow effect
  const defs = svg.append('defs');

  // Glow filter
  const glow = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%').attr('y', '-50%')
    .attr('width', '200%').attr('height', '200%');
  glow.append('feGaussianBlur')
    .attr('stdDeviation', '8')
    .attr('result', 'blur');
  glow.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blur')
    .attr('operator', 'over');

  // Soft glow for links
  const linkGlow = defs.append('filter')
    .attr('id', 'link-glow')
    .attr('x', '-20%').attr('y', '-20%')
    .attr('width', '140%').attr('height', '140%');
  linkGlow.append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'blur');
  linkGlow.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blur')
    .attr('operator', 'over');

  // Zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Main group for everything (zoom/pan target)
  g = svg.append('g');

  // Handle resize
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr('width', width).attr('height', height);
    if (simulation) {
      simulation.force('center', d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    }
  });
}

function setupEvents() {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = artistInput.value.trim();
    if (name) startExploration(name);
  });

  // Graph search bar (visible while graph is shown)
  graphSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = graphSearchInput.value.trim();
    if (name && !isLoading) {
      loadArtist(name);
      graphSearchInput.blur();
    }
  });

  document.querySelectorAll('.hint-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const artist = btn.dataset.artist;
      artistInput.value = artist;
      startExploration(artist);
    });
  });

  backBtn.addEventListener('click', goBack);
}

// ---- Config ----

// API base URL
const API_BASE = 'https://api.underflow.music/api/public';

const USE_MOCK = false; // Set true to use mock data instead of API

// ---- Data Fetching ----

async function fetchRelations(artistName) {
  // Cancel any in-flight request
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  // Try real API first
  if (!USE_MOCK) {
    try {
      const res = await fetch(`${API_BASE}/explore/${encodeURIComponent(artistName)}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.relations && data.relations.length > 0) {
          // Normalize API response to our format
          return data.relations.map(r => ({
            name: r.related_artist_name,
            type: r.relation_type,
            track_count: r.track_count || 1
          }));
        }
      }
      if (res.status === 429) {
        graphSearchInput.value = '';
        graphSearchInput.placeholder = 'Rate limit — try again later';
        return null;
      }
    } catch (e) {
      if (e.name === 'AbortError') return null; // request was cancelled — silently exit
      console.warn('API unavailable, falling back to mock data:', e.message);
    }
  }

  // Fallback to mock data
  const key = Object.keys(MOCK_DATA).find(
    k => k.toLowerCase() === artistName.toLowerCase()
  );
  if (key) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_DATA[key];
  }
  return null;
}

// ---- Graph Logic ----

function startExploration(artistName) {
  // Cancel any in-flight request and reset loading state
  // so the new exploration always takes over
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  isLoading = false;
  setGraphLoading(false);

  // Hide search, show graph
  searchContainer.classList.add('hidden');
  graphContainer.classList.remove('hidden');

  // Reset state
  nodes = [];
  links = [];
  history = [];
  g.selectAll('*').remove();

  // Re-add layer groups in correct order
  g.append('g').attr('class', 'links-layer');
  g.append('g').attr('class', 'nodes-layer');
  g.append('g').attr('class', 'labels-layer');

  // Load artist
  loadArtist(artistName, true);
}

async function loadArtist(artistName, isInitial = false) {
  if (isLoading) return; // ignore clicks while loading
  isLoading = true;
  setGraphLoading(true);

  const relations = await fetchRelations(artistName);

  isLoading = false;
  setGraphLoading(false);

  if (!relations) {
    if (centerArtist) showNotFound(artistName); // don't show error on abort
    return;
  }

  if (centerArtist && centerArtist.toLowerCase() !== artistName.toLowerCase()) {
    history.push(centerArtist);
    backBtn.classList.remove('hidden');
  }
  centerArtist = artistName;
  graphSearchInput.value = artistName;

  // Clear old graph completely — each view is center + direct connections only
  nodes = [];
  links = [];

  // Center node
  const centerNode = {
    id: artistName,
    isCenter: true,
    relationType: 'center',
    radius: CENTER_RADIUS,
    trackCount: 0,
    x: width / 2,
    y: height / 2
  };
  nodes.push(centerNode);

  // Related nodes + links
  relations.forEach(rel => {
    // Avoid duplicate nodes (API may return same artist with different relation types)
    if (!nodes.find(n => n.id.toLowerCase() === rel.name.toLowerCase())) {
      nodes.push({
        id: rel.name,
        isCenter: false,
        radius: scaleRadius(rel.track_count),
        trackCount: rel.track_count,
        relationType: rel.type,
        x: width / 2 + (Math.random() - 0.5) * 20,
        y: height / 2 + (Math.random() - 0.5) * 20
      });
    }

    links.push({
      id: [artistName, rel.name].sort().join('---') + '-' + rel.type,
      source: artistName,
      target: rel.name,
      type: rel.type,
      trackCount: rel.track_count
    });
  });

  // Fade out old, then render new
  if (!isInitial) {
    await fadeOutGraph();
  }
  // Clear SVG layers
  g.select('.links-layer').selectAll('*').remove();
  g.select('.nodes-layer').selectAll('*').remove();
  g.select('.labels-layer').selectAll('*').remove();

  updateGraph(true);
}

function fadeOutGraph() {
  return new Promise(resolve => {
    const duration = 250;
    g.select('.nodes-layer').selectAll('*')
      .transition().duration(duration).style('opacity', 0);
    g.select('.links-layer').selectAll('*')
      .transition().duration(duration).style('opacity', 0);
    g.select('.labels-layer').selectAll('*')
      .transition().duration(duration).style('opacity', 0)
      .on('end', resolve);
    // Fallback in case no elements exist
    setTimeout(resolve, duration + 50);
  });
}

function goBack() {
  if (history.length === 0 || isLoading) return;
  const prev = history.pop();
  if (history.length === 0) backBtn.classList.add('hidden');

  // Don't push to history again — override centerArtist before loadArtist
  centerArtist = null;
  loadArtist(prev);
}

function setGraphLoading(loading) {
  // Dim the graph and show cursor spinner during fetch
  if (graphContainer) {
    graphContainer.style.cursor = loading ? 'wait' : '';
    graphContainer.style.pointerEvents = loading ? 'none' : '';
  }
  if (graphSearchInput) {
    graphSearchInput.style.opacity = loading ? '0.5' : '';
  }
}

function showNotFound(artistName) {
  // Don't change navigation state — just show temporary message
  const prev = graphSearchInput.value;
  graphSearchInput.value = `"${artistName}" — not found`;
  setTimeout(() => {
    if (graphSearchInput.value.includes('not found')) {
      graphSearchInput.value = prev;
    }
  }, 3000);
}

// ---- Rendering ----

function updateGraph(isInitial) {
  // Setup simulation
  if (simulation) simulation.stop();

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(d => d.id)
      .distance(d => 120 + (MAX_RADIUS - scaleRadius(d.trackCount)))
      .strength(0.6)
    )
    .force('charge', d3.forceManyBody()
      .strength(d => d.isCenter ? -600 : -250)
    )
    .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
    .force('collision', d3.forceCollide()
      .radius(d => d.radius + 8)
      .strength(0.8)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.3);

  // ---- Links ----
  const linksLayer = g.select('.links-layer');
  linkElements = linksLayer.selectAll('.link-line')
    .data(links, d => d.id);

  const linkEnter = linkElements.enter()
    .append('line')
    .attr('class', 'link-line')
    .attr('stroke', d => COLORS[d.type] || COLORS.default)
    .attr('stroke-width', d => Math.max(1, Math.min(4, d.trackCount * 0.6)))
    .attr('stroke-opacity', 0)
    .attr('filter', 'url(#link-glow)');

  linkEnter.transition()
    .duration(600)
    .delay((d, i) => i * 30)
    .attr('stroke-opacity', 0.35);

  linkElements = linkEnter.merge(linkElements);

  // ---- Nodes ----
  const nodesLayer = g.select('.nodes-layer');
  const nodeGroups = nodesLayer.selectAll('.node-group')
    .data(nodes, d => d.id);

  const nodeEnter = nodeGroups.enter()
    .append('g')
    .attr('class', 'node-group')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      event.stopPropagation();
      if (!d.isCenter) {
        loadArtist(d.id);
      }
    })
    .on('mouseenter', (event, d) => showTooltip(event, d))
    .on('mousemove', (event) => moveTooltip(event))
    .on('mouseleave', hideTooltip)
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
    );

  // Glow circle (behind main circle, for center node)
  nodeEnter.append('circle')
    .attr('class', 'node-glow')
    .attr('r', 0)
    .attr('fill', 'transparent')
    .attr('stroke', d => d.isCenter ? COLORS.center : 'transparent')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0);

  // Main circle
  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 0)
    .attr('fill', d => nodeColor(d))
    .attr('fill-opacity', d => d.isCenter ? 0.9 : 0.7)
    .attr('stroke', d => nodeColor(d))
    .attr('stroke-width', d => d.isCenter ? 3 : 1.5)
    .attr('stroke-opacity', d => d.isCenter ? 0.5 : 0.3);

  // Animate circles appearing
  nodeEnter.select('.node-circle')
    .transition()
    .duration(500)
    .delay((d, i) => isInitial ? i * 50 : i * 30)
    .ease(d3.easeElasticOut.amplitude(1).period(0.5))
    .attr('r', d => d.radius);

  // Glow for center
  nodeEnter.select('.node-glow')
    .transition()
    .duration(800)
    .delay(200)
    .attr('r', d => d.isCenter ? d.radius + 12 : 0)
    .attr('stroke-opacity', d => d.isCenter ? 0.4 : 0);

  // Merge
  const allNodeGroups = nodeEnter.merge(nodeGroups);

  // Update existing nodes (center change)
  allNodeGroups.select('.node-circle')
    .transition()
    .duration(400)
    .attr('r', d => d.radius)
    .attr('fill', d => nodeColor(d))
    .attr('fill-opacity', d => d.isCenter ? 0.9 : 0.7)
    .attr('stroke', d => nodeColor(d))
    .attr('stroke-width', d => d.isCenter ? 3 : 1.5);

  allNodeGroups.select('.node-glow')
    .transition()
    .duration(400)
    .attr('r', d => d.isCenter ? d.radius + 12 : 0)
    .attr('stroke', d => d.isCenter ? COLORS.center : 'transparent')
    .attr('stroke-opacity', d => d.isCenter ? 0.4 : 0);

  nodeElements = allNodeGroups;

  // ---- Labels ----
  const labelsLayer = g.select('.labels-layer');
  const labels = labelsLayer.selectAll('.node-label')
    .data(nodes, d => d.id);

  const labelEnter = labels.enter()
    .append('text')
    .attr('class', 'node-label')
    .attr('dy', d => d.radius + 16)
    .attr('font-size', d => scaleLabel(d.radius))
    .attr('fill-opacity', 0)
    .text(d => d.id);

  labelEnter.transition()
    .duration(500)
    .delay((d, i) => (isInitial ? i * 50 : i * 30) + 200)
    .attr('fill-opacity', 1);

  labelElements = labelEnter.merge(labels);

  // Update label positions for center change
  labelElements
    .attr('dy', d => d.radius + 16)
    .attr('font-size', d => scaleLabel(d.radius))
    .attr('font-weight', d => d.isCenter ? '700' : '500');

  // ---- Simulation Tick ----
  simulation.on('tick', () => {
    linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeElements
      .attr('transform', d => `translate(${d.x},${d.y})`);

    labelElements
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });

  // Gentle restart
  simulation.alpha(isInitial ? 1 : 0.5).restart();
}

// ---- Tooltip ----

function showTooltip(event, d) {
  const types = links
    .filter(l => (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id)
    .map(l => ({
      artist: (l.source.id || l.source) === d.id ? (l.target.id || l.target) : (l.source.id || l.source),
      type: l.type,
      count: l.trackCount
    }));

  const nameEl = tooltip.querySelector('.tooltip-name');
  const detailsEl = tooltip.querySelector('.tooltip-details');

  nameEl.textContent = d.id;

  if (d.isCenter) {
    detailsEl.innerHTML = `<div style="margin-bottom:4px">${types.length} connections</div>` +
      types.slice(0, 5).map(t =>
        `<span class="tooltip-badge" style="background:${COLORS[t.type]}22;color:${COLORS[t.type]}">${t.type}</span> ${t.artist} (${t.count})`
      ).join('<br>') +
      (types.length > 5 ? `<br><span style="color:var(--text-faint)">+${types.length - 5} more</span>` : '');
  } else {
    detailsEl.innerHTML =
      `<span class="tooltip-badge" style="background:${COLORS[d.relationType]}22;color:${COLORS[d.relationType]}">${d.relationType}</span><br>` +
      `${d.trackCount} shared tracks<br>` +
      `<span style="color:var(--text-faint);font-size:11px">Click to explore</span>`;
  }

  tooltip.classList.remove('hidden');
  moveTooltip(event);
}

function moveTooltip(event) {
  const pad = 16;
  let x = event.clientX + pad;
  let y = event.clientY + pad;

  // Keep tooltip on screen
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) x = event.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight) y = event.clientY - rect.height - pad;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideTooltip() {
  tooltip.classList.add('hidden');
}

// ---- Drag ----

function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.1).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  if (!d.isCenter) {
    d.fx = null;
    d.fy = null;
  }
}

// ---- Helpers ----

function nodeColor(d) {
  if (d.isCenter) return COLORS.center;
  return COLORS[d.relationType] || COLORS.default;
}

function scaleRadius(trackCount) {
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, MIN_RADIUS + trackCount * 4));
}

function scaleLabel(radius) {
  const t = (radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS);
  return Math.round(LABEL_SIZE_MIN + t * (LABEL_SIZE_MAX - LABEL_SIZE_MIN)) + 'px';
}

// ---- Start ----

init();

// Auto-start from URL params
if (AUTO_ARTIST) {
  startExploration(AUTO_ARTIST);
}
