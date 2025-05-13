# Chamado de Ambulância

## Descrição

Plataforma web para agilizar o acionamento de ambulâncias, garantindo chamadas mais rápidas e eficientes, com monitoramento em tempo real por geolocalização.

## Funcionalidades

* Exibição de mapa interativo com a localização do usuário
* Solicitação de ambulância através de um formulário simples
* Atualização em tempo real da posição da ambulância
* Páginas informativas: Sobre, Serviços, e Contato

## Tecnologias Utilizadas

* HTML5 e CSS3
* JavaScript (ES6+)
* [Leaflet.js](https://leafletjs.com/) para mapas e geolocalização
* Node.js (para gerenciamento de dependências e servidor de desenvolvimento)

## Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 14 ou superior)
* Navegador compatível com Geolocation API

## Instalação e Execução

1. Clone o repositório:

   ```bash
   git clone https://github.com/zernetoo/Chamado-de-ambulancia.git
   ```
2. Acesse a pasta do projeto:

   ```bash
   cd Chamado-de-ambulancia
   ```
3. Instale as dependências (caso haja):

   ```bash
   npm install
   ```
4. Inicie um servidor local (ou utilize a extensão Live Server do VS Code):

   ```bash
   # Via NPM (se configurado no package.json)
   npm run start

   # Ou usando Python
   python -m http.server 8000
   ```
5. Abra o navegador e acesse:

   ```
   http://localhost:8000
   ```

> **Nota:** Para que a API de geolocalização funcione corretamente, é recomendado servir os arquivos por HTTP/HTTPS, e não via `file://`.

## Estrutura de Diretórios

```
├── index.html         # Página inicial
├── solicitar.html     # Formulário de chamado de ambulância
├── servicos.html      # Página de serviços oferecidos
├── sobre.html         # Página sobre o projeto
├── style.css          # Estilos globais
├── script.js          # Lógica de geolocalização e atualizações em tempo real
├── index.js           # Integrações adicionais (se aplicável)
├── package.json       # Configuração de dependências e scripts
└── node_modules/      # Dependências instaladas
```

## Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch de feature:

   ```bash
   git checkout -b feature/nome-da-feature
   ```
3. Faça suas alterações e commit:

   ```bash
   git commit -m "Adiciona nova feature"
   ```
4. Envie para o repositório remoto:

   ```bash
   git push origin feature/nome-da-feature
   ```
5. Abra um Pull Request descrevendo suas alterações.

## Licença

Este projeto está licenciado sob a [MIT License](./LICENSE).

## Contato

* **Autor:** José Rodrigues
* **E-mail:** [tosephjose@gmail.com](mailto:tosephjose@gmail.com)
* **GitHub:** [zernetoo](https://github.com/zernetoo)
