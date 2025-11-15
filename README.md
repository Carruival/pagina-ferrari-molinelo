# 🏎️ Ferrari Racing Game v2.0

> Simulador profesional de estrategias de F1 con calculadora avanzada de neumáticos y combustible

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-v10.11.0-orange)](https://firebase.google.com/)

## ✨ Características Principales

### 🔧 Calculadora de Estrategias Avanzada
- **Cálculo preciso de desgaste de neumáticos** usando fórmulas realistas de F1
- **Análisis de consumo de combustible** con diferentes niveles de empuje
- **Optimización automática de estrategias** basada en características del circuito
- **Comparación de múltiples estrategias** con análisis de pros y contras

### 👥 Gestión de Pilotos y Equipos
- Sistema completo de gestión de pilotos con estadísticas personalizables
- Seguimiento de victorias, podios, puntos y estadísticas custom
- Filtrado por categorías (F1, F2, F3, F4, F5, K6)
- Banderas de países automáticas

### 🏆 Historial de Resultados
- Registro detallado de resultados de carreras
- Organización por categorías y fechas
- Posiciones y pilotos participantes

### 🏛️ Base de Datos de Circuitos
- Información detallada de 24 circuitos de F1
- Consejos de configuración y estrategia
- Datos técnicos (longitud, vueltas, desgaste)
- Dificultad y características específicas

### 💬 Chat en Tiempo Real
- Sistema de mensajería instantánea
- Sincronización automática entre usuarios
- Historial persistente de conversaciones

## 🚀 Mejoras v2.0

### 🔐 Seguridad Mejorada
- ✅ Hash de contraseñas (simulado para demo)
- ✅ Validación y sanitización de datos
- ✅ Rate limiting para intentos de login
- ✅ Manejo seguro de sesiones
- ✅ Variables de entorno para configuración

### 🎨 Interfaz de Usuario Moderna
- ✅ Diseño responsive optimizado para móviles
- ✅ Accesibilidad mejorada (ARIA, navegación por teclado)
- ✅ Estados de carga con skeletons y spinners
- ✅ Sistema de notificaciones toast
- ✅ Tooltips informativos

### ⚡ Rendimiento y Arquitectura
- ✅ Arquitectura modular con ES6 modules
- ✅ Manejo de errores robusto
- ✅ Cache inteligente con Service Workers
- ✅ Optimización de recursos y carga
- ✅ Código separado en módulos especializados

### 🧪 Funcionalidades Avanzadas
- ✅ Optimizador automático de estrategias
- ✅ Análisis de impacto de rendimiento de neumáticos
- ✅ Calculadora de eficiencia de combustible
- ✅ Validación de formularios en tiempo real
- ✅ Funcionalidad offline básica

## 🛠️ Instalación y Uso

### Prerrequisitos
- Navegador web moderno con soporte para ES6 modules
- Conexión a internet (para Firebase)
- Node.js (opcional, para desarrollo)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/Carruival/pagina-ferrari-molinelo.git
   cd pagina-ferrari-molinelo
   ```

2. **Instala dependencias (opcional)**
   ```bash
   npm install
   ```

3. **Configura Firebase**
   - Copia `.env.example` a `.env`
   - Añade tus credenciales de Firebase (o usa las de demo)

4. **Inicia la aplicación**
   ```bash
   # Con servidor local
   npm run dev
   
   # O simplemente abre index.html en tu navegador
   ```

### Estructura del Proyecto

```
ferrari-racing-game/
├── index.html                 # Página principal
├── sw.js                     # Service Worker
├── package.json              # Configuración del proyecto
├── .env.example             # Variables de entorno (ejemplo)
├── .gitignore               # Archivos ignorados por Git
├── assets/
│   ├── css/
│   │   └── main.css         # Estilos principales
│   └── js/
│       ├── main.js          # Aplicación principal
│       └── modules/
│           ├── config.js    # Configuración
│           ├── utils.js     # Utilidades
│           ├── auth.js      # Autenticación
│           ├── database.js  # Base de datos
│           ├── calculations.js # Cálculos
│           └── ui.js        # Interfaz de usuario
└── README.md                # Documentación
```

## 🎮 Guía de Uso

### Primer Uso
1. **Registro**: Crea una cuenta nueva o usa las credenciales de demo
2. **Login**: Inicia sesión con tu usuario y contraseña
3. **Navegación**: Usa las pestañas superiores para moverte entre secciones

### Calculadora de Estrategias
1. **Selecciona un circuito** del dropdown
2. **Ajusta los puntos** de neumáticos y combustible según tu setup
3. **Configura los stints**:
   - Selecciona el compuesto de neumático (SS/S/M/H)
   - Define el número de vueltas
   - Elige el nivel de empuje
4. **Optimiza automáticamente** con el botón "🧠 Optimizar"

### Interpretación de Resultados

#### Desgaste de Neumáticos
- **Verde (>70%)**: Excelente condición
- **Amarillo (40-70%)**: Condición aceptable
- **Rojo (<40%)**: Degradación crítica

#### Consumo de Combustible
- **Azul**: Información de combustible por stint
- **Verde/Rojo**: Impacto en tiempos de vuelta

### Gestión de Datos
- **Pilotos**: Añade y gestiona estadísticas de pilotos
- **Resultados**: Registra resultados de carreras
- **Circuitos**: Información detallada y consejos

## 🧮 Fórmulas y Cálculos

### Desgaste de Neumáticos

La aplicación utiliza un modelo matemático avanzado basado en datos reales de F1:

```javascript
// Cálculo base (compuesto Medium)
W_M = (1.43 * (Te/1.5)^-0.0778 * (0.00364*Tw + 0.354) * D * 1.384612 * (200-D0)) / 10000 * 100

// Multiplicadores por compuesto
W_SS = W_M * 2.06    // Superblando
W_S = W_SS * 0.642   // Blando  
W_H = W_SS * 0.375   // Duro

// Desgaste total con modelo exponencial
Restante = 100 * e^(-1.18 * (Wc/100) * N)
```

Donde:
- `Te`: Puntos de neumático del jugador
- `Tw`: Desgaste base del circuito (%)
- `D`: Longitud del circuito (km)
- `N`: Número de vueltas del stint
- `D0`: Constante de calibración (50)

### Consumo de Combustible

```javascript
// Combustible base por vuelta
FuelPerLap = 98.45644 * (FuelPoints^-0.088463) * CircuitLength / 139.771

// Con modificador de empuje
FuelStint = FuelPerLap * Laps * BoostMultiplier
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Firebase Configuration
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_DATABASE_URL=https://tu_proyecto.firebasedatabase.app
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# App Configuration  
APP_NAME=Ferrari Racing Game
APP_VERSION=2.0.0
```

### Personalización

#### Circuitos Personalizados
Modifica `assets/js/modules/config.js` para añadir nuevos circuitos:

```javascript
'NEW': { 
    name: 'Nuevo Circuito', 
    length: 5.0, 
    laps: 25, 
    tyreWear: 50,
    country: 'XX',
    timezone: 'Europe/Madrid',
    difficulty: 'Medium'
}
```

#### Niveles de Empuje
Personaliza los multiplicadores en `config.js`:

```javascript
boostLevels: {
    'custom': { multiplier: 1.02, label: 'Custom (+2%)' }
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Error de Conexión Firebase
- Verifica las credenciales en `.env`
- Comprueba la conectividad a internet
- Revisa la consola del navegador para errores específicos

#### Aplicación no Carga
- Asegúrate de usar un navegador moderno
- Verifica que JavaScript esté habilitado
- Comprueba la consola para errores de módulos ES6

#### Cálculos Incorrectos
- Verifica que los valores de entrada sean válidos
- Revisa que el circuito seleccionado tenga datos completos
- Comprueba la consola para errores de cálculo

### Debugging

Activa el modo debug añadiendo `?debug=true` a la URL:
```
http://localhost:3000/?debug=true
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue el estilo de código existente
- Añade comentarios descriptivos
- Actualiza la documentación si es necesario
- Prueba tu código antes de enviar

## 📝 Changelog

### v2.0.0 (2024-11-14)
- ✨ **Nueva arquitectura modular** con ES6 modules
- 🔐 **Seguridad mejorada** con hash de contraseñas y validación
- 🎨 **UI/UX renovada** con diseño responsive y accesibilidad
- ⚡ **Rendimiento optimizado** con cache y Service Workers
- 🧮 **Calculadora avanzada** con optimización automática
- 🌐 **Funcionalidad offline** básica
- 📱 **Soporte móvil** mejorado
- 🔧 **Estados de carga** y manejo de errores robusto

### v1.0.0
- Versión inicial con funcionalidades básicas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Álvaro Molinelli**
- GitHub: [@Carruival](https://github.com/Carruival)
- Proyecto: [Ferrari Racing Game](https://github.com/Carruival/pagina-ferrari-molinelo)

## 🙏 Agradecimientos

- Datos de circuitos basados en información oficial de F1
- Fórmulas de cálculo inspiradas en simuladores profesionales
- Comunidad de desarrolladores por feedback y sugerencias

## 📊 Estadísticas del Proyecto

- **Líneas de código**: ~3,000+
- **Archivos**: 12
- **Módulos**: 6
- **Circuitos soportados**: 24
- **Funcionalidades**: 15+

---

⭐ Si este proyecto te ha sido útil, ¡no olvides darle una estrella!

🏎️ **¡Que disfrutes calculando tus estrategias ganadoras!** 🏆