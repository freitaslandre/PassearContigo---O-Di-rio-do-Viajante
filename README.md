# PassearContigo - O Diário do Viajante

Aplicação Ionic/Angular para planear, organizar e registar viagens. A app permite criar viagens, dividir itinerários por dias, adicionar pontos de interesse, associar fotografias, gerir custos, escrever diário de viagem, criar álbuns e partilhar conteúdos com outros utilizadores.

URL: https://passearcontigo.web.app

## Índice

- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Execução em Desenvolvimento](#execução-em-desenvolvimento)
- [Build](#build)
- [Execução em Android/iOS](#execução-em-androidios)
- [Firebase](#firebase)
- [Mapas e Localização](#mapas-e-localização)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Testes e Validação](#testes-e-validação)
- [Notas de Usabilidade](#notas-de-usabilidade)
- [Relatório de IA](#relatório-de-ia)

## Descrição

O **PassearContigo** foi desenvolvido como uma aplicação de apoio ao viajante. O objetivo é centralizar num só local a preparação e o registo de uma viagem, juntando planeamento, memórias, custos e colaboração.

A aplicação funciona com navegação por separadores e inclui áreas principais para:

- viagens;
- descoberta de sugestões;
- feed social;
- resumo de custos;
- perfil e autenticação.

## Funcionalidades

### Gestão de Viagens

- Criar novas viagens com título, destino, datas e foto de capa.
- Editar dados principais da viagem.
- Definir estado da viagem:
  - planeada;
  - em curso;
  - concluída;
  - cancelada.
- Eliminar viagens com confirmação.
- Ver resumo com número de dias, datas, duração e pontos de interesse.

### Dias da Viagem

- Geração automática dos dias entre a data de início e fim.
- Adição e remoção de dias.
- Edição de título, data, local, descrição e observações.
- Consulta de pontos de interesse associados a cada dia.

### Pontos de Interesse

- Adicionar pontos de interesse a um dia.
- Guardar nome, descrição, tipo, endereço, telefone, horário, URL, nota, custo, categoria e avaliação.
- Selecionar localização através de mapa.
- Usar localização atual do dispositivo.
- Pesquisar sugestões de locais através do OpenStreetMap/Nominatim.
- Inferir categoria automaticamente com base no local selecionado.
- Associar fotografia capturada pela câmara, galeria ou ficheiro.

### Mapas e Geolocalização

- Visualização de mapa com Leaflet.
- Marcação de coordenadas no mapa.
- Geocodificação inversa para preencher nome/endereço a partir de coordenadas.
- Utilização da localização atual através do plugin de geolocalização.

### Diário de Viagem

- Visualização diária da viagem.
- Registo de notas e detalhes associados aos dias e pontos de interesse.
- Exportação/partilha de diário em PDF.

### Álbum de Viagem

- Importação e organização de fotografias.
- Associação de fotografias a pontos de interesse.
- Seleção múltipla de fotografias.
- Reatribuição e remoção de fotografias.
- Exportação/partilha do álbum em PDF.

### Gestão de Custos

- Registo de custos associados a viagens, dias ou pontos de interesse.
- Resumo de custos por categoria.
- Gráfico de distribuição.
- Filtro por viagem.
- Exportação/partilha de relatório de custos em PDF.

### Feed e Colaboração

- Publicação de viagens no feed.
- Comentários e reações.
- Gestão de colaboradores.
- Permissões por nível de acesso:
  - dono;
  - editor;
  - visualizador.

### Perfil e Autenticação

- Registo de utilizador.
- Login/logout.
- Validação de erros de autenticação com mensagens amigáveis.
- Ativação/desativação de notificações push.

## Tecnologias

### Frontend

- Angular 20
- Ionic 8
- TypeScript
- SCSS
- RxJS
- Ionicons

### Mobile

- Capacitor 8
- Android
- iOS
- Plugins Capacitor:
  - Camera;
  - Geolocation;
  - Filesystem;
  - Share;
  - Haptics;
  - Keyboard;
  - Screen Orientation;
  - Status Bar.

### Backend e Dados

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Messaging

### Mapas e PDFs

- Leaflet
- OpenStreetMap
- Nominatim
- jsPDF

## Estrutura do Projeto

```text
PassearContigo---O-Di-rio-do-Viajante/
├── README.md
├── RELATORIO_UTILIZACAO_IA.md
├── package.json
└── PassearContigo/
    ├── package.json
    ├── capacitor.config.ts
    ├── angular.json
    ├── src/
    │   ├── app/
    │   │   ├── models/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   └── tabs/
    │   ├── assets/
    │   ├── environments/
    │   ├── theme/
    │   ├── global.scss
    │   └── main.ts
    ├── android/
    └── ios/
```

### Pastas Principais

`src/app/pages`  
Contém os ecrãs da aplicação, como viagens, nova viagem, detalhe da viagem, adicionar ponto de interesse, diário, álbum, custos, feed e perfil.

`src/app/services`  
Contém a lógica de dados e integrações externas, incluindo Firebase, viagens, pontos de interesse, custos, mapas, PDFs, storage, autenticação e notificações.

`src/app/models`  
Define as interfaces principais da aplicação, como `Viagem`, `Dia`, `POI`, `Custo`, `Publicacao` e colaboradores.

`src/app/tabs`  
Define a navegação principal por separadores.

`src/environments`  
Contém configurações de ambiente, incluindo Firebase.

## Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- Node.js;
- npm;
- Angular CLI;
- Ionic CLI;
- Android Studio, para Android;
- Xcode, para iOS;
- conta/configuração Firebase.

Instalação opcional das CLIs:

```bash
npm install -g @angular/cli
npm install -g @ionic/cli
```

## Instalação

Entrar na pasta principal da aplicação:

```bash
cd PassearContigo
```

Instalar dependências:

```bash
npm install
```

## Execução em Desenvolvimento

Para correr a aplicação no browser:

```bash
npm start
```

ou:

```bash
ng serve
```

Por defeito, a aplicação fica disponível em:

```text
http://localhost:4200
```

## Build

Para gerar a versão de produção/web:

```bash
npm run build
```

O resultado é gerado na pasta configurada pelo Angular/Ionic e usado pelo Capacitor para sincronizar com Android/iOS.

## Execução em Android/iOS

### Sincronizar com Capacitor

Depois de fazer build:

```bash
npx cap sync
```

### Abrir Android

```bash
npx cap open android
```

### Abrir iOS

```bash
npx cap open ios
```

### iOS

O projeto iOS está em:

```text
PassearContigo/ios/App/App.xcodeproj
```

Para distribuir a app a testers, o método recomendado é usar TestFlight através do App Store Connect.

## Firebase

A aplicação utiliza Firebase para:

- autenticação;
- base de dados Firestore;
- storage de imagens;
- notificações push.

As configurações encontram-se nos ficheiros de ambiente em:

```text
PassearContigo/src/environments/
```

Coleções principais esperadas:

- `viagens`;
- `custos`;
- `publicacoes`;
- comentários e reações associados às publicações;
- dados de utilizador.

## Mapas e Localização

A aplicação usa:

- Leaflet para apresentar mapas;
- OpenStreetMap como fonte de tiles;
- Nominatim para pesquisa de locais e geocodificação inversa;
- Capacitor Geolocation para obter a localização atual.

No ecrã de adicionar ponto de interesse, é possível:

- clicar no mapa para definir coordenadas;
- usar a localização atual;
- pesquisar locais pelo nome/endereço;
- preencher automaticamente alguns campos com base no local.

## Scripts Disponíveis

Executar servidor de desenvolvimento:

```bash
npm start
```

Build da aplicação:

```bash
npm run build
```

Build em modo watch:

```bash
npm run watch
```

Testes unitários:

```bash
npm test
```

Lint:

```bash
npm run lint
```

Nota: o projeto pode apresentar avisos/erros de lint relacionados com regras globais de estilo Angular, como a preferência por `inject()`.

## Testes e Validação

Durante o desenvolvimento foram usados principalmente:

```bash
npm run build
```

Este comando valida se a aplicação Angular/Ionic compila corretamente.

Também existem ficheiros de teste em algumas áreas, por exemplo:

- serviços de autenticação;
- serviços de custos;
- páginas de custos.

## Notas de Usabilidade

Foram consideradas várias boas práticas de usabilidade:

- estados de carregamento;
- mensagens de erro;
- estados vazios;
- confirmações em ações destrutivas;
- prevenção de perda de dados em formulários;
- `aria-label` em botões com ícones;
- linguagem em português de Portugal;
- navegação por separadores.

## Relatório de IA

Este repositório inclui um relatório sobre a utilização de inteligência artificial no desenvolvimento:

```text
RELATORIO_UTILIZACAO_IA.md
```

Esse ficheiro descreve de que forma a IA foi usada como apoio à documentação, revisão de código, usabilidade e validação técnica.

## Estado Atual

A aplicação encontra-se funcional em ambiente de desenvolvimento, com suporte para browser e preparação para execução mobile via Capacitor.

Funcionalidades principais implementadas:

- autenticação;
- criação e edição de viagens;
- gestão de dias;
- pontos de interesse com mapa e fotos;
- custos;
- diário;
- álbum;
- feed;
- colaboradores;
- exportação/partilha de PDFs.

## Autores

Projeto desenvolvido no contexto académico da unidade curricular/trabalho prático.

Nome do projeto:

```text
PassearContigo - O Diário do Viajante
```
