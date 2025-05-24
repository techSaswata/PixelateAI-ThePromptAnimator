# Supabase Environment Setup

## Required Environment Variables

Your application is already configured to use Supabase, but you need to add your Supabase project credentials.

## Steps to Configure:

### 1. Create `.env.local` file in the root directory:

```bash
touch .env.local
```

### 2. Add the following variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Get Your Supabase Keys:

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon** **public** → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Example `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mzg4NzU5NzQsImV4cCI6MTk1NDQ1MTk3NH0.example-key-here
```

### 5. Restart your development server:

```bash
npm run dev
```

## Current Configuration:

The app is already set up to use these environment variables in:
- `src/lib/supabase.ts` - Main Supabase client
- `src/middleware.ts` - Authentication middleware

## Security Note:

- `.env.local` is already added to `.gitignore`
- Never commit your actual Supabase keys to version control
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser (required for Supabase client-side auth) 