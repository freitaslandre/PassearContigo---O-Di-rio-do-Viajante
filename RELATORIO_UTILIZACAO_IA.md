# Relatório de Utilização de Inteligência Artificial

## Identificação do Projeto

**Projeto:** PassearContigo - O Diário do Viajante  
**Tipo de aplicação:** Aplicação móvel/web desenvolvida com Ionic, Angular e Firebase  
**Objetivo:** Apoiar o planeamento e registo de viagens, permitindo gerir viagens, dias, pontos de interesse, custos, diário, álbum e partilha de conteúdos.

## Ferramenta de IA Utilizada

Durante o desenvolvimento foi utilizada uma ferramenta de inteligência artificial como apoio ao trabalho de programação, revisão e documentação do projeto.

A IA foi usada como assistente técnico, ajudando a:

- analisar ficheiros do projeto;
- sugerir melhorias de código;
- comentar partes da aplicação;
- rever aspetos de usabilidade;
- identificar possíveis problemas de interface;
- validar alterações através de comandos de build.

## Áreas em que a IA Ajudou

### 1. Comentários no Código

A IA ajudou a acrescentar comentários em português de Portugal nos ficheiros fonte do projeto, especialmente em ficheiros TypeScript, HTML e SCSS.

O objetivo destes comentários foi tornar o código mais fácil de compreender, principalmente em zonas com:

- serviços Angular;
- páginas com muita lógica;
- integração com Firebase;
- manipulação de formulários;
- utilização de mapas;
- geolocalização;
- upload e tratamento de fotografias;
- validações e permissões.

### 2. Revisão de Usabilidade

Foi feita uma revisão da aplicação com base nas heurísticas de Nielsen.

Foram analisados aspetos como:

- visibilidade do estado do sistema;
- prevenção de erros;
- consistência da linguagem;
- controlo e liberdade do utilizador;
- acessibilidade de botões;
- clareza das mensagens de erro;
- estados de carregamento, erro e vazio.

### 3. Melhorias na Interface

A IA ajudou a identificar e corrigir problemas visuais na interface, nomeadamente em barras superiores onde títulos e botões podiam ficar sobrepostos em ecrãs pequenos.

Também foram feitas melhorias como:

- adição de estados de carregamento;
- mensagens de erro mais claras;
- botões com `aria-label`;
- melhoria da acessibilidade;
- uniformização de alguns textos para português de Portugal.

### 4. Prevenção de Erros do Utilizador

Foram introduzidos mecanismos para evitar perda acidental de dados, como confirmações antes de sair de formulários com alterações por guardar.

Esta melhoria foi aplicada em ecrãs de criação e edição de viagens.

### 5. Validação Técnica

Depois das alterações, foram executados comandos de verificação para garantir que a aplicação continuava funcional.

O principal comando utilizado foi:

```bash
npm run build
```

Este comando confirmou que o projeto compilava corretamente após as alterações realizadas.

## Limitações da Utilização de IA

A IA foi usada como apoio, mas as decisões finais sobre o projeto, funcionalidades e organização ficaram sob responsabilidade do autor do trabalho.

Algumas sugestões geradas automaticamente tiveram de ser revistas para garantir que:

- não alteravam o comportamento esperado da aplicação;
- não quebravam a compilação;
- mantinham coerência com o estilo do projeto;
- respeitavam a estrutura Ionic/Angular já existente.

## Conclusão

A utilização de inteligência artificial ajudou a acelerar tarefas de revisão, documentação e melhoria da aplicação.

O principal contributo da IA foi apoiar a compreensão do código, sugerir melhorias de usabilidade e ajudar na validação técnica das alterações. Ainda assim, o projeto continuou a exigir análise, adaptação e verificação manual para garantir que o resultado final era adequado ao contexto do trabalho.
