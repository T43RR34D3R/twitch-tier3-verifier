This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

### Game Voting System
- **Discord Authentication**: Users can sign in using Discord OAuth
- **Twitch Authentication**: Legacy support for Twitch OAuth (optional)
- **IGDB Integration**: Search and add games from the IGDB database
- **Vote Limiting**: Each user can vote for up to 3 games
- **Admin Controls**: Manage games, approve/feature games, and monitor voting activity

### Setup Guides
- [Discord Authentication Setup](./DISCORD_AUTH_SETUP.md) - Configure Discord OAuth for user authentication
- [Environment Configuration](./.env.example) - Example environment variables

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- Discord Application (for OAuth)
- Optional: Twitch Application (for IGDB game search)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/T43RR34D3R/twitch-tier3-verifier.git
cd twitch-tier3-verifier
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Key Pages

- `/subathon-voting` - Main game voting interface
- `/admin/games` - Admin panel for game management
- `/auth/signin` - Authentication page (Discord/Twitch)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

