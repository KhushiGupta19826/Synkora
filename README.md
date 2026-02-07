# Synkora Platform

A collaborative, AI-assisted project management platform with real-time collaboration features.

## Features

- 🔐 Authentication with NextAuth.js (Email/Password, Google OAuth, GitHub OAuth)
- 📊 Kanban board with drag-and-drop task management
- 🤖 AI Assistant powered by OpenAI/Gemini
- 🎨 Collaborative canvas workspace
- 📝 Real-time markdown editor
- 📈 Collaborative spreadsheet tool
- 🔄 GitHub repository integration
- 👥 Team management and project invitations
- 📱 Responsive design for all devices
- ⚡ Real-time updates with Socket.io

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **AI**: OpenAI API / Gemini API
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables template:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

5. Set up the database:

```bash
npx prisma generate
npx prisma migrate dev
```

6. Seed the database with sample data (optional):

```bash
npm run db:seed
```

This will create:
- 3 test users (alice@example.com, bob@example.com, charlie@example.com)
- Password for all test users: `password123`
- A development team with sample projects and tasks
- Activity feed entries

7. Run the development server:

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## Current Implementation Status

### ✅ Completed Features

- **Authentication System** (Task 3)
  - Email/password authentication with bcrypt
  - Google OAuth integration
  - Session management with JWT
  - Role-based access control (Owner, Editor, Viewer)
  - Protected routes and API guards

- **Dashboard and Project Management** (Task 4)
  - Project listing with cards
  - Create, read, update, delete projects
  - Team-based project organization
  - Activity feed with recent events
  - Quick actions panel
  - Responsive layout

### 🚧 In Progress

- Kanban board (Task 8)
- Real-time collaboration (Task 9)
- AI Assistant integration (Task 14)
- GitHub integration (Task 15)

### 📋 Planned Features

- Team invitations
- Project workspace with tabs
- Collaborative canvas
- Markdown editor
- Spreadsheet tool
- Analytics dashboard

## License

MIT
