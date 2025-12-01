# Getting Around UNT 
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
| **Name**             | **Description**                                                                  |
|----------------------|----------------------------------------------------------------------------------|
| `POSTGRES_USER`      | Username of the Postgres user in the container.                                  |
| `POSTGRES_PASSWORD`  | Password of the Postgres user in the container.                                  |
| `POSTGRES_DB`        | Name of the database used in Postgres.                                           |
| `DATABASE_URL`       | URL of the Postgres database. postgres://\<username>:\<password>@db:5433/<db_name> |
| `JWT_SECRET`         | Secret key used for JWT (specifically access tokens)                             |
| `JWT_REFRESH_SECRET` | Secret key used for JWT (specifically refresh tokens)                            |

## Dev/Testing URLs
| **Component**       | **URL**                    |
|---------------------|----------------------------|
| Frontend (React)    | http://localhost:5173      |
| Backend (Express)   | http://localhost:4000      |
| API Docs (Swagger)  | http://localhost:4000/docs |
| Database (Postgres) | http://localhost:5433      |
