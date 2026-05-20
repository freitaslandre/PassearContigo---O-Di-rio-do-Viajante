# PassearContigo - Estrutura de Pastas

## Organização da Aplicação

```
src/
├── app/
│   ├── pages/                 # Componentes de páginas da aplicação
│   │   ├── home/             # Página Descobrir
│   │   ├── trips/            # Página Viagens
│   │   └── settings/         # Página Perfil
│   ├── services/             # Serviços da aplicação
│   │   ├── storage.service.ts     # Gerenciar armazenamento local
│   │   ├── trips.service.ts       # Gerenciar viagens
│   │   └── user.service.ts        # Gerenciar utilizador
│   ├── models/               # Modelos/Interfaces de dados
│   │   ├── trip.model.ts     # Interface Trip e Activity
│   │   └── user.model.ts     # Interface User e Preferences
│   ├── tabs/                 # Componente principal com navegação
│   ├── app.component.*       # Componente raiz
│   ├── app.module.ts         # Módulo raiz
│   └── app-routing.module.ts # Roteamento da aplicação
├── assets/
│   ├── data/                 # Ficheiros JSON com dados
│   │   └── trips.json        # Dados de exemplo de viagens
│   ├── images/               # Imagens da aplicação
│   └── icon/                 # Ícone da aplicação
├── theme/
│   └── variables.scss        # Variáveis CSS globais
└── environments/             # Configurações por ambiente

```

## Descrição dos Módulos

### Pages (Páginas)
Cada página é um módulo independente com lazy loading:
- **home**: Página "Descobrir" - exploração de viagens
- **trips**: Página "Viagens" - gestão de viagens do utilizador
- **settings**: Página "Perfil" - configurações e perfil do utilizador

### Services (Serviços)
Serviços reutilizáveis para lógica de negócio:
- **StorageService**: Gerenciar dados persistentes com Ionic Storage
- **TripsService**: Operações CRUD de viagens
- **UserService**: Operações do perfil e preferências do utilizador

### Models (Modelos)
Interfaces TypeScript para tipagem forte:
- **trip.model.ts**: Define estruturas de Trip e Activity
- **user.model.ts**: Define estruturas de User e UserPreferences

### Assets (Recursos)
- **data/**: Ficheiros JSON com dados estáticos
- **images/**: Imagens e ícones personalizados

## Convenções

1. **Nomes de ficheiros**: `nome-funcional.tipo.ts` (ex: `storage.service.ts`)
2. **Nomes de classes**: CamelCase com sufixo descritivo (ex: `StorageService`)
3. **Comentários**: Documentar classes, métodos e lógica complexa
4. **Modularidade**: Cada página é um módulo com lazy loading para otimização

## Próximos Passos

1. Implementar Ionic Storage no StorageService
2. Implementar métodos dos Services
3. Criar componentes específicos de cada página
4. Implementar Reactive Forms onde necessário
5. Adicionar validações
