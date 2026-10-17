#!/bin/bash
set -e

echo "══════════════════════════════════════════"
echo "  dbt Transform Service"
echo "══════════════════════════════════════════"

# Wait for raw_matches to have data before running transforms
echo "Waiting for data in raw_matches …"
MAX_RETRIES=30
RETRY=0

until PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -tAc "SELECT 1 FROM raw_matches LIMIT 1" 2>/dev/null | grep -q 1; do

    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
        echo "ERROR: Timed out waiting for data after ${MAX_RETRIES} retries."
        exit 1
    fi
    echo "  No data yet (attempt ${RETRY}/${MAX_RETRIES}), retrying in 5s …"
    sleep 5
done

echo "✓ Data found in raw_matches."
echo ""
echo "Running dbt run …"
dbt run --profiles-dir /dbt --project-dir /dbt
echo ""
echo "Running dbt test …"
dbt test --profiles-dir /dbt --project-dir /dbt
echo ""
echo "✓ dbt run and test completed successfully!"
