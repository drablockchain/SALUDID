# 🏥 SaludID - Certificados Médicos NFT

## 📋 Descripción del Proyecto

**SaludID** es una plataforma descentralizada que permite a los médicos autorizados emitir certificados médicos como NFTs (Non-Fungible Tokens) en la blockchain de Filecoin. Los certificados están respaldados por IPFS para garantizar la inmutabilidad y accesibilidad de los datos médicos.

### 🎯 Objetivo

Crear un sistema de certificados médicos digitales que sea:
- **Inmutable**: Los datos no pueden ser modificados una vez registrados
- **Descentralizado**: No depende de una autoridad central
- **Verificable**: Cualquier persona puede verificar la autenticidad
- **Privado**: Los datos sensibles están encriptados
- **Accesible**: Disponible 24/7 desde cualquier lugar

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

- **🔐 Autenticación de Médicos**: Solo médicos autorizados pueden emitir certificados
- **📄 Emisión de Certificados**: Formulario completo para crear certificados médicos
- **🔒 Encriptación de Datos**: Los documentos médicos se encriptan antes de subir a IPFS
- **🌐 Almacenamiento IPFS**: Respaldo descentralizado usando Pinata IPFS
- **⛓️ Blockchain Filecoin**: NFTs minteados en Filecoin Calibration Testnet
- **🔍 Verificación de Certificados**: Sistema para verificar la autenticidad
- **📱 Interfaz Web**: Aplicación Next.js con diseño moderno
- **🔗 Integración Web3**: Conexión con MetaMask y otras wallets

### 🏗️ Arquitectura Técnica

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   IPFS          │
│   (Next.js)     │◄──►│   Contract      │◄──►│   (Pinata)      │
│                 │    │   (Filecoin)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   Filecoin      │    │   Documentos    │
│   Wallet        │    │   Calibration   │    │   Encriptados   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 14**: Framework de React para aplicaciones web
- **Tailwind CSS**: Framework de CSS para diseño responsivo
- **Web3.js**: Interacción con la blockchain
- **MetaMask**: Conexión de wallet

### Blockchain
- **Filecoin Calibration Testnet**: Red de prueba de Filecoin
- **Solidity 0.8.20**: Lenguaje de contratos inteligentes
- **Hardhat**: Framework de desarrollo blockchain
- **Ethers.js**: Biblioteca para interactuar con Ethereum/Filecoin

### Almacenamiento
- **IPFS**: Protocolo de almacenamiento descentralizado
- **Pinata**: Servicio de IPFS con gateway público
- **Encriptación AES**: Protección de datos sensibles

### Herramientas de Desarrollo
- **Node.js**: Entorno de ejecución JavaScript
- **npm**: Gestor de paquetes
- **Git**: Control de versiones

## 📁 Estructura del Proyecto

```
hackaton_latina_SaludID/
├── app/                          # Aplicación Next.js
│   ├── api/                      # API Routes
│   ├── globals.css              # Estilos globales
│   ├── layout.js                # Layout principal
│   └── page.js                  # Página principal
├── components/                   # Componentes React
│   ├── CertificateForm.js       # Formulario de certificados
│   ├── Dashboard.js             # Panel de control
│   ├── Header.js                # Encabezado
│   ├── NetworkStatus.js         # Estado de la red
│   ├── UnlockCheckoutButton.js  # Botón de checkout
│   └── VerificationPanel.js     # Panel de verificación
├── contracts/                    # Contratos inteligentes
│   └── MedicalCertificateNFT.sol
├── hooks/                       # Hooks personalizados
│   └── useUnlock.js
├── lib/                         # Servicios y utilidades
│   ├── blockchain.js            # Servicio de blockchain
│   ├── encryption.js            # Encriptación
│   ├── ipfs.js                  # Servicio IPFS principal
│   ├── pinata-ipfs.js           # Servicio Pinata IPFS
│   ├── storacha-ipfs.js         # Servicio Storacha IPFS
│   └── metamask.js              # Integración MetaMask
├── scripts/                     # Scripts de Hardhat
│   ├── deploy_filecoin.js       # Despliegue en Filecoin
│   ├── check_contract.js        # Verificación de contrato
│   └── add_doctor_simple.js     # Autorización de médicos
├── test/                        # Pruebas
│   └── MedicalCertificateNFT.test.js
├── .env                         # Variables de entorno
├── hardhat.config.js            # Configuración Hardhat
├── next.config.js               # Configuración Next.js
├── package.json                 # Dependencias
└── README.md                    # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ (recomendado: Node.js 20)
- npm o yarn
- MetaMask instalado en el navegador
- Cuenta en Pinata (para IPFS)

### 1. Clonar el Repositorio

   ```bash
   git clone <repository-url>
cd hackaton_latina_SaludID
   ```

### 2. Instalar Dependencias

   ```bash
npm install --legacy-peer-deps
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` basado en `env.example`:

   ```env
# Contract configuration - Filecoin Calibration Testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x6Ae38115D6e1aa16Cf6B436a6Bb468392350F388
NEXT_PUBLIC_NETWORK_ID=314159

# Pinata IPFS
NEXT_PUBLIC_PINATA_API_KEY=tu_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=tu_secret_key
NEXT_PUBLIC_PINATA_JWT=tu_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=tu_gateway

# Storacha.network (opcional)
NEXT_PUBLIC_STORACHA_DID=tu_did

# Clave privada para scripts (solo desarrollo)
PRIVATE_KEY=tu_private_key
```

### 4. Configurar MetaMask

1. Agregar red Filecoin Calibration:
   - **Nombre**: Filecoin Calibration
   - **RPC URL**: `https://rpc.ankr.com/filecoin_testnet`
   - **Chain ID**: `314159`
   - **Símbolo**: `tFIL`
   - **Explorador**: `https://calibration.filscan.io`

2. Obtener FIL de prueba desde el [faucet](https://faucet.calibration.fildev.network/)

### 5. Ejecutar la Aplicación

   ```bash
# Desarrollo
   npm run dev

# Compilar contratos
npm run compile

# Desplegar contrato (solo si es necesario)
npm run deploy

# Verificar estado del contrato
npm run check
```

## 📖 Guía de Uso

### Para Médicos

1. **Conectar Wallet**: Conectar MetaMask a la red Filecoin Calibration
2. **Verificar Autorización**: El sistema verificará si eres un médico autorizado
3. **Emitir Certificado**:
   - Llenar formulario con datos del paciente
   - Subir documento médico (PDF, imagen, etc.)
   - Establecer contraseña de encriptación
   - Confirmar transacción
4. **Verificar Emisión**: El NFT se minteará y aparecerá en la wallet del paciente

### Para Pacientes

1. **Recibir Certificado**: El NFT aparecerá automáticamente en tu wallet
2. **Verificar Certificado**: Usar el panel de verificación con el token ID
3. **Compartir Certificado**: El NFT puede ser transferido o mostrado

### Para Verificación

1. **Acceder al Panel**: Ir a la sección de verificación
2. **Ingresar Token ID**: Proporcionar el ID del certificado
3. **Ver Detalles**: El sistema mostrará toda la información del certificado

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Blockchain
npm run compile          # Compilar contratos
npm run test             # Ejecutar pruebas
npm run deploy           # Desplegar contrato
npm run check            # Verificar estado del contrato
npm run add-doctor       # Autorizar nuevo médico

# Utilidades
npm run lint             # Linter de código
```

## 🌐 Redes Soportadas

### Filecoin Calibration Testnet (Desarrollo)
- **Chain ID**: 314159
- **RPC**: https://rpc.ankr.com/filecoin_testnet
- **Explorador**: https://calibration.filscan.io
- **Faucet**: https://faucet.calibration.fildev.network/

### Filecoin Mainnet (Producción)
- **Chain ID**: 314
- **RPC**: https://api.node.glif.io/rpc/v1
- **Explorador**: https://filscan.io

## 🔒 Seguridad

### Encriptación de Datos
- Los documentos médicos se encriptan con AES antes de subir a IPFS
- Solo el paciente puede desencriptar con la contraseña proporcionada
- Los metadatos del certificado son públicos pero los documentos están protegidos

### Autorización
- Solo el propietario del contrato puede autorizar médicos
- Los médicos autorizados pueden emitir certificados
- Los certificados no pueden ser modificados una vez emitidos

### Privacidad
- Los datos sensibles están encriptados
- Solo se almacenan hashes de nombres de pacientes
- Los documentos originales solo son accesibles con la contraseña

## 📊 Estado Actual del Proyecto

### ✅ Completado
- [x] Contrato inteligente desplegado en Filecoin Calibration
- [x] Frontend funcional con Next.js
- [x] Integración con MetaMask
- [x] Sistema de encriptación de documentos
- [x] Almacenamiento IPFS con Pinata
- [x] Formulario de emisión de certificados
- [x] Panel de verificación
- [x] Autorización de médicos
- [x] Interfaz responsiva

### 🔄 En Progreso
- [ ] Optimización de gas fees
- [ ] Mejoras en la UI/UX
- [ ] Documentación de API

### 📋 Próximas Características
- [ ] Sistema de revocación de certificados
- [ ] Integración con más wallets
- [ ] API REST para integraciones
- [ ] Dashboard de administración
- [ ] Notificaciones push
- [ ] Exportación de certificados

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: [Jorge Parejo]
- **Blockchain Developer**: [Ángel Piérola]
- **Médico experto**: [drablockchain] 


## 🙏 Agradecimientos

- **Filecoin Foundation** por la infraestructura blockchain
- **Pinata** por el servicio de IPFS
- **MetaMask** por la integración de wallets
- **Next.js Team** por el framework
- **Tailwind CSS** por el sistema de diseño

---

## 📈 Estadísticas del Proyecto

- **Certificados Emitidos**: 11+ (en testnet)
- **Médicos Autorizados**: 1
- **Documentos en IPFS**: 11+
- **Tiempo de Desarrollo**: 2 semanas
- **Líneas de Código**: 2000+

## 🔗 Enlaces Útiles

- [Documentación de Filecoin](https://docs.filecoin.io/)
- [Guía de IPFS](https://docs.ipfs.io/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Guía de MetaMask](https://metamask.io/)
- [Pinata Documentation](https://docs.pinata.cloud/)

---

**¡SaludID - Certificados Médicos Descentralizados! 🏥⚡**

*Construido con ❤️ para la Latina Hackaton Startup Program SaludID*
