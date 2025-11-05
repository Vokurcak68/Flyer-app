# Flyer Manager - Professional Frontend

A complete, production-ready React frontend application for managing promotional flyers.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)

## Tech Stack

- **React 19** with TypeScript
- **React Router v6** for navigation
- **TailwindCSS** for styling
- **TanStack Query (React Query)** for API state management
- **Zustand** for global state (authentication)
- **@dnd-kit** for drag-and-drop functionality
- **Axios** for API calls
- **Lucide React** for icons

## Features

### Role-Based Access Control

- **Supplier**: Create and manage products and flyers
- **Approver**: Review and approve/reject flyers
- **End User**: Browse active flyers and create custom flyers

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Basic UI components (Button, Input, Modal, etc.)
│   ├── product/       # Product-specific components
│   └── flyer/         # Flyer-specific components (Drag & Drop)
├── pages/             # Page components
│   ├── products/      # Product management pages
│   ├── flyers/        # Flyer management pages
│   ├── approvals/     # Approval pages
│   └── user-flyers/   # End user flyer pages
├── services/          # API services
├── store/             # Zustand stores
├── hooks/             # Custom hooks
├── layouts/           # Layout components
├── types/             # TypeScript interfaces
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Backend API running on http://localhost:4000/api (development)

### Development Setup

1. Install dependencies:
```bash
npm install
```

2. Environment Configuration

The project uses environment-specific configuration:

- **Development**: `.env.development` (already configured, points to localhost:4000)
- **Production**: `.env.production` (configured for https://eflyer.kuchyneoresi.eu)

No manual `.env` file needed for development!

3. Start the backend (in separate terminal):
```bash
cd backend
npm install
npm run start:dev
```

4. Start the frontend:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Demo Accounts

Once the backend is running, use these accounts:
- Supplier: `supplier@example.com` / `password`
- Approver: `approver@example.com` / `password`
- End User: `user@example.com` / `password`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Deployment

### Production Deployment

This application is designed for easy deployment to Windows Server with IIS.

**Quick Deployment:**
```powershell
# As Administrator on your local PC
cd C:\Projekty\flyer-app
.\.deploy.ps1
```

**Deployment Documentation:**
- 📘 **Quick Start**: `DEPLOYMENT_QUICK_START.md` - 3-step deployment guide
- 📗 **Full Guide**: `DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- 📕 **Server Setup**: `DEPLOYMENT_WINDOWS_IIS.md` - Initial server configuration
- ✅ **Setup Checklist**: `SERVER_SETUP_CHECKLIST.md` - Pre-deployment checklist

**Environment Configuration:**
- Development automatically uses `http://localhost:4000/api`
- Production automatically uses `https://eflyer.kuchyneoresi.eu/api`
- No hardcoded URLs - everything is environment-based!

### Deployment Options

```powershell
.\.deploy.ps1                 # Full deployment (build + deploy)
.\.deploy.ps1 -FrontendOnly   # Deploy only frontend changes
.\.deploy.ps1 -BackendOnly    # Deploy only backend changes
.\.deploy.ps1 -SkipBuild      # Deploy existing build (faster)
```

## Documentation

- 📚 **User Manual**: `USER_MANUAL.md` - Complete user guide
- 🚀 **Deployment Guide**: `DEPLOYMENT_GUIDE.md` - Production deployment
- 🔧 **Server Setup**: `DEPLOYMENT_WINDOWS_IIS.md` - Windows IIS configuration
- ✅ **Setup Checklist**: `SERVER_SETUP_CHECKLIST.md` - Server preparation

## Architecture

**Frontend:**
- React 19 + TypeScript
- TailwindCSS for styling
- React Query for API state
- Deployed on IIS as static files

**Backend:**
- NestJS (Node.js) running as Windows Service (NSSM)
- PostgreSQL database
- JWT authentication
- REST API on port 4000

**Production URL**: https://eflyer.kuchyneoresi.eu

## Learn More

- [React Documentation](https://reactjs.org/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
