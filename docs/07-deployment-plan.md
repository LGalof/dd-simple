### Local Development

The project uses Docker for running PostgreSQL locally.

Steps:
1. Start database:
   docker compose -f infra/docker-compose.yml up -d
2. Run migrations:
   npm run prisma:migrate --workspace @dd-simple/api
3. Start backend:
   npm run dev:api