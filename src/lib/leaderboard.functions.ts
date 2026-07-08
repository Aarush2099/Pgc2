import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getLeaderboards = createServerFn({ method: "GET" }).handler(async () => {
  const admin = adminClient();
  const [ind, ctry] = await Promise.all([
    admin.rpc("individual_leaderboard", { _limit: 50, _offset: 0 }),
    admin.rpc("country_leaderboard"),
  ]);

  const rows = (ind.data ?? []) as Array<{
    rank: number; id: string; country: string | null; points: number; school: string | null;
  }>;
  let individual: IndRow[] = rows.map((r) => ({
    rank: r.rank, id: r.id, full_name: null, country: r.country, points: r.points,
  }));
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const { data: profs } = await admin
      .from("profiles").select("id, full_name").in("id", ids);
    const nameById = new Map<string, string | null>(
      (profs ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]),
    );
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
    const admin = adminClient();
    const { data: rank } = await admin.rpc("user_rank", { _user_id: data.userId });
    return { rank: typeof rank === "number" ? rank : null };
  });
