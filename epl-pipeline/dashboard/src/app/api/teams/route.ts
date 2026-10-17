import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teamsRes = await pool.query(
      `SELECT DISTINCT home_team FROM raw_matches WHERE home_team IS NOT NULL ORDER BY home_team ASC`
    );
    const seasonsRes = await pool.query(
      `SELECT DISTINCT season FROM raw_matches WHERE season IS NOT NULL ORDER BY season DESC`
    );

    const teams = teamsRes.rows.map((r: { home_team: string }) => r.home_team);
    const seasons = seasonsRes.rows.map((r: { season: string }) => r.season);

    return NextResponse.json({ teams, seasons });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: [], seasons: [] },
      { status: 500 }
    );
  }
}
