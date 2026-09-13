const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ==========================================
// Middlewares
// ==========================================

// Middleware de CORS manual (conforme solicitado no conteúdo da Aula 05)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Responde imediatamente a requisições de preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware body-parser para interpretar corpos de requisição em formato JSON e form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta frontend (permite abrir o app na mesma porta local)
app.use(express.static(path.join(__dirname, 'frontend')));

// ==========================================
// Funções Auxiliares de Armazenamento (fs)
// ==========================================

function readNotes() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(rawData || '[]');
  } catch (error) {
    console.error('Erro ao ler data.json:', error.message);
    return [];
  }
}

function writeNotes(notes) {
  // Executa até 3 tentativas com pequena espera para evitar conflitos de bloqueio (ex: OneDrive no Windows)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Erro ao gravar em data.json (tentativa ${attempt}):`, error.message);
      if (attempt < 3) {
        const wait = Date.now() + 60;
        while (Date.now() < wait) {}
      }
    }
  }
  return false;
}

// ==========================================
// Rotas da API REST
// ==========================================

// Rota raiz (Healthcheck / Boas-vindas para o Render)
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'online',
    mensagem: 'API REST de Notas (CRUD) está ativa e operando.',
    endpoints: {
      listar: 'GET /api/notes',
      criar: 'POST /api/notes',
      obterPorId: 'GET /api/notes/:id',
      atualizar: 'PUT /api/notes/:id',
      excluir: 'DELETE /api/notes/:id'
    }
  });
});

// 1. GET /api/notes -> Lista todas as notas
app.get('/api/notes', (req, res) => {
  const notes = readNotes();
  return res.status(200).json(notes);
});

// 2. POST /api/notes -> Cria uma nova nota
app.post('/api/notes', (req, res) => {
  const { titulo, texto } = req.body || {};

  if (!titulo || !texto) {
    return res.status(400).json({
      erro: 'Dados incompletos',
      mensagem: 'Os campos "titulo" e "texto" são obrigatórios.'
    });
  }

  const notes = readNotes();

  const novaNota = {
    id: Date.now().toString(),
    titulo: String(titulo).trim(),
    texto: String(texto).trim(),
    criadoEm: new Date().toISOString()
  };

  notes.push(novaNota);
  const gravou = writeNotes(notes);

  if (!gravou) {
    return res.status(500).json({ erro: 'Falha interna ao persistir nota no arquivo.' });
  }

  return res.status(201).json(novaNota);
});

// 3. GET /api/notes/:id -> Retorna uma nota específica
app.get('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const notes = readNotes();

  const nota = notes.find(n => n.id === id);

  if (!nota) {
    return res.status(404).json({
      erro: 'Não encontrado',
      mensagem: `A nota com ID ${id} não foi encontrada.`
    });
  }

  return res.status(200).json(nota);
});

// 4. PUT /api/notes/:id -> Atualiza título e texto de uma nota existente
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, texto } = req.body || {};

  if (!titulo || !texto) {
    return res.status(400).json({
      erro: 'Dados incompletos',
      mensagem: 'Os campos "titulo" e "texto" são obrigatórios para atualização.'
    });
  }

  const notes = readNotes();
  const index = notes.findIndex(n => n.id === id);

  if (index === -1) {
    return res.status(404).json({
      erro: 'Não encontrado',
      mensagem: `A nota com ID ${id} não foi encontrada para atualização.`
    });
  }

  // Atualiza apenas os campos permitidos, mantendo id e criadoEm originais
  notes[index] = {
    ...notes[index],
    titulo: String(titulo).trim(),
    texto: String(texto).trim(),
    atualizadoEm: new Date().toISOString()
  };

  const gravou = writeNotes(notes);

  if (!gravou) {
    return res.status(500).json({ erro: 'Falha interna ao atualizar nota no arquivo.' });
  }

  return res.status(200).json(notes[index]);
});

// 5. DELETE /api/notes/:id -> Remove nota e retorna status 204
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const notes = readNotes();

  const index = notes.findIndex(n => n.id === id);

  if (index === -1) {
    return res.status(404).json({
      erro: 'Não encontrado',
      mensagem: `A nota com ID ${id} não foi encontrada para exclusão.`
    });
  }

  // Remove o item da lista
  notes.splice(index, 1);
  const gravou = writeNotes(notes);

  if (!gravou) {
    return res.status(500).json({ erro: 'Falha interna ao remover nota do arquivo.' });
  }

  // Retorna status 204 No Content conforme especificação REST
  return res.status(204).send();
});

// Tratamento de rota não encontrada genérica
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    mensagem: `O caminho ${req.originalUrl} com método ${req.method} não existe nesta API.`
  });
});

// Middleware global de tratamento de erros inesperados
app.use((err, req, res, next) => {
  console.error('Erro na API:', err.stack || err.message);
  return res.status(err.status || 500).json({
    erro: 'Erro interno no servidor',
    mensagem: err.message || 'Ocorreu um erro ao processar a requisição.'
  });
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor rodando com sucesso!`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔗 Host: 0.0.0.0`);
  console.log(`📁 Armazenamento: ${DATA_FILE}`);
  console.log(`=========================================`);
});
