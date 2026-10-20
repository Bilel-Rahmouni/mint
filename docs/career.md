# Career — handoff for another AI

This is what exists today. Discuss the product and the operating rules. Do not invent metrics, applications, or posts that are not in the files named here.

Person: Bilel Rahmouni. Based in Aarhus, Denmark. Hunt is the job search. Renklar.dk is a cleaning business that pays the bills and is not part of the tech CV.

Two repos work together:

- `career-ops-main` — the source of truth for the hunt, the board, the CV, and the command skills.
- `mint` — the admin dashboard at `/admin/career`. It reads the board and can start Cursor agents against the career-ops folder.

## What the Career page shows

Route: `/admin/career` in the mint admin (`frontweb`). Auth required.

Top to bottom:

1. Title “Career” and the board date (`asOf` from the board).
2. A command bar. Nothing underneath until a command is clicked. Clicking the active command closes its card. Clicking a name does not start a run.
3. Stat cards, from the board, not live-computed in the browser:
   - Jobs scored (count of `career.applications`)
   - Good enough (score 4.0 or more)
   - Waiting on you (length of `career.liveQueue`)
   - Notes left, plus invites this week out of the weekly cap

## Commands

Order in the bar: **CV**, **hunt**, **network**, **score**, **weekly hunt**.

CV opens `career-ops-main/cv.md`. Mint reads that file. It does not keep a second copy.

Renklar and weekly renklar are not on this bar. The Renklar loop still exists in career-ops if he types it in Cursor.

`hunt`, `weekly hunt`, `renklar`, and `weekly renklar` come from `career-ops-main/board/js/data.js` (`window.DASH.commands`).

`network` is inserted by the mint backend (`backend/src/services/careerOps.js`) right after hunt. It is not in `data.js`.

`score` is inserted by the mint UI (`CareerCommands.tsx`) right after network. It is not in `data.js` and it is not a Cursor “say this word” command.

### hunt

Say: `hunt`. Also: `run the loop`, `daily hunt`, `/hunt`.

Full hunt for the past 24 hours. Type this in Cursor, or press Run on the card.

The card also lists **To apply**: `career.liveQueue` (company, role, city, apply URL, note).

Loop the agent is supposed to follow (skill: `career-ops-main/.cursor/skills/hunt-loop/SKILL.md`):

- Gulf boards first, then Denmark, then the rest of Europe / Canada / US (sponsor only).
- Save up to 8 keepers. Gulf slots first.
- LinkedIn: Open to work, and one product post if none went live today. The post is about a product (Wyngo, LingoMate, or Renklar), not “I am looking for a job.”
- Recruiter connects only if under 15 invites this week.
- Update the board in the same turn.
- Do not submit an application unless Bilel said to apply.

### network

Not a phrase you type in Cursor. Run on this card calls `POST /api/career/connects`.

A local Cursor agent reads the outreach log and the board, then returns up to 8 people as JSON: name, city, why, href, note. It does not send invites or messages.

The card lists those people. Each note can be copied. The invite is sent by Bilel.

Priority: Gulf technical recruiters, then Denmark, then the rest. Skip people already in `data/recruiter-outreach.md`. Skip UAE, company pages, CEOs, SEO, students. If no LinkedIn notes are left this month, the note field stays empty. A note is at most 200 characters and should sound like a phone text.

### score

Not a Cursor slash command. The card is a paste box.

Paste a job (text or URL, max 20,000 characters). The backend starts a Cursor agent in the career-ops folder. The agent reads `cv.md`, `modes/_custom.md`, and `modes/_profile.md`, and replies with only JSON: company, role, url, score (0–5, one decimal), verdict (`apply` or `skip`), reason.

Verdict is `apply` only when the score is 4.0 or higher and the house rules say apply. Otherwise `skip`. Nothing is sent to an employer.

Jobs are stored in `mint/backend/data/career-jobs.json` (last 30). The latest score stays on the card. Older ones sit under “Earlier.”

### weekly hunt

Same hunt, but the past week, plus leftover keepers, follow-ups, and one comment on a real Gulf or Denmark hiring post.

### CV

First item on the bar. Shows `cv.md` from career-ops. Score and hunt still read that same file.

## How a Run works

`POST /api/career/run` with `{ "id": "<command id>" }`.

Mint looks up that id in the board commands (including the injected `network` id, which is the wrong path for network — network uses `/connects`). It starts one `@cursor/sdk` agent:

- model `composer-2.5`
- `local.cwd` = the career-ops directory
- `settingSources: ['all']` so project skills and rules load
- the prompt is the command’s `say` string (`hunt`, `weekly hunt`, `renklar`, `weekly renklar`)

Only one run at a time. Status is polled every 2 seconds. Text streams into `mint/backend/data/career-run.json`. When it finishes, the page reloads the board.

Needs `CURSOR_API_KEY` in `mint/backend/.env`. The key is created in Cursor → Settings → Integrations. It is not stored in the repo.

Score and network use their own agent calls. They do not go through `/run`.

## API (all behind admin auth)

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/career` | Board snapshot: date, KPIs, live queue, recruiter list, commands |
| GET | `/api/career/run` | Last or current command run |
| POST | `/api/career/run` | Start hunt / weekly hunt / renklar / weekly renklar |
| GET | `/api/career/jobs` | Scored jobs |
| POST | `/api/career/jobs` | Paste a job and score it |
| GET | `/api/career/connects` | Last people list |
| POST | `/api/career/connects` | Find people to connect with |

## Files that matter

Career-ops (do not invent facts outside these):

- `cv.md` — canonical CV
- `modes/_profile.md`, `modes/_custom.md` — targeting and house rules
- `voice-dna.md` — how text should sound
- `article-digest.md` — proof points
- `board/js/data.js` — the board the dashboard reads (`window.DASH`)
- `data/pipeline.md` — keeper URLs
- `data/recruiter-outreach.md` — invites and notes left
- `data/linkedin-activity.md` — posts
- `data/renklar-activity.md` — Renklar log
- `data/applications.md` — application tracker inside career-ops (separate from the board list the dashboard counts)

Mint:

- `frontweb/src/admin/pages/CareerPage.tsx` — page
- `frontweb/src/admin/components/CareerCommands.tsx` — command bar and which card is open
- `frontweb/src/admin/components/CareerCommand.tsx` — the open card
- `frontweb/src/admin/components/CareerInbox.tsx` — score paste box
- `frontweb/src/admin/components/CareerConnects.tsx` — people list
- `frontweb/src/admin/components/CareerQueue.tsx` — to-apply list
- `frontweb/src/admin/components/CareerResult.tsx` — run output
- `backend/src/routes/career.js`
- `backend/src/services/careerOps.js`, `careerRun.js`, `careerJobs.js`, `careerConnects.js`
- `backend/data/career-run.json`, `career-jobs.json`, `career-connects.json`

`CAREER_OPS_DIR` in the mint backend env points at the career-ops folder. Default is the sibling repo `career-ops-main`.

## Rules that are already decided

- Market order: Gulf (Riyadh, Doha, then Kuwait / Bahrain / Oman), then Denmark, then the rest. Skip UAE. Do not write “not UAE” or “relocating.”
- Roles: software IC and sales / customer success. Skip nationals-only, senior Java / .NET, hardware, unpaid, US-auth-required.
- Apply only at 4.0 or higher, and only if Bilel said to apply. The dashboard never clicks Apply.
- Cap 8 new keeper URLs a day.
- Recruiter invites: 15 a week. Notes are a monthly cap tracked in the outreach file. No phone number in the first note.
- LinkedIn posts that go out are product posts. No “open to work” in the post text. No MintBot, OneCrew, Pixy, or family.
- Renklar Facebook is Danish and cleaning-only. Do not raise the Google Ads budget.
- Voice: short sentences, like a text. No slogans.
- Keywords get rephrased from the CV. They do not get invented.

## Board shape the dashboard uses

From `window.DASH` in `board/js/data.js`:

- `asOf`
- `career.applications[]` — status + numeric score. This is what “Jobs scored” and “Good enough” count.
- `career.liveQueue[]` — `{ company, role, city, apply, note }`
- `career.notesLeft`, `career.invitesThisWeek`, `career.inviteCap`
- `career.recruiters`, `career.nextRecruiters`
- `career.daily[]`, `career.weekly[]`
- `commands[]` — `{ id, say, also, what, loop }`

The plan, profile, and indigenous sections of the same file are the wider board. The Career page does not render them.

## What is rough

- Hunt-style runs depend on Cursor skills loading because `settingSources` is `all`. If the key is missing, or `@cursor/sdk` / its peer `zod` is not installed, the run fails in the card.
- `network` is a mint-only command. Saying “network” inside career-ops does not run this people search.
- `score` lives only in the dashboard. It does not write into `career.applications` or the career-ops tracker. The stat “Jobs scored” is the board list, not the paste-box history.
- A server restart marks an in-flight run or people search as stopped.
- One command run at a time. Score can still be used while that is true, because it is a different call.
