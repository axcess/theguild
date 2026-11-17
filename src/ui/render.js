// Pure rendering: desk view and page state in, HTML text out. No DOM access, so
// these functions also run under Node for tests.

import { CLASSES, CLASS_IDS } from '../data/classes.js';
import { RANKS } from '../data/ranks.js';
import { HAZARDS, HAZARD_IDS } from '../data/quests.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const rank = (r) => RANKS[r].id;
const cls = (c) => CLASSES[c].name;
const hazard = (h) => HAZARDS[h].name;
const article = (w) => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);
const clock = (hour) => `${String(hour).padStart(2, '0')}:00`;
const PHASES = { morning: 'Morning', midday: 'Midday', evening: 'Evening', night: 'Night' };

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// A slight, stable tilt per id, so paper never sits perfectly square.
function tilt(id, spread = 1.6) {
  const x = Math.sin(id * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * spread;
}

function places(slots) {
  return slots.map((s) => (s.length ? s.map(cls).join(' or ') : 'anyone')).join('; ');
}

export function renderCalendar(view) {
  return `
    <div class="cal-day">Day ${view.day}</div>
    <div class="cal-time">${clock(view.hour)}</div>
    <div class="cal-phase">${PHASES[view.phase]}${view.counterOpen ? '' : ', counter closed'}</div>`;
}

// --- The counter -------------------------------------------------------------

export function counterKey(view) {
  const head = view.queue[0];
  if (!view.counterOpen) return 'closed';
  if (!head) return 'empty';
  return `${head.kind}:${head.adv ?? head.party}`;
}

export function renderCounter(view, draft) {
  if (!view.counterOpen) {
    return `<p class="quiet">The hall is dark. The counter opens at six.</p>${renderQueueLine(view)}`;
  }
  const head = view.queue[0];
  if (!head) return `<p class="quiet">Nobody at the counter.</p>`;
  return (head.kind === 'newcomer' ? renderNewcomer(head, draft) : renderPickup(head)) + renderQueueLine(view);
}

function portrait(name, tells) {
  const sling = tells.includes('injured') ? '<span class="tell">arm strapped up, walks stiffly</span>' : '';
  return `<div class="portrait" style="--tilt:${tilt(name.length)}deg"><span>${esc(initials(name))}</span></div>${sling}`;
}

function renderNewcomer(n, draft) {
  const chosenCls = draft.cls ?? n.claim.cls;
  const clsOptions = CLASS_IDS.map((c) => `<option value="${c}"${c === chosenCls ? ' selected' : ''}>${cls(c)}</option>`).join('');
  const rankBoxes = RANKS.map(
    (r, i) => `<label class="box"><input type="radio" name="reg-rank" value="${i}"${draft.rank === i ? ' checked' : ''}><span>${r.id}</span></label>`,
  ).join('');
  return `
    <div class="visitor">
      ${portrait(n.name, n.tells)}
      <blockquote class="speech">"${esc(n.name)}. I'm ${article(cls(n.claim.cls))}, level ${n.claim.level}. Where do I sign?"</blockquote>
    </div>
    <form class="paper form reg" data-form="register" data-adv="${n.adv}">
      <h3>Registration</h3>
      <div class="row"><span class="label">Name</span><span class="hand">${esc(n.name)}</span></div>
      <div class="row"><label class="label" for="reg-cls">Class</label><select id="reg-cls" name="cls">${clsOptions}</select></div>
      <div class="row"><span class="label">Rank</span><span class="boxes">${rankBoxes}</span></div>
      <button type="submit" class="stamp" ${draft.rank === undefined ? 'disabled' : ''}>Register</button>
    </form>`;
}

function renderPickup(p) {
  const leader = p.members.find((m) => m.leader) ?? p.members[0];
  const short = p.short ? ` We're ${p.posting.slots.length - p.members.length} short, but we'll manage.` : '';
  const rows = p.members
    .map(
      (m) => `<tr>
        <td class="hand">${esc(m.name)}${m.leader ? ' (leading)' : ''}</td>
        <td>${m.record ? `${cls(m.record.cls)}, ${rank(m.record.rank)}` : ''}</td>
        <td>${esc(m.place.length ? m.place.map(cls).join(' or ') : 'anyone')}</td>
        <td>${m.tells.includes('injured') ? 'hurt' : ''}</td>
      </tr>`,
    )
    .join('');
  const hz = p.posting.hazards.length ? p.posting.hazards.map(hazard).join(', ') : 'none listed';
  return `
    <div class="visitor">
      ${portrait(leader.name, leader.tells)}
      <blockquote class="speech">"We'll take '${esc(p.title)}'.${esc(short)}"</blockquote>
    </div>
    <div class="paper form slip" data-form="pickup" data-party="${p.party}">
      <h3>Pickup slip</h3>
      <p class="small">Posted at rank ${rank(p.posting.rank)}, level ${p.posting.level}, ${p.posting.slots.length} ${p.posting.slots.length === 1 ? 'place' : 'places'}. Hazards: ${esc(hz)}.</p>
      <table><thead><tr><th>Name</th><th>On record</th><th>Place</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="stamps">
        <button type="button" class="stamp" data-act="approve" data-party="${p.party}">Approve</button>
        <button type="button" class="stamp red" data-act="refuse" data-party="${p.party}">Refuse</button>
      </div>
    </div>`;
}

function renderQueueLine(view) {
  const rest = view.counterOpen ? view.queue.slice(1) : view.queue;
  if (!rest.length) return '';
  const who = rest.slice(0, 5).map((q) => (q.kind === 'newcomer' ? esc(q.name.split(' ')[0]) : `${esc(view.names[q.members?.[0]?.id] ?? 'a party')}'s party`));
  return `<p class="queue">Waiting: ${who.join(', ')}${rest.length > 5 ? ` and ${rest.length - 5} more` : ''}.</p>`;
}

// --- The intake tray and the posting form ---------------------------------------

export function renderIntake(view, selected) {
  if (!view.requests.length) return '<p class="quiet">The tray is empty.</p>';
  return view.requests
    .map((r) => {
      const said = [`Says it's rank ${rank(r.account.rank)}.`];
      if (r.account.hazards.length) said.push(`Mentions ${r.account.hazards.map(hazard).join(' and ')}.`);
      said.push(`Offers ${r.account.offer} gold.`);
      return `<button type="button" class="paper request${r.quest === selected ? ' chosen' : ''}" data-act="choose" data-quest="${r.quest}" style="--tilt:${tilt(r.quest)}deg">
        <span class="hand">"${esc(r.title)}"</span>
        <span class="by">${esc(r.client)}</span>
        <span class="small">${said.join(' ')}</span>
      </button>`;
    })
    .join('');
}

export function renderPostingForm(request, draft) {
  if (!request) return '<p class="quiet">Pick a request from the tray to write it up.</p>';
  const rankBoxes = RANKS.map(
    (r, i) => `<label class="box"><input type="radio" name="rank" value="${i}"${draft.rank === i ? ' checked' : ''}><span>${r.id}</span></label>`,
  ).join('');
  const hazards = HAZARD_IDS.map(
    (h) => `<label class="tick"><input type="checkbox" name="hazard" value="${h}"${draft.hazards.includes(h) ? ' checked' : ''}> ${hazard(h)}</label>`,
  ).join('');
  const placeRows = draft.slots
    .map((slot, i) => {
      const opts = [`<option value="">Anyone</option>`, ...CLASS_IDS.map((c) => `<option value="${c}"${slot === c ? ' selected' : ''}>${cls(c)}</option>`)].join('');
      return `<li><select name="slot" data-slot="${i}" aria-label="Place ${i + 1}">${opts}</select></li>`;
    })
    .join('');
  return `
    <form class="paper form posting" data-form="post" data-quest="${request.quest}">
      <h3>Posting</h3>
      <p class="hand title">"${esc(request.title)}"</p>
      <p class="small">For ${esc(request.client)}.</p>
      <div class="row"><span class="label">Rank</span><span class="boxes">${rankBoxes}</span></div>
      <div class="row"><label class="label" for="post-level">Recommended level</label><input id="post-level" name="level" type="number" min="1" max="40" value="${draft.level}"></div>
      <div class="row top"><span class="label">Hazards</span><span class="ticks">${hazards}</span></div>
      <div class="row top"><span class="label">Places</span>
        <span><ol class="places">${placeRows}</ol>
          <button type="button" class="pen" data-act="add-place"${draft.slots.length >= 6 ? ' disabled' : ''}>Add a place</button>
          <button type="button" class="pen" data-act="drop-place"${draft.slots.length <= 1 ? ' disabled' : ''}>Remove one</button></span></div>
      <div class="row"><label class="label" for="post-reward">Reward</label><input id="post-reward" name="reward" type="number" min="0" value="${draft.reward}"> gold</div>
      <div class="stamps">
        <button type="submit" class="stamp">Pin to board</button>
        <button type="button" class="stamp red" data-act="reject" data-quest="${request.quest}">Reject</button>
      </div>
    </form>`;
}

// --- The board -----------------------------------------------------------------

const BOARD_STATE = { posted: 'Waiting for takers', forming: 'Party forming', awaiting: 'At the counter' };

export function renderBoard(view) {
  const pinned = view.board
    .map((b) => {
      const p = b.posting;
      const hz = p.hazards.length ? `Beware: ${p.hazards.map(hazard).join(', ')}.` : '';
      const status = b.state === 'forming' ? `${BOARD_STATE.forming}, ${b.filled} of ${p.slots.length}` : BOARD_STATE[b.state];
      const tools =
        b.state === 'posted'
          ? `<div class="tools"><input type="number" min="0" value="${p.reward}" data-reprice="${b.quest}" aria-label="New reward">
               <button type="button" class="pen" data-act="reprice" data-quest="${b.quest}">Reprice</button>
               <button type="button" class="pen" data-act="pull" data-quest="${b.quest}">Pull it down</button></div>`
          : '';
      return `<div class="paper pinned" style="--tilt:${tilt(b.quest, 2.5)}deg">
        <span class="pin"></span>
        <span class="rank">${rank(p.rank)}</span>
        <p class="hand">"${esc(b.title)}"</p>
        <p class="small">Level ${p.level} or better. ${p.slots.length === 1 ? 'One' : p.slots.length} ${p.slots.length === 1 ? 'place' : 'places'}: ${esc(places(p.slots))}. ${p.reward} gold.</p>
        <p class="small">${esc(hz)}</p>
        <p class="status">${status}</p>
        ${tools}
      </div>`;
    })
    .join('');
  const out = view.out.length
    ? `<ul class="out">${view.out
        .map((o) => `<li><span class="hand">${esc(o.title)}</span>: ${o.members.map((id) => esc(view.names[id])).join(', ')}</li>`)
        .join('')}</ul>`
    : '<p class="quiet">Nobody is out.</p>';
  return `
    <section class="cork">${pinned || '<p class="quiet">The board is bare.</p>'}</section>
    <section class="paper road"><h3>Out on the road</h3>${out}</section>`;
}

// --- The ledger and incident tray -----------------------------------------------

const OUTCOME = { success: 'done', partial: 'half done, turned back', retreat: 'turned back', wiped: 'nobody came back' };

export function ledgerLine(e, view) {
  const n = (id) => esc(view.names[id] ?? 'someone');
  const q = (id) => `"${esc(view.titles[id] ?? 'a job')}"`;
  switch (e.type) {
    case 'arrive': return `${n(e.adv)} came in off the road.`;
    case 'register': return `Registered ${n(e.adv)}: ${cls(e.cls)}, rank ${rank(e.rank)}.`;
    case 'request': return `${esc(e.client)} brought a request: "${esc(e.title)}".`;
    case 'post': return `Pinned ${q(e.quest)}.`;
    case 'reject': return `Turned down ${q(e.quest)}.`;
    case 'pull': return `Pulled ${q(e.quest)} off the board.`;
    case 'reprice': return `Repriced ${q(e.quest)} at ${e.reward} gold.`;
    case 'party_formed': return `${n(e.leader)} took ${q(e.quest)} and is looking for company.`;
    case 'party_join': return `${n(e.adv)} signed on for ${q(e.quest)}.`;
    case 'party_disband': return e.reason === 'refused' ? `The party for ${q(e.quest)} broke up after the refusal.` : `The party for ${q(e.quest)} gave up waiting.`;
    case 'pickup_requested': return `${n(e.leader)}'s party is ready to set out for ${q(e.quest)}.`;
    case 'pickup_approved': return `Approved the party for ${q(e.quest)}.`;
    case 'pickup_refused': return `Refused the party for ${q(e.quest)}.`;
    case 'depart': return `A party set out for ${q(e.quest)}.`;
    case 'return': return `Back from ${q(e.quest)}: ${OUTCOME[e.outcome]}.${e.payEach ? ` Paid ${e.payEach} gold each.` : ''}`;
    case 'injured': return `${n(e.adv)} came back hurt.`;
    case 'death': return `${n(e.victim)} did not come back from ${q(e.quest)}.`;
    case 'leave': return `${n(e.adv)} left town.`;
    case 'level_up': return `${n(e.adv)} carries themselves with more confidence.`;
    case 'posting_expired': return `Nobody took ${q(e.quest)}. It came down.`;
    case 'request_lapsed': return `${q(e.quest)} sat in the tray too long. The client went elsewhere.`;
    case 'incident_report': return `An incident report was filed on ${q(e.quest)}.`;
    default: return '';
  }
}

export function renderLedger(view) {
  const lines = view.ledger
    .map((e) => [e, ledgerLine(e, view)])
    .filter(([, text]) => text)
    .reverse()
    .map(([e, text]) => `<li><span class="when">${clock(e.t % 24)}</span> ${text.charAt(0).toUpperCase()}${text.slice(1)}</li>`)
    .join('');
  return lines ? `<ol class="lines">${lines}</ol>` : '<p class="quiet">Nothing written yet today.</p>';
}

const BLAME = { paperwork: 'The paperwork', adventurer: 'Their own choices', luck: 'Bad luck' };

export function renderIncidentTray(view, read) {
  if (!view.reports.length) return '<p class="quiet">No reports. Keep it that way.</p>';
  return [...view.reports]
    .reverse()
    .slice(0, 12)
    .map(
      (r) => `<button type="button" class="paper report${read.has(r.id) ? '' : ' unread'}" data-act="open-report" data-report="${r.id}" style="--tilt:${tilt(r.id)}deg">
        <span class="small">No. ${r.id}, day ${Math.floor(r.tick / 24) + 1}</span>
        <span class="hand">${r.kind === 'death' ? `Death of ${esc(r.name)}` : `Failed: ${esc(r.title)}`}</span>
      </button>`,
    )
    .join('');
}

export function renderReport(r) {
  const groups = ['paperwork', 'adventurer', 'luck']
    .map((b) => {
      const causes = r.causes.filter((c) => c.blame === b);
      if (!causes.length) return '';
      return `<h4>${BLAME[b]}</h4><ul>${causes.map((c) => `<li>${esc(c.text.charAt(0).toUpperCase() + c.text.slice(1))}.</li>`).join('')}</ul>`;
    })
    .join('');
  return `
    <article class="paper sheet">
      <p class="small">Incident report No. ${r.id}. Day ${Math.floor(r.tick / 24) + 1}.</p>
      <h3>${r.kind === 'death' ? `The death of ${esc(r.name)}` : 'A failed quest'}</h3>
      <p class="hand">"${esc(r.title)}". Outcome: ${esc(OUTCOME[r.outcome] ?? r.outcome)}.</p>
      ${groups}
      <button type="button" class="stamp" data-act="close-report">Filed</button>
    </article>`;
}
