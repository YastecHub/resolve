#!/bin/sh
set -e
# Apply pending migrations before the API starts. Safe to run on every start:
# `migrate deploy` only applies migrations the database hasn't seen.
node_modules/.bin/prisma migrate deploy
exec "$@"
