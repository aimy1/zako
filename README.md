# UNO: Cybernetic Edition

A sci-fi glassmorphism UNO card game built with React, TypeScript, and Tailwind CSS. Features 1 player vs 3 AI opponents with polished animations, sound effects, and a cyberpunk-themed UI.

![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)

## Features

- **Cyberpunk UI** — Glassmorphism panels, neon glow effects, and animated backgrounds
- **Standard UNO Rules** — Number cards, Skip, Reverse, Draw Two, Wild, and Wild Draw Four
- **3 AI Opponents** — Alpha-engine bots with Gemini AI integration
- **Animations** — Card dealing, playing, and win celebrations powered by Framer Motion
- **Sound Effects** — Click, swoosh, pop, hover, and ambient audio with volume control
- **Customizable** — Choose your callsign, avatar, and audio settings
- **Responsive** — Works on desktop and mobile browsers

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Framework    | React 19 + TypeScript             |
| Build Tool   | Vite 6                            |
| Styling      | Tailwind CSS 4                    |
| Animation    | Motion (Framer Motion)            |
| Icons        | Lucide React                      |
| AI Backend   | Google Gemini API (`@google/genai`) |
| Server       | Express (production)              |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Google Gemini API Key](https://ai.google.dev/)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd uno_-cybernetic-edition

# Install dependencies
npm install
```

### Configuration

Create a `.env.local` file in the project root (or edit the existing one):

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run preview
```

## How to Play

1. **Start** — Click `INITIALIZE MATCH` on the main menu
2. **Your Turn** — Play a matching card (same color, number, or action) from your hand, or draw from the pile
3. **Special Cards**:
   - **Skip** — Next player loses their turn
   - **Reverse** — Changes play direction
   - **Draw Two (+2)** — Next player draws 2 cards and skips
   - **Wild** — Choose the next color
   - **Wild Draw Four (+4)** — Choose color, next player draws 4 and skips
4. **UNO** — Hit the UNO button when you have 2 or fewer cards
5. **Win** — First player to empty their hand wins

## Project Structure

```
src/
├── components/
│   ├── AIHand.tsx          # AI opponent hand display
│   ├── CyberConfetti.tsx   # Win celebration effects
│   └── UnoCard.tsx         # Card rendering component
├── hooks/
│   ├── useAudio.ts         # Sound effects management
│   └── useUno.ts           # Core game logic hook
├── lib/
│   ├── aiLogic.ts          # Gemini AI opponent logic
│   └── deckUtil.ts         # Deck utilities & rule validation
├── utils/
│   └── audio.ts            # Audio file helpers
├── App.tsx                 # Main app & game UI
├── main.tsx                # Entry point
├── index.css               # Global styles & Tailwind
└── types.ts                # TypeScript type definitions
```

## License

MIT
