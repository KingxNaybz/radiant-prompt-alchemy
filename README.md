# 🎨 Velour Walls — Art That Moves The Soul

> The Cloud Gallery for Hyper-Real, AI-Directed Fine Art Prints

Velour Walls is a premium fine art e-commerce gallery where hyper-real digital art is directed frame by frame and sold as gallery-grade prints on canvas, tempered glass, and acrylic.

## ✨ Features

- **🖼️ Gallery Canvas** — Hand-stretched on kiln-dried solid wood. Museum-wrapped edges, zero staples on the face. Ready to hang from the moment it arrives.
- **🪟 Tempered Glass** — UV-printed onto 6mm tempered glass with brushed aluminum standoffs. Impossible depth, mirror-sharp colour, and a piece that changes with the light.
- **💎 Acrylic Face-Mount** — The museum standard. Printed face-first onto 1/4″ crystal-clear acrylic with a rigid dibond backing. Colors reach a saturation you've never seen in a print.
- **✍️ Hand-Signed Option** — Every piece can be signed by hand in archival ink. A deliberate, personal mark of authenticity.
- **🏠 Room Mockups** — Auto-generated living room / bedroom / office views for each piece so you can see how it looks in your space.
- **🎨 Commission Intake** — Full commission form with vision, room type, size, budget, and timeline fields.
- **🔍 SEO + Open Graph** — Meta tags and social card previews on every page.

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Edge Functions, Realtime)
- **Payments:** Stripe Embedded Checkout
- **Design System:** Cormorant Garamond + Inter, warm paper background, editorial gold accents

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/KingxNaybz/radiant-prompt-alchemy.git
cd radiant-prompt-alchemy

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and Stripe keys

# 4. Start dev server
npm run dev
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components (SEO, SignedImage, SiteFooter, etc.)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client & types
├── lib/            # Pricing logic, utilities
├── pages/          # Route pages (Index, Buy, Commission, Piece)
└── assets/         # Static assets
supabase/
├── functions/      # Edge functions (room mockups, etc.)
└── migrations/     # Database migrations
```

## 🔐 Environment Variables

See `.env.example` for the required variables. **Never commit `.env` files** — they contain secret keys.

## 📄 License

All artwork and content © Velour Walls. All rights reserved.
