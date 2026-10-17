/*
    stg_matches.sql — Staging Model
    ────────────────────────────────
    Cleans raw match data:
      • Trims team names
      • Clamps statistical outliers (e.g. >40 shots is unrealistic)
      • Filters rows missing critical fields
      • Deduplicates by match signature
*/

with source as (
    select * from {{ source('raw', 'raw_matches') }}
),

cleaned as (
    select
        id,
        trim(season)    as season,
        match_date,
        trim(home_team) as home_team,
        trim(away_team) as away_team,

        -- Goals (no clamping needed; range 0-15 is plausible)
        ft_home_goals,
        ft_away_goals,
        upper(trim(ft_result)) as ft_result,

        ht_home_goals,
        ht_away_goals,
        upper(trim(ht_result)) as ht_result,

        -- Clamp shot outliers
        least(greatest(home_shots, 0), 45)           as home_shots,
        least(greatest(away_shots, 0), 45)           as away_shots,
        least(greatest(home_shots_on_target, 0), 30) as home_shots_on_target,
        least(greatest(away_shots_on_target, 0), 30) as away_shots_on_target,

        -- Clamp set-piece / discipline stats
        least(greatest(home_corners, 0), 20)       as home_corners,
        least(greatest(away_corners, 0), 20)       as away_corners,
        least(greatest(home_fouls, 0), 35)         as home_fouls,
        least(greatest(away_fouls, 0), 35)         as away_fouls,
        least(greatest(home_yellow_cards, 0), 11)  as home_yellow_cards,
        least(greatest(away_yellow_cards, 0), 11)  as away_yellow_cards,
        least(greatest(home_red_cards, 0), 5)      as home_red_cards,
        least(greatest(away_red_cards, 0), 5)      as away_red_cards,

        ingested_at,
        source,

        -- Dedup key: one row per (date, home, away) – keep latest ingestion
        row_number() over (
            partition by match_date, trim(home_team), trim(away_team)
            order by ingested_at desc
        ) as _row_num

    from source
    where match_date is not null
      and home_team is not null
      and away_team is not null
      and ft_result in ('H', 'D', 'A')
)

select
    id,
    season,
    match_date,
    home_team,
    away_team,
    ft_home_goals,
    ft_away_goals,
    ft_result,
    ht_home_goals,
    ht_away_goals,
    ht_result,
    home_shots,
    away_shots,
    home_shots_on_target,
    away_shots_on_target,
    home_corners,
    away_corners,
    home_fouls,
    away_fouls,
    home_yellow_cards,
    away_yellow_cards,
    home_red_cards,
    away_red_cards,
    ingested_at,
    source
from cleaned
where _row_num = 1
