# Judge - Fullstack React Native Application

A fullstack mobile application built with React Native (Expo) and Fastify backend.

## Project Structure

```
judge/
├── ai-judge/          # React Native frontend (Expo)
├── backend/           # Fastify + Prisma backend
└── README.md
```

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Expo Router

### Backend
- Fastify
- Prisma
- TypeScript
- PostgreSQL (Supabase)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- For iOS: Xcode (Mac only)
- For Android: Android Studio

### Setup

1. **Install dependencies:**
   ```bash
   # Frontend
   cd ai-judge
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

2. **Environment variables:**
   - Copy `.env.example` to `.env` in both `backend/` and `ai-judge/`
   - Fill in your actual values (never commit `.env` files!)

3. **Database setup:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db pull  # If connecting to existing database
   ```

4. **Run the application:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd ai-judge
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Frontend
- `npm start` - Start Expo dev server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator

## Security Notes

- Never commit `.env` files
- All secrets should be in environment variables
- Database credentials are stored in `.env` files (gitignored)
