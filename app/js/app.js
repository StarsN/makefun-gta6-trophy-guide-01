// app.js — the Leonida Platinum Atlas guide and tracker.
// Loads the official trophy list from data/trophies.json (a file of this app, so
// it works offline), renders the checklist with its filters and spoiler setting,
// the per-trophy guide pane, the roadmap to the platinum and the missables page.

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story',
  side: 'Side mission',
  collectible: 'Collectible',
  activity: 'Activity',
  feat: 'Free-roam feat',
  completion: 'Completion',
};

const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — The story, start to credits',
    text: 'Play the campaign in order: the opening mission, Chapters 1 to 4, the named story missions and the final mission. Three trophies elsewhere in the list are flagged missable because their official descriptions tie them to one-time story set-pieces — Catch Me If You Can (the VCIA airport beat), Capital Offense (a showroom) and Bad Luck, I Guess (a fail-first moment) — so keep a save before big set-pieces and grab them as they pass.',
  },
  {
    stage: 2,
    title: 'Stage 2 — The people of Leonida',
    text: 'Finish the side strands: the final missions for Andy, Kenton, Billy, Randy and Tyrone, Bret\u2019s hunt and Cal\u2019s fishing challenge. Eight finished strands also complete the silver Strangers & Freaks. Strands unlock in waves as the story opens new areas, so sweep the map for question-mark contacts after each chapter.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Activities and skill',
    text: 'Sample every activity type once for Master of None, then go deep: gold medals in all 42 Shooting Range challenges, a Top Fun drone-race win at all 14 locations, 20 different race wins, 250 stunts, 50 challenges, one full arcade game and a game at the Kolt & Associates\u2019 bowling alley. All repeatable — nothing here can be missed.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Collectibles and the map',
    text: 'The fixed things: 18 meditation spots, 3 completed Collectible Card sets, WAiNK It at 100 locations, 100 vehicles discovered, 10 vehicles registered to the Scooter Bros app, and all 52 areas of Leonida explored. Work region by region and let the counters in this tracker keep count with PlayStation.',
  },
  {
    stage: 5,
    title: 'Stage 5 — Free-roam feats and money',
    text: 'The sandbox trophies: partner feats (lose 4 stars together; 3 shops back-to-back), robberies (5 bank vaults, an armored truck, a jewelry store undetected, one illegal operation per gang), combat feats, and the money counters — $250,000 laundered, $100,000 spent, all 8 garages bought. The hidden oddities (Challenging Tank, Personal Best, The Truth Is Out There, Ten Pin, In The Beginning\u2026) live here too; their guides say plainly where the official description pins down no exact step.',
  },
  {
    stage: 6,
    title: 'Stage 6 — 100% and the platinum',
    text: 'With stages 1 to 5 done, use the game\u2019s own completion counter to find what A Long Road still wants — usually a counter trophy a few short of its target — and finish it. The platinum, Vice Got a Price!, unlocks on its own when the other 54 are earned.',
  },
];

let trophyData = null;
let state = loadState();
let selectedId = null;
let currentView = 'guide';

const el = (id) => document.getElementById(id);

function trophies() {
  return trophyData.trophies;
}

function trophyById(id) {
  return trophies().find((t) => t.id === id);
}

function isMasked(trophy) {
  if (!state.spoilers) return false;
  if (isEarned(state, trophy.id)) return false;
  return trophy.kind === 'story' || trophy.hidden;
}

function displayName(trophy) {
  return isMasked(trophy) ? 'Hidden trophy' : trophy.name;
}

function displayDescription(trophy) {
  if (isMasked(trophy)) {
    return trophy.kind === 'story'
      ? 'A story trophy, hidden by the spoiler setting until you earn it.'
      : 'A hidden trophy on PlayStation, masked by the spoiler setting until you earn it.';
  }
  return trophy.description;
}

function gradeChip(grade) {
  return `<span class="grade-badge grade-${grade}">${GRADE_LABEL[grade]}</span>`;
}

function tagRow(trophy) {
  const tags = [`<span class="kind-tag">${KIND_LABEL[trophy.kind]}</span>`];
  if (trophy.hidden) tags.push('<span class="secret-tag">Secret</span>');
  if (trophy.missable) tags.push('<span class="missable-tag">Missable</span>');
  if (trophy.target) {
    const done = getCount(state, trophy.id);
    tags.push(`<span class="target-tag">${done} / ${trophy.target.count} ${trophy.target.unit}</span>`);
  }
  return tags.join(' ');
}

function renderSummary() {
  const all = trophies();
  const earned = all.filter((t) => isEarned(state, t.id));
  el('earned-count').textContent = String(earned.length);
  el('earned-total').textContent = ` / ${all.length}`;
  const pct = all.length ? Math.round((earned.length / all.length) * 100) : 0;
  el('progress-fill').style.width = `${pct}%`;
  el('progress-percent').textContent = `${pct}% earned`;
  el('grade-chips').innerHTML = GRADE_ORDER.map((grade) => {
    const ofGrade = all.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => isEarned(state, t.id)).length;
    return `<span class="grade-chip grade-${grade}">${GRADE_LABEL[grade]} ${got}/${ofGrade.length}</span>`;
  }).join('');
  const missables = all.filter((t) => t.missable && !isEarned(state, t.id));
  el('missable-count').textContent = String(missables.length);
}

function trophyMatchesFilters(trophy) {
  const query = el('search-box').value.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  const grade = el('grade-filter').value;
  if (grade !== 'all' && trophy.grade !== grade) return false;
  const kind = el('kind-filter').value;
  if (kind !== 'all' && trophy.kind !== kind) return false;
  const status = el('status-filter').value;
  if (status === 'earned' && !isEarned(state, trophy.id)) return false;
  if (status === 'remaining' && isEarned(state, trophy.id)) return false;
  if (el('missable-only').checked && !trophy.missable) return false;
  return true;
}

function trophyCard(trophy) {
  const earned = isEarned(state, trophy.id);
  const card = document.createElement('article');
  card.className = `trophy-card${earned ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`;
  card.dataset.trophyId = String(trophy.id);
  card.innerHTML = `
    <label class="earned-box" title="Mark earned">
      <input type="checkbox" class="earned-check" ${earned ? 'checked' : ''}>
    </label>
    <div class="card-body">
      <div class="card-top">${gradeChip(trophy.grade)}<h3 class="card-name">${displayName(trophy)}</h3></div>
      <p class="card-desc">${displayDescription(trophy)}</p>
      <div class="card-tags">${tagRow(trophy)}</div>
    </div>`;
  card.querySelector('.earned-check').addEventListener('change', (event) => {
    setEarned(state, trophy.id, event.target.checked);
    renderAll();
  });
  card.querySelector('.card-body').addEventListener('click', () => selectTrophy(trophy.id));
  return card;
}

function renderTrophyList() {
  const list = el('trophy-list');
  list.innerHTML = '';
  const shown = trophies().filter(trophyMatchesFilters);
  el('result-count').textContent = `Showing ${shown.length} of ${trophies().length} trophies`;
  for (const trophy of shown) list.appendChild(trophyCard(trophy));
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'No trophies match those filters.';
    list.appendChild(empty);
  }
}

function sourceLinks() {
  return trophyData.sources
    .map((s) => `<a href="${s.url}">${s.url.replace('https://', '')}</a>`)
    .join(' · ');
}

function renderDetail(trophy) {
  const box = el('detail-content');
  const empty = el('detail-empty');
  if (!trophy) {
    box.hidden = true;
    empty.hidden = false;
    return;
  }
  const earned = isEarned(state, trophy.id);
  empty.hidden = true;
  box.hidden = false;
  const counter = trophy.target
    ? `<div class="counter-row">
         <span class="counter-label">Progress: <strong>${getCount(state, trophy.id)} / ${trophy.target.count}</strong> ${trophy.target.unit}</span>
         <button type="button" class="counter-btn" data-delta="-1">−</button>
         <button type="button" class="counter-btn" data-delta="1">+</button>
         <button type="button" class="counter-btn" data-delta="10">+10</button>
       </div>`
    : '';
  const missableWarning = trophy.missable
    ? `<div class="missable-warning"><strong>Missable — flagged from the official description.</strong> Earn it when its moment comes and keep a save before it. ${trophyData.missableNote}</div>`
    : '';
  box.innerHTML = `
    <div class="detail-top">${gradeChip(trophy.grade)}<span class="kind-tag">${KIND_LABEL[trophy.kind]}</span>
      ${trophy.hidden ? '<span class="secret-tag">Secret on PSN</span>' : ''}${trophy.missable ? '<span class="missable-tag">Missable</span>' : ''}</div>
    <h2 class="detail-name">${displayName(trophy)}</h2>
    <p class="detail-desc">“${displayDescription(trophy)}”</p>
    ${missableWarning}
    <h3 class="detail-heading">Guide</h3>
    <p class="detail-guide">${isMasked(trophy) ? 'The guide for this trophy is hidden by the spoiler setting until you earn it.' : trophy.guide}</p>
    ${counter}
    <h3 class="detail-heading">Sources</h3>
    <p class="detail-sources">${trophy.sources}</p>
    <p class="detail-source-links">${sourceLinks()}</p>
    <button type="button" id="detail-toggle" class="toggle-earned">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
  box.querySelector('#detail-toggle').addEventListener('click', () => {
    setEarned(state, trophy.id, !isEarned(state, trophy.id));
    renderAll();
  });
  box.querySelectorAll('.counter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = getCount(state, trophy.id) + Number(btn.dataset.delta);
      setCount(state, trophy.id, Math.min(next, trophy.target.count));
      if (trophy.target && getCount(state, trophy.id) >= trophy.target.count) setEarned(state, trophy.id, true);
      renderAll();
    });
  });
}

function selectTrophy(id) {
  selectedId = id;
  renderTrophyList();
  renderDetail(trophyById(id));
}

function renderRoadmap() {
  const wrap = el('roadmap-stages');
  wrap.innerHTML = '';
  for (const stage of ROADMAP_STAGES) {
    const members = trophies().filter((t) => t.stage === stage.stage);
    const got = members.filter((t) => isEarned(state, t.id)).length;
    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    const rows = members
      .map((t) => {
        const warn = t.missable ? ' <span class="missable-tag">Missable</span>' : '';
        const done = isEarned(state, t.id) ? ' class="stage-done"' : '';
        return `<li${done}>${gradeChip(t.grade)} <span class="stage-name">${displayName(t)}</span>${warn}</li>`;
      })
      .join('');
    section.innerHTML = `
      <h3>${stage.title} <span class="stage-progress">${got}/${members.length} earned</span></h3>
      <p class="stage-text">${stage.text}</p>
      <ul class="stage-list">${rows}</ul>`;
    wrap.appendChild(section);
  }
}

function renderMissables() {
  el('missables-note').textContent = trophyData.missableNote;
  const list = el('missable-list');
  list.innerHTML = '';
  for (const trophy of trophies().filter((t) => t.missable)) {
    const item = document.createElement('article');
    item.className = 'missable-item';
    item.innerHTML = `
      <div class="card-top">${gradeChip(trophy.grade)}<h3 class="card-name">${trophy.name}</h3></div>
      <p class="card-desc">“${trophy.description}”</p>
      <p class="missable-guide">${trophy.guide}</p>
      <p class="detail-sources">${trophy.sources}</p>`;
    list.appendChild(item);
  }
}

function showView(view) {
  currentView = view;
  el('guide-view').hidden = view !== 'guide';
  el('roadmap-view').hidden = view !== 'roadmap';
  el('missables-view').hidden = view !== 'missables';
  el('tab-guide').classList.toggle('active', view === 'guide');
  el('tab-roadmap').classList.toggle('active', view === 'roadmap');
  el('tab-missables').classList.toggle('active', view === 'missables');
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

function renderAll() {
  renderSummary();
  renderTrophyList();
  renderDetail(selectedId ? trophyById(selectedId) : null);
  if (currentView === 'roadmap') renderRoadmap();
  if (currentView === 'missables') renderMissables();
}

function wireControls() {
  ['search-box', 'grade-filter', 'kind-filter', 'status-filter', 'missable-only'].forEach((id) => {
    el(id).addEventListener('input', renderTrophyList);
    el(id).addEventListener('change', renderTrophyList);
  });
  el('spoiler-mode').checked = state.spoilers;
  el('spoiler-mode').addEventListener('change', (event) => {
    state.spoilers = event.target.checked;
    saveState(state);
    renderAll();
  });
  el('tab-guide').addEventListener('click', () => showView('guide'));
  el('tab-roadmap').addEventListener('click', () => showView('roadmap'));
  el('tab-missables').addEventListener('click', () => showView('missables'));
  el('export-button').addEventListener('click', () => exportProgress(state));
  el('reset-button').addEventListener('click', () => {
    state = defaultState();
    saveState(state);
    el('spoiler-mode').checked = false;
    selectedId = null;
    renderAll();
  });
  el('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = parseImportedProgress(await file.text());
      state = imported;
      saveState(state);
      el('spoiler-mode').checked = state.spoilers;
      renderAll();
    } catch {
      el('io-note').textContent = 'That file could not be read as an exported progress file.';
    }
    event.target.value = '';
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  trophyData = await response.json();
  wireControls();
  renderAll();
}

boot();
