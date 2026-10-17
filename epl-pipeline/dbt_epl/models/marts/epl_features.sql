/*
    epl_features.sql — Feature Engineering Mart
    ────────────────────────────────────────────
    Builds the final analytics table with engineered features
    optimized for XGBoost / predictive modelling downstream.
*/

with matches as (
    select * from {{ ref('stg_matches') }}
),

features as (
    select
        id,
        season,
        match_date,
        home_team,
        away_team,

        -- ── Raw outcome ──
        ft_home_goals,
        ft_away_goals,
        ft_result,

        -- ── Aggregate features ──
        (ft_home_goals + ft_away_goals)                   as total_goals,
        (home_shots_on_target + away_shots_on_target)     as total_shots_on_target,
        (home_shots + away_shots)                         as total_shots,

        -- Shot accuracy (avoid div-by-zero)
        case
            when (home_shots + away_shots) > 0
            then round(
                (home_shots_on_target + away_shots_on_target)::numeric
                / (home_shots + away_shots), 4
            )
            else 0
        end as shot_accuracy,

        -- Set-piece & discipline totals
        (home_corners + away_corners)             as total_corners,
        (home_fouls + away_fouls)                 as total_fouls,
        (home_yellow_cards + away_yellow_cards)   as total_yellow_cards,
        (home_red_cards + away_red_cards)         as total_red_cards,

        -- ── Differential features ──
        (ft_home_goals - ft_away_goals)                       as goal_difference,
        (home_shots_on_target - away_shots_on_target)         as sot_difference,
        (home_shots - away_shots)                             as shot_difference,
        (home_corners - away_corners)                         as corner_difference,
        (home_fouls - away_fouls)                             as foul_difference,

        -- ── Outcome encoding ──
        case when ft_result = 'H' then 1 else 0 end   as home_win,
        case when ft_result = 'D' then 1 else 0 end   as draw,
        case when ft_result = 'A' then 1 else 0 end   as away_win,

        -- ── Half-time features ──
        (ht_home_goals + ht_away_goals)                    as ht_total_goals,
        ht_result,
        case when ht_result != ft_result then 1 else 0 end as result_changed,

        -- ── Per-team raw stats (useful for per-team modelling) ──
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

        -- ── Metadata ──
        ingested_at,
        source

    from matches
)

select * from features
