# CBT Practice Simulator

A web-based Computer-Based Test (CBT) practice platform built for OOU Psychology and General Studies students preparing for semester examinations.

## What it does

- 9 courses with 200 questions each (PSY 202, PSY 204, PSY 206, PSY 208, OOU-PSY 262, OOU-PSY 264, SSC 202, GST 112, GST 212)
- 35 randomly drawn questions per practice session, stratified across all modules
- 25-minute countdown timer with auto-submit at zero
- Answers autosaved every 2 seconds — safe even on poor connections
- Full answer review after each session with correct answers, your answers, and explanations
- Attempt history per course showing score trends over time
- Works offline — answers preserved to device storage if connection drops
- Installable as a PWA on Android and iOS

## Scoring

- Each correct answer: 2 marks
- Maximum score: 70
- Passing mark: 40 / 70 (57%)

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon PostgreSQL via Prisma ORM
- **Authentication:** NextAuth v5
- **Styling:** Tailwind CSS v4
- **State management:** Zustand
- **Offline support:** Serwist (service worker)
- **Error monitoring:** Sentry
- **Analytics:** PostHog
- **Deployment:** Vercel

## Live app

[cbt-simulator-tau.vercel.app](https://cbt-simulator-tau.vercel.app)

## Local development

Clone the repository and install dependencies:

```bash
git clone https://github.com/Gbolahann/cbt-simulator.git
cd cbt-simulator
npm install