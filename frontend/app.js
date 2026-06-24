/* ─────────────────────────────────────────────────────────────────────────────
   BFHL Frontend — app.js
   ───────────────────────────────────────────────────────────────────────────── */

// ── Config ────────────────────────────────────────────────────────────────────
// Change this to your deployed API URL after hosting
const DEFAULT_API_URL = 'http://localhost:3000';

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const form         = document.getElementById('input-form');
const textarea     = document.getElementById('node-input');
const apiUrlInput  = document.getElementById('api-url');
const submitBtn    = document.getElementById('submit-btn');
const btnText      = submitBtn.querySelector('.btn-text');
const btnIcon      = submitBtn.querySelector('.btn-icon');
const btnLoader    = document.getElementById('btn-loader');

const errorBanner  = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const errorClose   = document.getElementById('error-close');

const resultsSection  = document.getElementById('results-section');
const resUserId       = document.getElementById('res-user-id');
const resEmail        = document.getElementById('res-email');
const resRoll         = document.getElementById('res-roll');
const sumTrees        = document.getElementById('sum-trees');
const sumCycles       = document.getElementById('sum-cycles');
const sumRoot         = document.getElementById('sum-root');
const hierarchiesGrid = document.getElementById('hierarchies-grid');
const invalidBlock    = document.getElementById('invalid-block');
const invalidTags     = document.getElementById('invalid-tags');
const duplicateBlock  = document.getElementById('duplicate-block');
const duplicateTags   = document.getElementById('duplicate-tags');
const rawJson         = document.getElementById('raw-json');
const btnCopy         = document.getElementById('btn-copy');
const btnExample      = document.getElementById('btn-example');

// ── Example Data ──────────────────────────────────────────────────────────────
const EXAMPLE_INPUT = `A->B, A->C, B->D, C->E, E->F,
X->Y, Y->Z, Z->X,
P->Q, Q->R,
G->H, G->H, G->I,
hello, 1->2, A->`;

// ── Input Parser ──────────────────────────────────────────────────────────────
/**
 * Parses the textarea input into an array of strings.
 * Supports: JSON arrays, comma-separated, newline-separated, or mixed.
 */
function parseInput(raw) {
  const text = raw.trim();
  if (!text) return [];

  // Try JSON array first
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (_) { /* fall through */ }
  }

  // Split by comma or newline, strip extra whitespace
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ── Tree Renderer ─────────────────────────────────────────────────────────────
/**
 * Recursively renders a nested tree object as HTML.
 * @param {Object} treeObj - Nested tree, e.g. { A: { B: { D: {} }, C: {} } }
 * @returns {string} HTML string
 */
function renderTree(treeObj) {
  const entries = Object.entries(treeObj);
  if (entries.length === 0) return '';

  let html = '';
  for (const [node, children] of entries) {
    const childrenHtml = renderTree(children);
    html += `
      <div class="t-child-wrap">
        <div class="t-node">
          <span class="t-node-dot"></span>
          ${escHtml(node)}
        </div>
        ${childrenHtml ? `<div class="t-children">${childrenHtml}</div>` : ''}
      </div>`;
  }
  return html;
}

// ── Results Renderer ──────────────────────────────────────────────────────────
function renderResults(data) {
  // User identity
  resUserId.textContent = data.user_id;
  resEmail.textContent  = data.email_id;
  resRoll.textContent   = data.college_roll_number;

  // Summary
  animateNumber(sumTrees,  data.summary.total_trees);
  animateNumber(sumCycles, data.summary.total_cycles);
  sumRoot.textContent = data.summary.largest_tree_root || '—';

  // Hierarchies
  hierarchiesGrid.innerHTML = '';
  for (const h of data.hierarchies) {
    const card = document.createElement('div');
    card.className = `hierarchy-card${h.has_cycle ? ' cycle-card' : ''}`;

    if (h.has_cycle) {
      card.innerHTML = `
        <div class="hierarchy-header">
          <span class="root-badge cycle-badge">⟳ ${escHtml(h.root)}</span>
          <span class="cycle-tag">CYCLE</span>
        </div>
        <div class="cycle-info">Cyclic group — no tree structure available</div>`;
    } else {
      card.innerHTML = `
        <div class="hierarchy-header">
          <span class="root-badge">◈ ${escHtml(h.root)}</span>
          <span class="depth-badge">Depth: ${h.depth}</span>
        </div>
        <div class="tree-wrap">
          ${renderTree(h.tree)}
        </div>`;
    }
    hierarchiesGrid.appendChild(card);
  }

  // Invalid entries
  if (data.invalid_entries.length > 0) {
    invalidTags.innerHTML = data.invalid_entries
      .map(e => `<span class="tag tag-invalid">${escHtml(e) || '(empty)'}</span>`)
      .join('');
    invalidBlock.classList.remove('hidden');
  } else {
    invalidBlock.classList.add('hidden');
  }

  // Duplicate edges
  if (data.duplicate_edges.length > 0) {
    duplicateTags.innerHTML = data.duplicate_edges
      .map(e => `<span class="tag tag-duplicate">${escHtml(e)}</span>`)
      .join('');
    duplicateBlock.classList.remove('hidden');
  } else {
    duplicateBlock.classList.add('hidden');
  }

  // Raw JSON
  rawJson.textContent = JSON.stringify(data, null, 2);

  // Show results
  resultsSection.classList.remove('hidden');
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

/** Animate a number counting up from 0 */
function animateNumber(el, target) {
  const duration = 600;
  const start = performance.now();
  const from = 0;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.textContent = on ? 'Analyzing…' : 'Analyze';
  btnIcon.classList.toggle('hidden', on);
  btnLoader.classList.toggle('hidden', !on);
}

// ── Event Listeners ───────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const input = parseInput(textarea.value);
  if (input.length === 0) {
    showError('Please enter at least one edge string (e.g. "A->B, A->C").');
    return;
  }

  const apiBase = (apiUrlInput.value || DEFAULT_API_URL).replace(/\/$/, '');

  setLoading(true);

  try {
    const response = await fetch(`${apiBase}/bfhl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: input }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    renderResults(data);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      showError(`Cannot reach the API at "${apiBase}". Make sure the backend is running and CORS is enabled.`);
    } else {
      showError(`API error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
});

errorClose.addEventListener('click', hideError);

btnExample.addEventListener('click', () => {
  textarea.value = EXAMPLE_INPUT;
  textarea.focus();
});

btnCopy.addEventListener('click', () => {
  const text = rawJson.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btnCopy.textContent = '✓ Copied!';
    setTimeout(() => {
      btnCopy.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  });
});
