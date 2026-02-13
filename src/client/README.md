# CareerConnect Frontend

A modern React-based frontend for the AI-powered resume parsing and job recommendation platform, built with Vite.

## Features

- **Modern React 18** with hooks and functional components
- **Vite** for fast development and optimized builds
- **Material-UI (MUI)** for beautiful, responsive UI components
- **React Router** for client-side routing
- **React Query** for efficient data fetching and caching
- **Socket.IO** for real-time communication
- **OAuth Integration** for secure authentication
- **Responsive Design** for all devices
- **TypeScript Ready** (can be easily converted)

## Tech Stack

- **React 18.2.0**
- **Vite 4.1.0**
- **Material-UI 5.11.10**
- **React Router DOM 6.8.1**
- **React Query 3.39.3**
- **Socket.IO Client 4.6.1**
- **Axios 1.3.4**
- **React Hook Form 7.43.5**
- **React Hot Toast 2.4.0**

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd src/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Auth/           # Authentication components
│   │   ├── Layout/         # Layout components
│   │   └── ...
│   ├── contexts/           # React contexts for state management
│   │   ├── AuthContext.jsx
│   │   ├── SocketContext.jsx
│   │   ├── ResumeContext.jsx
│   │   └── JobContext.jsx
│   ├── pages/              # Page components
│   │   ├── Auth/          # Authentication pages
│   │   ├── Dashboard/     # Dashboard pages
│   │   ├── Resume/        # Resume management pages
│   │   ├── Jobs/          # Job-related pages
│   │   ├── Employer/      # Employer-specific pages
│   │   ├── Chat/          # Chat functionality
│   │   ├── Video/         # Video conferencing
│   │   └── Error/         # Error pages
│   ├── services/          # API service functions
│   │   ├── api.js         # Axios configuration
│   │   ├── authService.js
│   │   ├── resumeService.js
│   │   └── jobService.js
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── App.jsx            # Main App component
│   └── main.jsx           # Application entry point
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Key Features

### Authentication
- JWT-based authentication
- OAuth integration (Google, LinkedIn, GitHub)
- Protected routes
- Automatic token refresh

### Resume Management
- AI-powered resume parsing
- Resume upload and analysis
- Resume editing and optimization
- Multiple resume support

### Job Recommendations
- AI-driven job matching
- Personalized recommendations
- Job search and filtering
- Application tracking

### Real-time Features
- Live resume processing updates
- Real-time notifications
- Chat functionality
- Video conferencing

### Employer Features
- Job posting interface
- Candidate search and filtering
- Interview scheduling
- Application management

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Material-UI components consistently
- Implement proper error handling

### State Management
- Use React Context for global state
- Use React Query for server state
- Use local state for component-specific data

### API Integration
- Use service functions for API calls
- Implement proper error handling
- Use React Query for caching and synchronization

### Styling
- Use Material-UI's `sx` prop for custom styles
- Follow the design system
- Ensure responsive design
- Use theme variables for consistency

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `VITE_LINKEDIN_CLIENT_ID` | LinkedIn OAuth Client ID | - |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | - |
| `VITE_TURN_SERVER_URL` | TURN server for video calls | - |
| `VITE_ENABLE_VIDEO_CALLS` | Enable video call feature | `true` |
| `VITE_ENABLE_CHAT` | Enable chat feature | `true` |
| `VITE_ENABLE_OAUTH` | Enable OAuth authentication | `true` |

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of the CareerConnect platform.
