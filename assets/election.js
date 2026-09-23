const ELECTION_STORAGE_KEY = 'elections-2026-parana';
const THEME_STORAGE_KEY = 'resume-theme';

const form = document.getElementById('election-form');
const status = document.getElementById('save-status');
const root = document.documentElement;
let candidateCatalog = {};

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  const isDark = theme === 'dark';
  const toggle = document.getElementById('election-theme-toggle');
  const icon = document.getElementById('election-theme-icon');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'Mudar para modo dia' : 'Mudar para modo noite');
  icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function setStatus(message) {
  status.textContent = message;
  window.clearTimeout(setStatus.timeout);
  setStatus.timeout = window.setTimeout(() => {
    status.textContent = 'salvamento automático';
  }, 1800);
}

function saveForm() {
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem(ELECTION_STORAGE_KEY, JSON.stringify(data));
  setStatus('salvo neste navegador');
}

function restoreForm() {
  try {
    const data = JSON.parse(localStorage.getItem(ELECTION_STORAGE_KEY) || '{}');
    Object.entries(data).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    });
  } catch {
    localStorage.removeItem(ELECTION_STORAGE_KEY);
  }
}

function updateCandidateMatch(card) {
  const numberField = card.querySelector('.candidate-number');
  const nameField = card.querySelector('input:not(.candidate-number)');
  const photo = card.querySelector('.candidate-photo');
  const candidate = candidateCatalog[`${card.dataset.office}:${numberField.value}`];

  if (!candidate) {
    if (nameField.dataset.autofilled === 'true') {
      nameField.value = '';
      delete nameField.dataset.autofilled;
    }
    photo.hidden = true;
    photo.removeAttribute('src');
    return;
  }

  nameField.value = `${candidate.name}${candidate.party ? ` · ${candidate.party}` : ''}`;
  nameField.dataset.autofilled = 'true';
  photo.alt = `Foto de ${candidate.name}`;
  photo.hidden = false;
  photo.onerror = () => {
    const initials = candidate.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
    photo.src = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="156" viewBox="0 0 120 156">
        <rect width="120" height="156" fill="#2a4260"/>
        <text x="60" y="92" fill="#e8f0fa" font-family="monospace" font-size="38" text-anchor="middle">${initials}</text>
      </svg>`,
    )}`;
  };
  photo.src = candidate.photo;
}

async function loadCandidateCatalog() {
  try {
    const response = await fetch('assets/election-candidates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('candidate catalog unavailable');
    candidateCatalog = await response.json();
    form.querySelectorAll('.candidate-card').forEach(updateCandidateMatch);
  } catch {
    setStatus('catálogo indisponível');
  }
}

function buildClipboardText() {
  return [...form.querySelectorAll('.candidate-card')]
    .map((card) => {
      const title = card.querySelector('.candidate-card__title').textContent;
      const name = card.querySelector('input[type="text"]:not(.candidate-number)').value.trim();
      const number = card.querySelector('.candidate-number').value.trim();
      return `${title}: ${number || '—'}${name ? ` · ${name}` : ''}`;
    })
    .join('\n');
}

async function copyElection() {
  const text = buildClipboardText();
  try {
    await navigator.clipboard.writeText(text);
    setStatus('cola copiada');
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
    setStatus('cola copiada');
  }
}

form.addEventListener('input', (event) => {
  if (event.target.classList.contains('candidate-number')) {
    event.target.value = event.target.value.replace(/\D/g, '');
    updateCandidateMatch(event.target.closest('.candidate-card'));
  } else if (event.target.name?.endsWith('-name')) {
    delete event.target.dataset.autofilled;
  }
  saveForm();
});

document.getElementById('copy-election').addEventListener('click', copyElection);

document.getElementById('clear-election').addEventListener('click', () => {
  if (!confirm('Apagar todos os dados salvos nesta cola?')) return;
  form.reset();
  localStorage.removeItem(ELECTION_STORAGE_KEY);
  setStatus('dados limpos');
});

document.getElementById('print-election').addEventListener('click', () => {
  window.print();
});

document.getElementById('election-theme-toggle').addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

setTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'dark');
restoreForm();
loadCandidateCatalog();
