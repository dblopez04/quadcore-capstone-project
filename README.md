# Mean Green Guide
**Built by Quadcore for UNT's IT Capstone program**


## Building and Running
The only prerequisite you need to run this program is [Docker](https://www.docker.com/ "docker").

To build and run all services at the same time, clone the repository in your terminal, cd into it, and then run
`docker compose up --build`

Once you've built the containers, you can run the containers without rebuilding them by using
`docker compose up`


Then, make a copy of .env.example with the name .env, and put the file in ./backend and ./frontend, and the project's root directory. 

In a testing environment, the example environment file is just fine to use.
If you would like to use different credentials for the Postgres database, all you need to do is modify the .env files, and then run the build container again.

## Environment Variables
| **Name**             | **Description**                                                                    |
|----------------------|------------------------------------------------------------------------------------|
| `POSTGRES_USER`      | Username of the Postgres user in the container.                                    |
| `POSTGRES_PASSWORD`  | Password of the Postgres user in the container.                                    |
| `POSTGRES_DB`        | Name of the database used in Postgres.                                             |
| `DATABASE_URL`       | URL of the Postgres database. Local default: postgres://\<username>:\<password>@localhost:5433/<db_name> |
| `FRONTEND_URL`       | Frontend origin for backend CORS and generated links. Default: http://localhost:5173 |
| `VITE_API_BASE_URL`  | Backend API base URL used by the frontend. Default: http://localhost:4000 |
| `JWT_SECRET`         | Secret key used for JWT (specifically access tokens)                               |
| `JWT_REFRESH_SECRET` | Secret key used for JWT (specifically refresh tokens)                              |

## Dev/Testing URLs
| **Component**       | **URL**                    |
|---------------------|----------------------------|
| Frontend (React)    | http://localhost:5173      |
| Backend (Express)   | http://localhost:4000      |
| API Docs (Swagger)  | http://localhost:4000/docs |
| Database (Postgres) | http://localhost:5433      |

## Dev Workflow with AI Agents
You can use AI agents (Codex, Claude, etc.) to accelerate work. They are best at:
- Scaffolding routes, components, and API stubs.
- Summarizing changes and writing docs/handoffs.
- Drafting tests and API documentation.

### Takeaways from Antigravity usage

Attached [here](example_transcript_antigravity.md) is a transcript of a conversation I had in Antigravity, and I think it could be a useful read for understanding the tools. Here are some of the biggest takeaways:

- Firstly, open your Agent Manager and use Opus 4.5 for planning
- In this stage, you're outlining the architecture and flows for everything that will be implemented
- Coding agents can't come up with sound logic and ideas on it's own, that's your responsibility. All the agent does is write code.
- However, plan mode will steer you in the right direction, which is why I recommend it so much
- If there's something that's not 100% clear to you make sure to talk it out with Opus
- Most of your time and energy should be spent in plan mode. It will make everything much easier for you, trust me
- Once the plan is done, save it to the docs/feature-plan folder and have a Gemini 3 Pro High agent take care of the implementation
- Make sure you're using a new conversation, more messages means more context and that makes the agent perform worse
- Gemini is really not that good at following directions. Keep an eye on how it's thinking (which it does a very weird amount of) and don't hesitate to stop and steer it.
- After Gemini is done, go back to Opus and have it review the code, write tests, and update documentation. Gemini just doesn't wanna do that for some reason
- If Gemini gets something wrong or causes issues, just let Opus take over. Don't bother wasting your tokens on Gemini
- I have literally no idea how to find out your usage/token limits in this, which is why you should probably only use Opus for planning, review, and testing (or any issue Gemini can't figure out)
- Overall, Antigravity isn't that good compared to Claude Code
- Gemini may give you some issues but if you steer it in the right direction it's alright
- However, it's definitely worth using Antigravity with this workflow if you don't wanna pay for Claude Code or Codex

### Resources
- `AGENTS.md` - Rules and doc update expectations
- `docs/README.md` - Documentation index
- `docs/DEPLOYMENT.md` - Proxmox deployment and pull-based auto-update flow
- `docs/feature-plan/` - Implementation plans for new features
