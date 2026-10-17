# ⚡ EPL Data Pipeline & Full-Stack Dashboard

This subfolder contains the containerized microservices for the Premier League Data Engineering and Analytics platform:

* **`db/`**: PostgreSQL 16 schema initialization (`raw_matches` table, indices for match dates, teams, and ingestion times).
* **`ingestion/`**: Python 3.11 service utilizing `psycopg2` and `APScheduler` to seed historical match records and stream simulated live matches every 60 seconds.
* **`dbt_epl/`**: dbt Core project transforming raw ingestion tables into standardized staging views (`stg_matches`) and feature analytics marts (`epl_features`).
* **`dashboard/`**: Next.js 14 web application featuring data quality monitoring, head-to-head analysis, empirical findings, and Poisson xG match simulation.

For full research results, machine learning outputs, and comprehensive documentation, see the root [README.md](../README.md).

---

## 🚀 Quick Start

From this directory:

```bash
docker compose up -d --build
```

Access the dashboard at [http://localhost:3000](http://localhost:3000).
