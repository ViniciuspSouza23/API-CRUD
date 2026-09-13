/**
 * Front-end NotasApp - CRUD REST
 * Aula 05 - SENAI (Prof. Deivison Takatu)
 */

// Estado da Aplicação
let notes = [];
let noteToDeleteId = null;

// Determina URL da API padrão:
// Se estiver rodando no mesmo domínio da API (ex: localhost ou no próprio Render), usa a origem atual + '/api/notes'
const isSameDomainBackend = !window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('github.io');
const DEFAULT_API_URL = isSameDomainBackend 
  ? `${window.location.origin}/api/notes` 
  : (localStorage.getItem('crud_notes_api_url') || 'https://sua-api.onrender.com/api/notes');

let currentApiUrl = localStorage.getItem('crud_notes_api_url') || DEFAULT_API_URL;

// Elementos DOM
const apiUrlInput = document.getElementById('apiUrlInput');
const btnSaveApiUrl = document.getElementById('btnSaveApiUrl');
const btnResetApiUrl = document.getElementById('btnResetApiUrl');
const apiStatusBadge = document.getElementById('apiStatusBadge');
const apiStatusText = document.getElementById('apiStatusText');
const activeEndpointDisplay = document.getElementById('activeEndpointDisplay');

const searchInput = document.getElementById('searchInput');
const btnClearSearch = document.getElementById('btnClearSearch');
const btnRefresh = document.getElementById('btnRefresh');
const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
const btnEmptyCreate = document.getElementById('btnEmptyCreate');
const btnRetry = document.getElementById('btnRetry');

const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const notesCount = document.getElementById('notesCount');

// Modais
const noteModal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTituloInput = document.getElementById('noteTitulo');
const noteTextoInput = document.getElementById('noteTexto');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');

const deleteModal = document.getElementById('deleteModal');
const deleteNoteTitle = document.getElementById('deleteNoteTitle');
const btnCloseDeleteModal = document.getElementById('btnCloseDeleteModal');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

const toastContainer = document.getElementById('toastContainer');

// ==========================================
// Inicialização
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  apiUrlInput.value = currentApiUrl;
  setupEventListeners();
  checkApiHealth();
  fetchNotes();
});

function setupEventListeners() {
  // Configuração da API
  btnSaveApiUrl.addEventListener('click', handleSaveApiUrl);
  btnResetApiUrl.addEventListener('click', handleResetApiUrl);

  // Busca e Filtro
  searchInput.addEventListener('input', handleSearch);
  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    renderNotes(notes);
  });

  // Ações Principais
  btnRefresh.addEventListener('click', () => {
    checkApiHealth();
    fetchNotes(true);
  });
  btnOpenCreateModal.addEventListener('click', () => openNoteModal());
  btnEmptyCreate.addEventListener('click', () => openNoteModal());
  btnRetry.addEventListener('click', () => {
    checkApiHealth();
    fetchNotes();
  });

  // Modal de Criação / Edição
  noteForm.addEventListener('submit', handleFormSubmit);
  btnCloseModal.addEventListener('click', closeNoteModal);
  btnCancelModal.addEventListener('click', closeNoteModal);

  // Modal de Exclusão
  btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  btnCancelDelete.addEventListener('click', closeDeleteModal);
  btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // Fechar ao clicar fora dos modais
  window.addEventListener('click', (e) => {
    if (e.target === noteModal) closeNoteModal();
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Atalho de teclado ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNoteModal();
      closeDeleteModal();
    }
  });
}

// ==========================================
// Gerenciamento de URL da API & Healthcheck
// ==========================================
function getNormalizedUrl(path = '') {
  let base = currentApiUrl.trim().replace(/\/+$/, '');
  if (path && !base.endsWith('/api/notes')) {
    // Se o usuário colocou apenas o domínio base (ex: https://meu-render.com)
    if (!base.endsWith('/api')) {
      base += '/api/notes';
    }
  }
  return path ? `${base}/${path}` : base;
}

function handleSaveApiUrl() {
  const newUrl = apiUrlInput.value.trim();
  if (!newUrl) {
    showToast('Informe uma URL válida para a API.', 'error');
    return;
  }
  currentApiUrl = newUrl;
  localStorage.setItem('crud_notes_api_url', newUrl);
  showToast('URL da API atualizada com sucesso!', 'success');
  checkApiHealth();
  fetchNotes();
}

function handleResetApiUrl() {
  localStorage.removeItem('crud_notes_api_url');
  currentApiUrl = window.location.origin.includes('localhost') ? '/api/notes' : 'https://api-crud-notes.onrender.com/api/notes';
  apiUrlInput.value = currentApiUrl;
  showToast('Restaurado para URL padrão.', 'success');
  checkApiHealth();
  fetchNotes();
}

async function checkApiHealth() {
  apiStatusBadge.className = 'status-pill';
  apiStatusText.textContent = 'Verificando...';

  try {
    const url = getNormalizedUrl();
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      apiStatusBadge.className = 'status-pill online';
      apiStatusText.textContent = 'API Conectada';
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    apiStatusBadge.className = 'status-pill offline';
    apiStatusText.textContent = 'API Indisponível';
  }
}

// ==========================================
// Operações do CRUD (Fetch)
// ==========================================

// 1. GET /api/notes
async function fetchNotes(showFeedback = false) {
  notesGrid.innerHTML = '';
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  notesCount.textContent = 'Carregando notas...';

  try {
    const url = getNormalizedUrl();
    activeEndpointDisplay.innerHTML = `Endpoint ativo: <code>GET ${url}</code>`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    notes = await response.json();
    renderNotes(notes);

    if (showFeedback) {
      showToast('Lista de notas atualizada!', 'success');
    }
  } catch (error) {
    console.error('Falha ao listar notas:', error);
    notesCount.textContent = 'Erro ao carregar';
    errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = `Não foi possível conectar à API (${error.message}).`;
  }
}

// 2. POST /api/notes ou 4. PUT /api/notes/:id
async function handleFormSubmit(e) {
  e.preventDefault();
  const id = noteIdInput.value.trim();
  const titulo = noteTituloInput.value.trim();
  const texto = noteTextoInput.value.trim();

  if (!titulo || !texto) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const payload = { titulo, texto };
  const isEditing = Boolean(id);
  const targetUrl = isEditing ? getNormalizedUrl(id) : getNormalizedUrl();
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await fetch(targetUrl, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.mensagem || `Erro ${response.status}`);
    }

    closeNoteModal();
    showToast(isEditing ? 'Nota atualizada com sucesso!' : 'Nota cadastrada com sucesso!', 'success');
    await fetchNotes();
  } catch (error) {
    console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} nota:`, error);
    showToast(`Falha na operação: ${error.message}`, 'error');
  }
}

// 5. DELETE /api/notes/:id
async function handleConfirmDelete() {
  if (!noteToDeleteId) return;

  try {
    const targetUrl = getNormalizedUrl(noteToDeleteId);
    const response = await fetch(targetUrl, {
      method: 'DELETE'
    });

    // O status esperado de sucesso é 204 No Content
    if (response.status === 204 || response.ok) {
      closeDeleteModal();
      showToast('Nota removida com sucesso (204 No Content)!', 'success');
      await fetchNotes();
    } else {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.mensagem || `Status ${response.status}`);
    }
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    showToast(`Não foi possível excluir: ${error.message}`, 'error');
  }
}

// ==========================================
// Renderização e Filtro
// ==========================================
function renderNotes(items) {
  notesGrid.innerHTML = '';

  if (!items || items.length === 0) {
    notesCount.textContent = '0 notas';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  notesCount.textContent = `${items.length} ${items.length === 1 ? 'nota cadastrada' : 'notas cadastradas'}`;

  // Ordena por data decrescente (mais recentes primeiro)
  const sorted = [...items].sort((a, b) => {
    const tA = new Date(a.criadoEm || 0).getTime();
    const tB = new Date(b.criadoEm || 0).getTime();
    return tB - tA;
  });

  sorted.forEach(note => {
    const card = document.createElement('article');
    card.className = 'note-card';

    const formattedDate = formatDate(note.criadoEm);
    const formattedUpdated = note.atualizadoEm ? formatDate(note.atualizadoEm) : null;

    card.innerHTML = `
      <div class="note-header">
        <h3 class="note-title">${escapeHtml(note.titulo)}</h3>
      </div>
      <p class="note-body">${escapeHtml(note.texto)}</p>
      <div class="note-footer">
        <div class="note-timestamps">
          <span>Criado: ${formattedDate}</span>
          ${formattedUpdated ? `<span style="color:#38bdf8;">Editado: ${formattedUpdated}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-icon edit-btn" title="Editar nota" data-id="${note.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon delete delete-btn" title="Excluir nota" data-id="${note.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Eventos de clique nos botões do card
    card.querySelector('.edit-btn').addEventListener('click', () => openNoteModal(note));
    card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(note));

    notesGrid.appendChild(card);
  });
}

function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    btnClearSearch.classList.remove('hidden');
    const filtered = notes.filter(n => 
      (n.titulo && n.titulo.toLowerCase().includes(query)) ||
      (n.texto && n.texto.toLowerCase().includes(query))
    );
    renderNotes(filtered);
    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      document.getElementById('emptyStateMsg').textContent = `Nenhuma nota corresponde à busca "${query}".`;
    }
  } else {
    btnClearSearch.classList.add('hidden');
    renderNotes(notes);
  }
}

// ==========================================
// Controle de Modais
// ==========================================
function openNoteModal(noteToEdit = null) {
  if (noteToEdit) {
    modalTitle.textContent = 'Editar Nota';
    noteIdInput.value = noteToEdit.id;
    noteTituloInput.value = noteToEdit.titulo;
    noteTextoInput.value = noteToEdit.texto;
  } else {
    modalTitle.textContent = 'Criar Nova Nota';
    noteForm.reset();
    noteIdInput.value = '';
  }
  noteModal.classList.remove('hidden');
  noteTituloInput.focus();
}

function closeNoteModal() {
  noteModal.classList.add('hidden');
  noteForm.reset();
}

function openDeleteModal(note) {
  noteToDeleteId = note.id;
  deleteNoteTitle.textContent = `"${note.titulo}"`;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  noteToDeleteId = null;
}

// ==========================================
// Utilitários (Toast, Formatação e Escape)
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatDate(isoString) {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
