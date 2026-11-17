// The desk controller. It holds only page state (what is selected, half-written
// forms, the speed) and changes the simulation only through `act` and `step`.

import { createState, step, act, buildDeskView, skipToNextEvent } from '../sim/index.js';
import { RANKS } from '../data/ranks.js';
import { UI } from '../data/ui.js';
import {
  renderCalendar, renderCounter, counterKey, renderIntake, renderPostingForm,
  renderBoard, renderLedger, renderIncidentTray, renderReport,
} from './render.js';

const $ = (sel) => document.querySelector(sel);

let sim = null;
let view = null;
let speed = 0; // 0 is paused
let scene = 'desk';
let chosen = null; // quest id being written up
let postDraft = null;
let regDraft = {};
let lastCounterKey = null;
let lastFormKey = null;
const readReports = new Set();
let openReport = null;

// --- Starting -------------------------------------------------------------------

function start(seed) {
  sim = createState(seed);
  speed = 0;
  scene = 'desk';
  chosen = null;
  postDraft = null;
  regDraft = {};
  lastCounterKey = lastFormKey = null;
  readReports.clear();
  openReport = null;
  // The first morning: let the night run to opening time.
  while (!buildDeskView(sim).counterOpen) step(sim, []);
  $('#appointment').hidden = true;
  $('#game').hidden = false;
  refresh();
}

// --- Acting ---------------------------------------------------------------------

function send(action) {
  const result = act(sim, { ...action, by: 'player' });
  if (!result.ok) flash(result.reason);
  refresh();
  return result.ok;
}

function flash(text) {
  const el = $('#note');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => (el.hidden = true), 3000);
}

function choose(questId) {
  const r = view.requests.find((x) => x.quest === questId);
  if (!r) return;
  chosen = questId;
  postDraft = {
    rank: r.account.rank,
    level: RANKS[r.account.rank].minLevel,
    hazards: [...r.account.hazards],
    slots: [''],
    reward: r.account.offer,
  };
  lastFormKey = null;
  refresh();
}

// --- Drawing ----------------------------------------------------------------------

function refresh() {
  view = buildDeskView(sim);
  if (chosen !== null && !view.requests.some((r) => r.quest === chosen)) {
    chosen = null;
    postDraft = null;
  }

  $('#calendar').innerHTML = renderCalendar(view);
  for (const b of document.querySelectorAll('[data-speed]')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed));
  $('#scene-desk').hidden = scene !== 'desk';
  $('#scene-board').hidden = scene !== 'board';
  $('#turn').textContent = scene === 'desk' ? 'Turn to the board' : 'Turn back to the desk';

  // Forms are redrawn only when what they are about changes, so typing survives
  // the clock ticking.
  const ck = counterKey(view);
  if (ck !== lastCounterKey) {
    regDraft = {};
    $('#counter').innerHTML = renderCounter(view, regDraft);
    lastCounterKey = ck;
  } else {
    const q = $('#counter .queue');
    const fresh = renderCounter(view, regDraft).match(/<p class="queue">[\s\S]*<\/p>$/);
    if (q && fresh) q.outerHTML = fresh[0];
    else if (!q && fresh) $('#counter').insertAdjacentHTML('beforeend', fresh[0]);
  }
  const fk = chosen === null ? 'none' : `q${chosen}`;
  if (fk !== lastFormKey) {
    $('#posting').innerHTML = renderPostingForm(view.requests.find((r) => r.quest === chosen), postDraft);
    lastFormKey = fk;
  }

  $('#intake').innerHTML = renderIntake(view, chosen);
  $('#intake-count').textContent = view.requests.length ? `(${view.requests.length})` : '';
  $('#ledger').innerHTML = renderLedger(view);
  $('#incidents').innerHTML = renderIncidentTray(view, readReports);
  const unread = view.reports.filter((r) => !readReports.has(r.id)).length;
  $('#incident-count').textContent = unread ? `(${unread} unread)` : '';
  if (scene === 'board') $('#board').innerHTML = renderBoard(view);
  $('#board-count').textContent = `${view.board.length} pinned, ${view.out.length} out`;

  $('#report').hidden = openReport === null;
  if (openReport !== null) $('#report').innerHTML = renderReport(view.reports.find((r) => r.id === openReport));
}

// --- Time ------------------------------------------------------------------------

let last = 0;
let acc = 0;
function frame(now) {
  const dt = Math.min(1000, now - (last || now));
  last = now;
  if (sim && speed > 0 && openReport === null) {
    acc += dt;
    const per = view.counterOpen ? UI.msPerHour / speed : UI.msPerNightHour;
    let moved = false;
    while (acc >= per) {
      acc -= per;
      step(sim, []);
      moved = true;
    }
    if (moved) refresh();
  } else {
    acc = 0;
  }
  requestAnimationFrame(frame);
}

// --- Wiring ----------------------------------------------------------------------

function readPostDraft(form) {
  const data = new FormData(form);
  postDraft.rank = data.get('rank') === null ? postDraft.rank : Number(data.get('rank'));
  postDraft.level = Number(data.get('level')) || 1;
  postDraft.hazards = data.getAll('hazard');
  postDraft.slots = [...form.querySelectorAll('select[name="slot"]')].map((s) => s.value);
  postDraft.reward = Number(data.get('reward')) || 0;
}

document.addEventListener('input', (ev) => {
  const form = ev.target.closest('form');
  if (!form) return;
  if (form.dataset.form === 'post') readPostDraft(form);
  if (form.dataset.form === 'register') {
    const data = new FormData(form);
    regDraft.cls = data.get('cls');
    if (data.get('reg-rank') !== null) regDraft.rank = Number(data.get('reg-rank'));
    form.querySelector('button[type="submit"]').disabled = regDraft.rank === undefined;
  }
});

document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const form = ev.target;
  if (form.dataset.form === 'register') {
    const data = new FormData(form);
    if (data.get('reg-rank') === null) return flash('Choose a rank first.');
    send({ type: 'register', adv: Number(form.dataset.adv), cls: data.get('cls'), rank: Number(data.get('reg-rank')) });
  }
  if (form.dataset.form === 'post') {
    readPostDraft(form);
    const ok = send({
      type: 'post',
      quest: Number(form.dataset.quest),
      posting: {
        rank: postDraft.rank,
        level: postDraft.level,
        reward: postDraft.reward,
        hazards: postDraft.hazards,
        slots: postDraft.slots.map((c) => (c ? [c] : [])),
      },
    });
    if (ok) {
      chosen = null;
      postDraft = null;
      refresh();
    }
  }
});

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act], [data-speed]');
  if (!el) return;
  if (el.dataset.speed !== undefined) {
    speed = Number(el.dataset.speed);
    refresh();
    return;
  }
  const quest = Number(el.dataset.quest);
  const party = Number(el.dataset.party);
  switch (el.dataset.act) {
    case 'choose': return choose(quest);
    case 'reject': return send({ type: 'reject', quest });
    case 'approve': return send({ type: 'approve', party });
    case 'refuse': return send({ type: 'refuse', party });
    case 'pull': return send({ type: 'pull', quest });
    case 'reprice': {
      const input = document.querySelector(`[data-reprice="${quest}"]`);
      return send({ type: 'reprice', quest, reward: Number(input.value) });
    }
    case 'add-place':
    case 'drop-place': {
      readPostDraft(el.closest('form'));
      if (el.dataset.act === 'add-place') postDraft.slots.push('');
      else postDraft.slots.pop();
      lastFormKey = null;
      return refresh();
    }
    case 'next': {
      speed = 0;
      skipToNextEvent(sim, UI.nextEventMaxHours);
      return refresh();
    }
    case 'turn':
      scene = scene === 'desk' ? 'board' : 'desk';
      return refresh();
    case 'open-report':
      openReport = Number(el.dataset.report);
      readReports.add(openReport);
      return refresh();
    case 'close-report':
      openReport = null;
      return refresh();
    case 'new-game':
      $('#game').hidden = true;
      $('#appointment').hidden = false;
      speed = 0;
      return;
    default:
  }
});

$('#appointment form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const seed = new FormData(ev.target).get('seed').trim() || String(Math.floor(Math.random() * 1e9));
  start(seed);
});
$('#seed').value = String(Math.floor(Math.random() * 1e9));

requestAnimationFrame(frame);

// For checking the page by hand from the console. Read-only use only.
window.guild = { get view() { return view; } };
