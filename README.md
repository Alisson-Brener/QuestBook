# 📚 QuestBook - TCC

Sistema inteligente de apoio ao estudo para concursos, utilizando Processamento de Linguagem Natural (PLN) para conectar materiais didáticos (PDFs) a bases de questões reais.

---

## 🚀 Pré-requisitos

Antes de começar, você precisa ter instalado na sua máquina:

1.  **Python 3.10** (⚠️ Importante: Use a versão 3.10 para compatibilidade com as libs de IA).
2.  **Node.js** (Versão 18 ou superior - Para rodar o Frontend).
3.  **MySQL Server** (Banco de questões legado).
4.  **PostgreSQL** (Banco de dados da aplicação).
5.  **Git**.

---

## 🛠️ Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone [https://github.com/SEU_USUARIO/tcc-questbook.git](https://github.com/SEU_USUARIO/tcc-questbook.git)
cd tcc-questbook
```

### 2. Configurar o Ambiente Virtual

```bash
# Cria o ambiente forçando a versão 3.10
py -3.10 -m venv venv

# Ativa o ambiente
.\venv\Scripts\activate
```

### 3. Instalar Dependências

```bash
# Com o (venv) ativo no terminal
pip install -r requirements.txt

#Abra um terminal entre na pasta do frontend e instale as dependências:
cd frontend
npm install
```

### 4. Configurar Variáveis de Ambiente (.env)
Crie um arquivo chamado .env na raiz do projeto e adicione sua chave da API Groq (necessária para o Chat)

```bash
GROQ_API_KEY=gsk_sua_chave_aqui...
```
(Você pode criar uma em [console.groq.com](console.groq.com))

---

## 🗄️ Configuração dos Bancos de Dados

o projeto utiliza dois bancos de dados simultaneamente.

### Passo A: MySQL (Banco de Questões)

1. Abra o MySQL Workbench.
2. Crie um banco chamado qconcursos.
3. Importe o arquivo .sql fornecido pelo Orientador.
> Nota: Se der erro de chave duplicada, utilize o script de criação de tabela permissiva disponível na documentação interna.

### Passo B: PostgreSQL (Banco do Sistema)

1. Abra o pgAdmin.
2. Crie um banco de dados vazio chamado questbook_db.
3. Verifique a senha do seu usuário postgres.
4. Atualize o arquivo backend/database.py com sua senha local, se necessário:
> SQLALCHEMY_DATABASE_URL = "postgresql://postgres:SUA_SENHA@localhost/questbook_db"

---

## 🧠 Inicializando a IA (Indexação)

1. Certifique-se de que o arquivo scripts/indexer.py está com a senha correta do seu MySQL.
2. Execute o script:
```bash
# Execute da raiz do projeto
python scripts/indexer.py
```

Isso vai baixar o modelo de IA e processar as questões. Pode levar de 5 a 10 minutos. Ao final, uma pasta db_vetorial será criada.

---

## ▶️ Como Rodar a Aplicação

Para o sistema funcionar, você precisa de dois terminais abertos simultaneamente.


Terminal 1: Backend (API)
Na raiz do projeto (tcc-questbook), com o venv ativo:
```bash
uvicorn backend.main:app --reload
```
O servidor estará rodando em: [http://127.0.0.1:8000](http://127.0.0.1:8000)


Terminal 2: Frontend (Interface)
Na pasta do frontend (tcc-questbook/frontend):
```bash
npm run dev
```
A interface iniciará em: http://localhost:5173

---

## 🧪 Como Usar

1. Acesse http://localhost:5173 no seu navegador.

2. Upload: Envie um PDF de estudo (capítulo de livro ou apostila).

3. Chat: Digite o que deseja praticar. Exemplo:

    "Quero 5 questões difíceis da banca FGV sobre o assunto deste capítulo."

4. Resultado: A IA analisará o PDF e trará questões contextualizadas.
---

## ⚠️ Solução de Problemas Comuns

* **Erro** ModuleNotFoundError: Você provavelmente esqueceu de ativar o venv.
* **Erro de Conexão (Frontend não fala com Backend)** de Conexão no Banco: Verifique se o uvicorn está rodando e se não há bloqueios de porta.
* **Erro** model_decommissioned: A Groq atualizou os modelos. Atualize o nome do modelo em backend/llm_agent.py.