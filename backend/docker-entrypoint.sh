#!/bin/sh
set -e

# Run database seed on first boot (idempotent)
if [ ! -f /app/data/.seeded ]; then
    echo "Running database seed..."
    python scripts/seed_demo.py && touch /app/data/.seeded
    echo "Seed complete."
fi

exec "$@"
