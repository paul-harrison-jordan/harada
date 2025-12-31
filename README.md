# Harada Method - Personal Development Web App

A web application built with Next.js to help you achieve your goals using the Harada Method's Open Window 64 framework.

## What is the Harada Method?

The Harada Method is a goal-setting framework developed by Japanese educator Takashi Harada. It uses a 9x9 grid (81 cells) structured as follows:

- **Center Cell**: Your main goal
- **8 Behaviors**: Key behaviors surrounding your goal
- **64 Actions**: Each behavior is surrounded by 8 actionable steps

This creates a comprehensive plan that breaks down ambitious goals into concrete, daily actions.

## Features

- 🎯 Interactive 9x9 Harada chart
- 🔐 Secure authentication with Google and GitHub OAuth
- 💾 Automatic cloud storage with Supabase
- 📱 Responsive design
- ⚡ Real-time updates
- 🎨 Clean, intuitive interface

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (OAuth)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- Google and/or GitHub OAuth credentials (optional, for authentication)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd harada
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up (this takes a few minutes)

#### Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor

#### Configure OAuth Providers

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** and/or **GitHub** providers
3. Follow the instructions to set up OAuth apps:
   - **Google**: Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
   - **GitHub**: Create OAuth app in [GitHub Settings](https://github.com/settings/developers)
4. Add the callback URL from Supabase to your OAuth apps

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Find these values in your Supabase project settings under **API**.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Click "Continue with Google" or "Continue with GitHub"
2. **Set Your Goal**: Click the center cell (🎯) and enter your main goal
3. **Define Behaviors**: Fill in the 8 cells around your goal with key behaviors
4. **Plan Actions**: For each behavior, fill in the surrounding 8 cells with specific actions
5. **Save**: Changes are automatically saved to the cloud

## Project Structure

```
harada/
├── app/
│   ├── actions/          # Server actions for data mutations
│   ├── auth/             # Authentication routes
│   ├── dashboard/        # Main dashboard page
│   ├── login/            # Login page
│   └── page.tsx          # Root page (redirects)
├── components/
│   ├── HaradaCell.tsx    # Individual cell component
│   └── HaradaGrid.tsx    # 9x9 grid component
├── lib/
│   ├── supabase/         # Supabase client utilities
│   ├── grid-utils.ts     # Grid helper functions
│   └── types.ts          # TypeScript type definitions
└── supabase/
    └── migrations/       # Database schema
```

## Database Schema

### harada_charts
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `title`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### chart_cells
- `id`: UUID (primary key)
- `chart_id`: UUID (foreign key to harada_charts)
- `row_index`: Integer (0-8)
- `col_index`: Integer (0-8)
- `cell_type`: Text (goal, behavior, action)
- `content`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Development

### Build for Production

```bash
npm run build
```

### Run Production Build Locally

```bash
npm start
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Contributing

This is a personal project, but feel free to fork it and customize it for your own use!

## License

MIT

## Acknowledgments

- Takashi Harada for creating the Harada Method
- The Next.js and Supabase teams for their excellent frameworks
