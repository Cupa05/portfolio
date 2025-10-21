const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const toastEl = $('#toast');
function toast(msg, type = 'ok') {
  toastEl.textContent = msg;
  toastEl.className = `toast ${type}`;
  toastEl.hidden = false;
  setTimeout(() => (toastEl.hidden = true), 2500);
}

const serverUrl = `${location.protocol}//${location.host}`;
$('#server-url').textContent = serverUrl;

const listEl = $('#workflow-list');
const nameEl = $('#name');
const fileEl = $('#file');
const editor = $('#editor');
const out = $('#out');
const themeSel = $('#theme');

async function refreshList() {
  const res = await fetch('/workflows');
  const arr = await res.json();
  listEl.innerHTML = '';
  for (const n of arr) {
    const a = document.createElement('a');
    a.textContent = n;
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault(); nameEl.value = n; load();
    });
    listEl.appendChild(a);
  }
}

function formatEditor() {
  try {
    const json = JSON.parse(editor.value);
    editor.value = JSON.stringify(json, null, 2);
    toast('Formatted');
  } catch {
    toast('Invalid JSON', 'err');
  }
}

function validateEditor() {
  try {
    JSON.parse(editor.value);
    toast('Valid JSON');
  } catch (e) {
    toast('Invalid JSON', 'err');
  }
}

async function load() {
  const name = nameEl.value.trim();
  if (!name) return;
  const res = await fetch(`/workflows/${name}`);
  if (!res.ok) { out.textContent = `❌ ${res.status} ${res.statusText}`; return; }
  const json = await res.json();
  editor.value = JSON.stringify(json, null, 2);
  fileEl.textContent = `examples/${name}.json`;
  out.textContent = '';
}

async function save() {
  const name = nameEl.value.trim();
  if (!name) return;
  try {
    const json = JSON.parse(editor.value);
    const res = await fetch(`/workflows/${name}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
    if (res.ok) toast('Saved'); else toast('Save failed', 'err');
    refreshList();
  } catch (e) { toast('Invalid JSON', 'err'); }
}

async function runWebhook() {
  const name = nameEl.value.trim();
  const trig = $('#triggerId').value || 't1';
  const body = $('#webhookBody').value || '{}';
  try {
    const payload = JSON.parse(body);
    const res = await fetch(`/webhook/${name}/${trig}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    out.textContent = res.ok ? JSON.stringify(json, null, 2) : `❌ ${json.error || 'Error'}`;
  } catch (e) { out.textContent = '❌ Invalid JSON body'; }
}

$('#load').addEventListener('click', load);
$('#save').addEventListener('click', save);
$('#format').addEventListener('click', formatEditor);
$('#validate').addEventListener('click', validateEditor);
$('#runWebhook').addEventListener('click', runWebhook);

refreshList();

// Theme handling (top-level)
const THEME_KEY = 'workflow_mvp_theme';
function applyTheme(v){
  if (!v || v === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', v);
  }
}

function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'neon';
  applyTheme(saved);
  if (themeSel) themeSel.value = saved;
}

if (themeSel) {
  themeSel.addEventListener('change', () => {
    const v = themeSel.value;
    localStorage.setItem(THEME_KEY, v);
    applyTheme(v);
    toast(`Theme: ${v}`);
  });
}

initTheme();
