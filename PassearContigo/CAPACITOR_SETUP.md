# Capacitor - Configuração e Workflow

## ✅ Status da Configuração

O Capacitor foi instalado e configurado com sucesso! A plataforma **Android** foi adicionada ao projeto.

## 📋 O que foi feito

1. ✅ Instaladas todas as dependências do projeto (npm install)
2. ✅ Atualizado o `capacitor.config.ts` com:
   - `appId`: `com.passearcontigo.app` (identidade única da aplicação)
   - Configurações de plugins
   - Suporte a HTTPS no Android
3. ✅ Build do projeto web (`npm run build`) - gera o diretório `www`
4. ✅ Plataforma Android adicionada

## 📁 Estrutura de Diretórios

```
PassearContigo/
├── src/                 # Código-fonte Angular
├── www/                 # Build web (gerado por npm run build)
├── android/             # Projeto Android nativo (Gradle)
├── capacitor.config.ts  # Configuração do Capacitor
└── package.json         # Dependências
```

## 🚀 Workflow de Desenvolvimento

### 1. Modificar código da aplicação web

```bash
# Editar arquivos em src/
```

### 2. Build do projeto web

```bash
npm run build
```

Isso gera/atualiza o diretório `www` com a versão compilada.

### 3. Sincronizar com Capacitor

```bash
npx cap sync android
```

Copia o código web atualizado para o projeto Android.

### 4. Abrir/compilar no Android Studio

```bash
npx cap open android
```

Abre o Android Studio com o projeto pronto para compilação.

## 🔧 Comandos Úteis do Capacitor

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Build do projeto web Angular |
| `npx cap sync` | Sincroniza código web com plataformas nativas |
| `npx cap open android` | Abre o Android Studio |
| `npx cap run android` | Compila e executa no Android (com dispositivo conectado) |
| `npx cap update` | Atualiza plataformas nativas |
| `npx cap add [platform]` | Adiciona nova plataforma (ex: ios) |

## 📱 Configuração do Android

O projeto Android está em `android/` e foi configurado com:

- **Package**: `com.passearcontigo.app`
- **App Name**: PassearContigo
- **Build System**: Gradle (Android Studio)
- **Plugins**: App, Haptics, Keyboard, Status Bar

### Requisitos para compilar Android:

- Java Development Kit (JDK) 17+
- Android SDK (API 33+)
- Android Studio (recomendado)
- Gradle 8.0+

## 🔌 Plugins Capacitor Instalados

- `@capacitor/app` - Controle da aplicação (pause/resume)
- `@capacitor/haptics` - Feedback háptico
- `@capacitor/keyboard` - Controle do teclado virtual
- `@capacitor/status-bar` - Customização da barra de status

## 📝 Próximos Passos

### Para compilar no Android:

1. Instale Android Studio
2. Configure as variáveis de ambiente (`ANDROID_HOME`)
3. Conecte um dispositivo Android ou configure um emulador
4. Execute:
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

### Para adicionar suporte iOS (em Mac):

```bash
npm install @capacitor/ios
npx cap add ios
npx cap open ios
```

### Para adicionar mais plugins:

```bash
npm install @capacitor/[plugin-name]
npx cap sync
```

## 🐛 Troubleshooting

### Erro ao adicionar plataforma

```bash
# Atualize Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest

# Tente adicionar novamente
npx cap add android
```

### Código web não aparece no app

1. Verifique se rodou `npm run build`
2. Verifique se rodou `npx cap sync`
3. Limpe o cache do Android Studio
4. Reconstrua o projeto

### Problemas de dependências

```bash
npm audit fix
npm install
npx cap sync
```

## 📚 Referências

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Ionic Framework](https://ionicframework.com/)
- [Android Developers](https://developer.android.com/)

## 🎯 Configurações Adicionais Recomendadas

Para ambiente de produção, considere:

- [ ] Configurar versioning (versionCode, versionName)
- [ ] Configurar assinatura de APK/AAB
- [ ] Adicionar ícones de app para diferentes resoluções
- [ ] Configurar splash screen customizado
- [ ] Testar em múltiplos dispositivos Android
- [ ] Implementar receita de CI/CD
