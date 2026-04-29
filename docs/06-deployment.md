# 06 Deployment

## Deployment Direction

The project is intended to support a separate deployment target for frontend and backend.

## Planned Hosting Model

- frontend deployed as a static web application
- backend deployed as a Node.js service
- PostgreSQL hosted separately

## Environment Management

- backend environment variables stored outside source control
- database connection provided through `DATABASE_URL`
- frontend environment variables added later when needed

