FROM python:3.12-slim

WORKDIR /app

# Instala dependências básicas do sistema necessárias para compilar pacotes C e conectar ao PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia o requirements.txt primeiro para cache de camada eficiente
COPY requirements.txt .

# Instala as dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta padrão
EXPOSE 8000

# Inicializa o servidor FastAPI apontando para o módulo backend.main:app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
