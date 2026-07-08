import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type IndRow = {
  rank: number;
  id: string;
  full_name: string | null;
  country: string | null;
  points: number;
};
export type CountryRow = {
  rank: number;
  country: string;
  total_points: number;
  participants: number;
};

export const getLeaderboards = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [ind, ctry] = await Promise.all([
    supabaseAdmin.rpc("individual_leaderboard", { _limit: 50, _offset: 0 }),
    supabaseAdmin.rpc("country_leaderboard"),
  ]);

  // Enrich individual rows with full_name (the RPC only returns id/school/country/points/rank).
  const rows = (ind.data ?? []) as Array<{
    rank: number; id: string; country: string | null; points: number; school: string | null;
  }>;
  let individual: IndRow[] = rows.map((r) => ({
    rank: r.rank, id: r.id, full_name: null, country: r.country, points: r.points,
  }));
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const { data: profs } = await supabaseAdmin
      .from("profiles").select("id, full_name").in("id", ids);
    const nameById = new Map((profs ?? []).map((p) => [p.id, p.full_name as string | null]));
    individual = individual.map((r) => ({ ...r, full_name: nameById.get(r.id) ?? null }));
  }

  return {
    individual,
    countries: ((ctry.data ?? []) as CountryRow[]),
  };
});

const UserRankInput = z.object({ userId: z.string().uuid() });

export const getUserRank = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UserRankInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rank } = await supabaseAdmin.rpc("user_rank", { _user_id: data.userId });
    return { rank: typeof rank === "number" ? rank : null };
  });
