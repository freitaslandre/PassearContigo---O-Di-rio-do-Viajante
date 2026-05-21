# Configuração de Permissões - Android

## ✅ Permissões Configuradas

As seguintes permissões foram adicionadas ao **AndroidManifest.xml** para suportar câmera e geolocalização:

### 📸 Câmera
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 📍 Geolocalização (Localização)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

### 🌐 Internet
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 📦 Plugins Instalados

| Plugin | Versão | Função |
|--------|--------|--------|
| `@capacitor/camera` | 8.2.0 | Captura fotos/vídeos |
| `@capacitor/geolocation` | 8.2.0 | Obtém localização GPS |
| `@capacitor/screen-orientation` | 8.0.1 | Bloqueia rotação |
| `@capacitor/app` | 8.1.0 | Controle de app |
| `@capacitor/haptics` | 8.0.2 | Feedback háptico |
| `@capacitor/keyboard` | 8.0.3 | Controle de teclado |
| `@capacitor/status-bar` | 8.0.2 | Controle de barra de status |

---

## 🔧 Serviços Disponíveis

### CameraService (`camera.service.ts`)

Métodos disponíveis:

```typescript
// Capturar foto com câmera
takePicture(): Promise<string | undefined>

// Selecionar foto da galeria
selectPictureFromGallery(): Promise<string | undefined>

// Capturar foto como arquivo
takePictureAsFile(): Promise<string | undefined>
```

**Exemplo de uso:**
```typescript
constructor(private cameraService: CameraService) {}

async capturarFoto() {
  const base64 = await this.cameraService.takePicture();
  if (base64) {
    console.log('Foto capturada:', base64);
  }
}
```

---

### GeolocationService (`geolocation.service.ts`)

Métodos disponíveis:

```typescript
// Obter localização atual
getCurrentPosition(): Promise<GeolocationPosition | null>

// Monitorar localização em tempo real
watchPosition(
  callback: (position: GeolocationPosition) => void
): Promise<string>

// Parar monitoramento
clearWatch(watchId: string): Promise<void>

// Calcular distância entre dois pontos
calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number
```

**Exemplo de uso:**
```typescript
constructor(private geoService: GeolocationService) {}

async obterLocalizacao() {
  const pos = await this.geoService.getCurrentPosition();
  if (pos) {
    console.log('Latitude:', pos.coords.latitude);
    console.log('Longitude:', pos.coords.longitude);
    console.log('Acurácia:', pos.coords.accuracy, 'metros');
  }
}

// Monitorar em tempo real
watchId: string = '';

iniciarMonitoramento() {
  this.geoService.watchPosition((pos) => {
    console.log('Nova localização:', pos.coords);
  }).then(id => this.watchId = id);
}

pararMonitoramento() {
  this.geoService.clearWatch(this.watchId);
}

// Calcular distância
distancia = this.geoService.calculateDistance(
  40.7128,  // lat 1 (NYC)
  -74.0060, // lon 1
  34.0522,  // lat 2 (LA)
  -118.2437 // lon 2
); // ~3944 km
```

---

## ⚠️ Permissões em Runtime (Android 6+)

### Importante!
A partir do Android 6.0 (API 23), as permissões **não são concedidas automaticamente**. 

O Capacitor solicita permissões **automaticamente** quando você chama os métodos. Exemplos:

- `camera.takePicture()` → Solicita permissão de câmera
- `geolocation.getCurrentPosition()` → Solicita permissão de localização

**Ao chamar qualquer método, um diálogo aparece no dispositivo pedindo permissão.**

---

## 🏗️ Como Usar na Aplicação

### 1. Injetar o Serviço

```typescript
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html'
})
export class ExampleComponent {
  constructor(
    private cameraService: CameraService,
    private geoService: GeolocationService
  ) {}
}
```

### 2. Usar os Métodos

```typescript
// Câmera
async capturePhoto() {
  const photo = await this.cameraService.takePicture();
  // Usar foto capturada
}

// Geolocalização
async getLocation() {
  const position = await this.geoService.getCurrentPosition();
  // Usar localização
}
```

### 3. Tratamento de Erros

Todos os métodos retornam `null` ou `undefined` em caso de erro. Sempre valide antes de usar:

```typescript
const photo = await this.cameraService.takePicture();
if (photo) {
  // Usar foto
} else {
  // Mostrar erro/mensagem
}
```

---

## 📱 Testando no Dispositivo

### Build e Sincronização

```bash
# Build do web
npm run build

# Sincronizar com Android
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

### No Android Studio

1. Conecte um dispositivo Android ou use um emulador
2. Clique em **Run** (ou Shift+F10)
3. Selecione o dispositivo
4. A app será instalada e executada

### Teste as Permissões

- **Câmera**: Clique em botão de câmera → Conceda permissão
- **Localização**: Clique em botão de localização → Conceda permissão

---

## 🔒 Verificação de Segurança

### Permissões Solicitadas

As permissões **não são ativadas automaticamente** na instalação. Cada recurso solicita permissão quando necessário.

### Arquivo: AndroidManifest.xml

Localização: `android/app/src/main/AndroidManifest.xml`

Todas as permissões estão declaradas corretamente para o funcionamento dos plugins.

---

## 📚 Recursos Adicionais

- [Documentação Capacitor - Camera](https://capacitorjs.com/docs/apis/camera)
- [Documentação Capacitor - Geolocation](https://capacitorjs.com/docs/apis/geolocation)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

---

## ✨ Próximos Passos

1. ✅ Permissões configuradas
2. ✅ Plugins instalados
3. ✅ Serviços criados
4. ⏭️ Implementar UI com câmera
5. ⏭️ Implementar UI com mapas/localização
6. ⏭️ Testar em dispositivo real
