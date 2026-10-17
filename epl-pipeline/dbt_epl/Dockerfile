FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir dbt-postgres==1.9.0

WORKDIR /dbt
COPY . .
RUN chmod +x /dbt/entrypoint.sh

ENTRYPOINT ["/dbt/entrypoint.sh"]
