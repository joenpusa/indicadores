# Indicadores Project

Este proyecto es una aplicación web para el seguimiento de metas e indicadores.

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- **frontend**: Aplicación React (Vite) para la interfaz de usuario.
- **backend**: API Node.js/Express para la lógica de negocio y base de datos.

## Configuración Inicial

### Prerrequisitos

- Node.js (v14+ recomendado)
- MySQL

### Instalación

1.  Clonar el repositorio.
2.  Instalar dependencias del backend:
    ```bash
    cd backend
    npm install
    ```
3.  Instalar dependencias del frontend:
    ```bash
    cd ../frontend
    npm install
    ```

## Ejecución

Para correr el proyecto en modo desarrollo:

1.  Backend:
    ```bash
    cd backend
    npm run dev
    ```
2.  Frontend:
    ```bash
    cd frontend
    npm run dev
    ```

## Autenticación

El sistema cuenta con autenticación basada en JWT.
