# FlashMinds

A web application for creating, organizing, and practicing flashcard decks.

FlashMinds allows users to organize learning content into decks, categories, tags, and bundles, then practice cards using multiple interactive study modes.

## Live Demo

**https://flashcards.learnypie.com/**

## Features

### Deck Management

Users can create and organize flashcard decks containing custom questions and answers.

Decks provide an overview of:

- Total number of cards
- Learning progress
- Cards currently in progress
- Cards ready to learn
- Favorite and public/private status

### Card Management

Each deck contains individual flashcards with questions and answers.

Users can:

- Create cards
- Edit cards
- Delete cards
- Search cards within a deck
- Filter and sort cards
- Track learning progress
- Rate card difficulty

### Organization

Learning content can be organized using:

- Decks
- Bundles
- Categories
- Tags

This makes it easier to group related learning material and navigate larger collections of cards.

### Practice Modes

Each deck can be practiced using several interactive study modes.

#### Flashcards

Review cards one by one and rate how well the answer was remembered.

#### Multiple Choice

Choose the correct answer from multiple options.

Harder cards can appear more frequently based on learning progress.

#### Write the Answer

Type the answer from memory.

A hint option is available when additional help is needed.

#### Match Pairs

Match questions with their corresponding answers.

#### Timed Cards

Review cards that automatically advance for faster practice sessions.

#### Word Puzzle

Reconstruct the correct answer by arranging words in the correct order.

### Learning Progress

The application tracks the learning state of cards and displays progress within each deck.

Cards can be categorized by learning status, including:

- Learned
- In progress
- Ready to learn

Progress indicators provide a quick overview of learning activity for each deck.

### Search and Filtering

Users can search and filter learning content by:

- Deck
- Card content
- Tags
- Learning status
- Favorites
- Public or private decks

### Responsive Design

FlashMinds provides responsive layouts for desktop and mobile devices.

The interface includes:

- Adaptive layouts
- Mobile-friendly navigation
- Bottom navigation for smaller screens
- Responsive card grids
- Mobile-optimized practice screens

## Tech Stack

### Front End

- React
- TypeScript
- React Router
- Zustand
- Tailwind CSS

### Development

- Vite
- npm
- Git
- GitHub

## Project Structure

```text
src/
├── api/          # API communication
├── components/   # Reusable UI components
├── features/     # Feature-specific functionality
├── hooks/        # Custom React hooks
├── pages/        # Application pages
├── store/        # Global state management
├── types/        # TypeScript types
├── utils/        # Utility functions
├── App.tsx
└── main.tsx
