# mini-ledger

NestJS API with Prisma and PostgreSQL in Docker. The Prisma schema is empty so you can model the domain yourself.

## Start the database

```bash
docker compose up -d postgres
```

## Run the API

```bash
npm install
npm run prisma:generate
npm run start:dev
```

PostgreSQL is published on port `5433`, so it does not collide with a local Postgres already using `5432`.

The API listens on [http://localhost:3000](http://localhost:3000). `GET /health` checks the database connection.

## Add a model

Edit `prisma/schema.prisma`, then create a migration:

```bash
npm run prisma:migrate -- --name init
```

`PrismaService` is global. Inject it into any provider:

```typescript
constructor(private readonly prisma: PrismaService) {}
```

## Run the API in Docker

```bash
docker compose --profile app up --build
```

Inside that container the database host is `postgres`, not `localhost`.
