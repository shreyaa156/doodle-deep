# Doodle Deep

Draw a sea creature, sign your name, and watch it swim in an ocean drawn by everyone.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Without Supabase keys the site runs in **local mode**: creatures are saved in your
browser only. Open two tabs to see a new creature appear in the other one live.

## Admin

The admin page is at `/#admin` (nothing on the site links to it). It lists every
creature with search, filter by type, and delete one or many.
In local mode it needs no login. In live mode it asks for your admin email and password.

## Go live (Supabase + Vercel)

1. Create a free project at https://supabase.com.
2. In the dashboard, open **SQL Editor**, paste `supabase/schema.sql` and run it.
   Then follow step 5 at the bottom of that file to create your admin login.
   Under **Authentication → Sign In / Providers**, turn off "Allow new users to sign up".
3. Copy `.env.example` to `.env.local` and fill in the URL and anon key
   (**Project Settings → API**). Restart `npm run dev`: you're now on the shared ocean.
4. Push this folder to a GitHub repo, import it at https://vercel.com, and add the same
   two variables under **Settings → Environment Variables**. Vercel gives you the public link.

## Where things are

- `src/pages/` – the three pages: Ocean, Pick, Draw
- `src/lib/ocean.js` – the animated ocean and how each creature moves
- `src/lib/drawing.js` – bucket fill and exporting the drawing
- `src/lib/store.js` – saving and loading creatures (local or Supabase)
- `src/creatures.js` – creature types, their movement, and reference sketches
