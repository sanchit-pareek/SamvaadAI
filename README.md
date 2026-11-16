# SamvaadAI

SamvaadAI is a voice-based mock interview app. Choose a role and interview type, optionally upload a PDF résumé, and practise answering questions aloud.

## How a session works

The React, TypeScript and Vite client starts a Vapi browser call. Its assistant configuration selects OpenAI GPT-4 for the interviewer, ElevenLabs for speech synthesis and Deepgram Nova-2 for English transcription. The client displays partial transcripts during the call and submits final speaker-labelled turns to the Express API.

The Node.js backend handles résumé analysis, interview generation and assessment. MongoDB stores interviews and completed responses through Mongoose. Upstash Redis supports authentication tokens. After a call, Gemini 2.5 Flash receives the transcript and evaluates answer relevance, structure, technical reasoning and use of examples where supported. The overall score is the rounded mean of the returned category scores. Scores and comments are subjective practice feedback. Independent agreement with human ratings has yet to be measured.

## Try it without credentials

From `backend`, run `npm test` with Node.js 22.12+ to test the assessment parser and error handling. The tests supply model responses locally.

From `frontend`, run `npm ci`, `npm run build`, then `npm run preview -- --port 4173 --strictPort`. Open `http://localhost:4173/results` directly. With no completed interview, the page shows **Assessment unavailable** without a score. You can also explore the setup form. Starting an interview requires the configured backend below.

## Run a live interview

Use Node.js 22.12+ and npm, a MongoDB connection, an Upstash Redis REST database, a Gemini API key with access to Gemini 2.5 Flash, and a Vapi public key for a project able to run the configured assistant.

```sh
git clone https://github.com/sanchit-pareek/SamvaadAI.git
cd SamvaadAI/backend
npm install
npm run generate-secrets
```

Copy `backend/.env.example` to `backend/.env`. Set `PORT=5000`, `CORS_ORIGIN=http://localhost:5173`, and `MONGODB_URI` (for local MongoDB, `mongodb://127.0.0.1:27017/samvaadai`). Set independent generated values for `JWT_SECRET` and `JWT_REFRESH_SECRET`, and supply `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `GEMINI_API_KEY`. Run `npm run dev` from `backend`.

In a second terminal, enter `frontend`, run `npm ci` and copy `.env.example` to `.env`. Set `VITE_API_URL=http://localhost:5000/api` and `VITE_VAPI_PUBLIC_KEY` to the Vapi public key. Keep private credentials on the server. Run `npm run dev -- --port 5173 --strictPort`, open `http://localhost:5173` and allow microphone access.

If setup shows **Failed to create interview**, first open `http://localhost:5000/` on the preview machine and check the backend terminal for a successful MongoDB connection. An example Upstash URL causes the server to exit during startup. For the production preview on port 4173, set `CORS_ORIGIN=http://localhost:4173` and restart the backend. Rebuild the frontend after changing its Vite environment variables.

## Test a live interview

Finish one voice interview manually and let a second end through Vapi. Check each creates one saved response and that the results match its final transcript. Repeat with an invalid Gemini key after interview generation. Expect an assessment error and captured transcript, without a numerical score or successful response record.

### Small repeatable feedback review

Use the same interviewer prompt for three fixed transcripts: “How would you detect duplicates in an array?” Prefix each answer with `You:`.

| Case | Candidate answer |
| --- | --- |
| Relevant, explained | I would keep a set. For each item I check membership before inserting it. The first repeat proves a duplicate. This takes expected linear time and linear extra space. |
| Relevant, partial | I would sort the array. |
| Off topic | I usually build dashboards in React. |

Before viewing model output, have two reviewers independently mark each answer's relevance and reasoning as absent, partial or supported and quote the evidence. Submit each fixed transcript three times through the same assessment service with the same model, prompt and repository commit. Save the inputs, UTC date, raw returned assessments and failures. Report per-case score ranges, failed attempts out of total attempts, unsupported claims with excerpts, and reviewer disagreements. Report ordering against the independent judgments separately from run-to-run variation. This text-only exercise covers feedback consistency and grounding. Transcription accuracy requires separate audio and independently prepared reference transcripts.
