# ScholarMind - AI Study Assistant

ScholarMind is a full-stack AI study and exam preparation platform that works as a personalized digital tutor. Students can ask academic questions, upload study materials, generate summaries and notes, create quizzes and flashcards, build study plans, organize subjects and syllabus topics, and monitor their learning progress from one application.

## Features

- **AI Study Chat:** Ask questions and receive step-by-step academic guidance.
- **Study Modes:** Tutor, Exam, Beginner, Coding, Quiz, and Quick Revision modes.
- **Document Uploads:** Upload study materials, generate AI summaries, view document text, and chat with course content.
- **AI Notes Generator:** Create concise, standard, or comprehensive study notes.
- **Text Summarizer:** Convert long text into bullet points, executive summaries, key takeaways, or simplified explanations.
- **Quiz Generator:** Generate saved multiple-choice quizzes with configurable difficulty and question count.
- **Flashcard Generator:** Create active-recall flashcard decks with hints, difficulty levels, and mastery tracking.
- **AI Study Planner:** Generate day-by-day study plans with goals, tasks, study hours, and completion tracking.
- **Code Explainer:** Understand code, algorithms, complexity, edge cases, and possible improvements.
- **Doubt Solver:** Solve academic problems with structured explanations, formulas, verification, and exam tips.
- **Topic Explainer:** Learn a topic at beginner, high-school, college, or expert level.
- **Practice Questions:** Generate conceptual, numerical, coding, or mixed practice questions with hints and solutions.
- **Subject and Syllabus Management:** Create subjects, add topics, mark topics as mastered, and launch study tools for each topic.
- **Notes Management:** Save, view, update, and delete generated notes.
- **Progress Dashboard:** Track study streaks, XP, levels, quiz scores, completed tasks, mastered flashcards, and recent sessions.
- **Authentication:** Register, sign in, use demo login, update profile details, and securely log out.
- **Responsive Interface:** Sidebar navigation, dark/light themes, language selection, loading states, and responsive layouts.

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- React Markdown and Remark GFM

### Backend

- Node.js
- Express
- TypeScript
- TSX
- Vite middleware for development

### AI and Security

- Google Gemini API through `@google/genai`
- JWT-based authentication
- bcrypt password hashing
- Protected Express API routes

### Data and File Processing

- Local JSON data store in `data/db.json`
- Optional MongoDB configuration
- PDF parsing support with `pdf-parse`
- DOCX processing support with `mammoth`

## Project Structure

```text
.
├── data/                 Local application data
├── server/               Database, authentication, and AI services
├── server.ts             Express server and API routes
├── src/
│   ├── components/       Auth, chat, dashboard, tools, and feature views
│   ├── context/          Authentication, language, and theme state
│   ├── services/         Frontend API client
│   └── types/            Shared TypeScript types
├── index.html            Application entry document
├── package.json          Scripts and dependencies
├── tsconfig.json         TypeScript configuration
└── vite.config.ts        Vite configuration
```

## Requirements

- Node.js 18 or newer
- npm
- A Google Gemini API key for AI features

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/ScholarMind_AI_Study_Tutor.git
   cd ScholarMind_AI_Study_Tutor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   copy .env.example .env
   ```

   On macOS or Linux, use:

   ```bash
   cp .env.example .env
   ```

4. Open `.env` and set at least a real `GEMINI_API_KEY`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for AI features | Google Gemini API key used by the server-side AI service. |
| `JWT_SECRET` | Recommended | Secret used to sign authentication tokens. |
| `APP_URL` | Optional | Public application URL for hosted deployments. |
| `MONGODB_URI` | Optional | MongoDB connection string. The application uses the local JSON store when it is not set. |

Never commit `.env` or expose your Gemini API key in frontend code. Commit `.env.example` with placeholder values only.

## Running the Application

Start the development server:

```bash
npm run dev
```

The application is served at `http://localhost:3000`. The development server runs the Express API and Vite frontend together.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Build the frontend and bundle the production server. |
| `npm run start` | Start the bundled production server from `dist/server.cjs`. |
| `npm run preview` | Preview the Vite production frontend. |
| `npm run clean` | Remove generated build output. |

## How It Works

1. A student signs in or creates an account.
2. The React frontend sends authenticated requests to the Express API.
3. The API validates the user through JWT middleware.
4. AI requests are sent from the server to Google Gemini.
5. Generated notes, quizzes, flashcards, plans, summaries, and conversations are saved for the user.
6. The frontend displays the results through the chat, dashboard, document reader, and study tool interfaces.

## Example User Workflow

1. Create a subject such as Biology or Computer Science.
2. Add syllabus topics to the subject.
3. Upload lecture notes or a textbook chapter.
4. Review the generated AI summary and key topics.
5. Ask questions about the document in AI Study Chat.
6. Generate notes, a quiz, and flashcards for revision.
7. Create a multi-day study plan.
8. Complete tasks and review progress on the dashboard.

## Security Notes

- Keep API keys and JWT secrets in environment variables.
- Do not commit `.env` files, tokens, or private user data.
- Change the default `JWT_SECRET` before deploying publicly.
- Use HTTPS for production deployments.
- Review the local database contents before publishing the repository if it contains personal or demo data.

## Production Build

```bash
npm run build
npm run start
```

Set `NODE_ENV=production` when deploying so Express serves the built frontend from `dist`.

## Future Improvements

Potential enhancements include voice-based tutoring, stronger PDF and image understanding, cloud file storage, calendar reminders, collaborative study groups, mobile support, advanced spaced repetition, and more detailed learning analytics.

## License

No license has been specified yet. Add a license file before distributing the project publicly.
