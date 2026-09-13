# 📝 API REST de Notas (CRUD) - SENAI Aula 05

Projeto completo de API RESTful com operações de CRUD (Create, Read, Update, Delete) para gerenciamento de notas, desenvolvido para a disciplina **"Aula 05 - Criando APIs para o Front-end"** (SENAI - Prof. Deivison Takatu).

Inclui:
- **Back-end:** Node.js + Express + persistência com módulo `fs` em `data.json`.
- **Middlewares:** `body-parser` (JSON) e CORS manual (`Access-Control-Allow-Origin: *`, métodos e preflight `OPTIONS`).
- **Front-end Moderno:** Single Page Application (SPA) em HTML5, CSS moderno (Dark Mode, Glassmorphism) e JavaScript Vanilla consumindo a API.
- **Coleção Postman:** Arquivo exportável v2.1.0 (`notes_api_postman_collection.json`) com todas as rotas e códigos HTTP esperados (200, 201, 204, 400, 404).
- **Documento de Entrega:** [ENTREGA.md](file:///ENTREGA.md) com o checklist de deploy (Render e Vercel), placeholders de prints e respostas detalhadas das **Questões para Refletir**.

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório e instalar dependências:
```bash
git clone https://github.com/ViniciuspSouza23/API-CRUD.git
cd API-CRUD
npm install
```

### 2. Iniciar o servidor:
```bash
npm start
# ou para modo de desenvolvimento com auto-reload:
npm run dev
```

O servidor estará operando em: `http://localhost:3000`

### 3. Acessar a aplicação:
- **Interface Front-end:** Abra `http://localhost:3000` no seu navegador.
- **Catálogo da API:** `http://localhost:3000/api`
- **Listagem de Notas:** `http://localhost:3000/api/notes`

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| **GET** | `/api` | Healthcheck e informações dos endpoints |
| **GET** | `/api/notes` | Retorna a lista de todas as notas |
| **POST** | `/api/notes` | Cria uma nova nota (`titulo`, `texto`) |
| **GET** | `/api/notes/:id` | Retorna os dados da nota com o `:id` especificado |
| **PUT** | `/api/notes/:id` | Atualiza o `titulo` e `texto` da nota com o `:id` |
| **DELETE** | `/api/notes/:id` | Exclui a nota com o `:id` (Status 204 No Content) |

---

## 📮 Testando com o Postman
1. Abra o Postman e clique em **Import**.
2. Selecione o arquivo `notes_api_postman_collection.json`.
3. Alterne a variável de coleção `baseUrl` para testar tanto em `http://localhost:3000` quanto na URL de produção do Render.

---

## 📄 Documentação e Perguntas Reflexivas
Para consultar o guia de deploy completo no Render/Vercel e as respostas fundamentadas para as **Questões para Refletir** do slide final da aula, consulte o documento:
👉 [**ENTREGA.md**](file:///ENTREGA.md)
