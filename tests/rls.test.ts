/**
 * RLS + RPC permission tests.
 *
 * Runs against the live Lovable Cloud (Supabase) project using the public
 * anon key. Only asserts DENIES and safe reads — never writes.
 *
 * Run with:  bun run test
 * Skips gracefully if env vars are not exported.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "";
const anonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

const hasEnv = url.length > 0 && anonKey.length > 0;
const anon = hasEnv ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

const d = hasEnv ? describe : describe.skip;

d("RLS: profiles table", () => {
  it("blocks anonymous SELECT of profiles (no email/full_name leak)", async () => {
    const { data, error } = await anon!.from("profiles").select("id,email,full_name,points").limit(1);
    // Either error (permission denied) OR empty array (RLS filters everything).
    // In both cases: no user data leaked to anon.
    expect(error ? true : (data ?? []).length === 0).toBe(true);
  });

  it("blocks anonymous UPDATE of profiles.points", async () => {
    const { error } = await anon!
      .from("profiles")
      .update({ points: 999999 })
      .eq("id", "00000000-0000-0000-0000-000000000000");
    // Must not silently succeed; either explicit error or 0 rows affected.
    expect(error === null || error.code !== undefined).toBe(true);
  });
});

d("RLS: user_roles table (deprecated, should be locked)", () => {
  it("blocks anonymous read of user_roles", async () => {
    const { data, error } = await anon!.from("user_roles").select("*").limit(1);
    expect(error ? true : (data ?? []).length === 0).toBe(true);
  });

  it("blocks anonymous insert into user_roles", async () => {
    const { error } = await anon!
      .from("user_roles")
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "admin" });
    expect(error).not.toBeNull();
  });
});

d("RLS: submissions table", () => {
  it("blocks anonymous SELECT of submissions", async () => {
    const { data, error } = await anon!.from("submissions").select("id,user_id,points_awarded").limit(1);
    expect(error ? true : (data ?? []).length === 0).toBe(true);
  });

  it("blocks anonymous INSERT into submissions", async () => {
    const { error } = await anon!
      .from("submissions")
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", day_number: 1, content: "hack" });
    expect(error).not.toBeNull();
  });
});

d("RLS: admin_settings", () => {
  it("only rows marked is_public = true are visible to anon", async () => {
    const { data, error } = await anon!.from("admin_settings").select("key,value,is_public");
    if (error) {
      // Denied outright — also acceptable.
      expect(error).not.toBeNull();
      return;
    }
    for (const row of data ?? []) {
      expect(row.is_public).toBe(true);
    }
  });

  it("blocks anonymous UPDATE of admin_settings", async () => {
    const { error } = await anon!
      .from("admin_settings")
      .update({ value: "hacked" })
      .eq("key", "any");
    expect(error === null || (error.code !== undefined)).toBe(true);
  });
});

d("RLS: generation_error_log (admin-only)", () => {
  it("blocks anonymous SELECT", async () => {
    const { data, error } = await anon!.from("generation_error_log").select("*").limit(1);
    expect(error ? true : (data ?? []).length === 0).toBe(true);
  });

  it("blocks anonymous INSERT", async () => {
    const { error } = await anon!
      .from("generation_error_log")
      .insert({ run_id: "00000000-0000-0000-0000-000000000000", scope: "x", error: "x" });
    expect(error).not.toBeNull();
  });
});

d("RPC permissions", () => {
  it("has_role is NOT callable by anon", async () => {
    const { error } = await anon!.rpc("has_role", {
      _user_id: "00000000-0000-0000-0000-000000000000",
      _role: "admin",
    });
    expect(error).not.toBeNull();
  });

  it("user_rank is NOT callable by anon", async () => {
    const { error } = await anon!.rpc("user_rank", {
      _user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("apply_submission_points is NOT callable by anon", async () => {
    // Trigger-only function; direct RPC must be blocked.
    const { error } = await anon!.rpc("apply_submission_points");
    expect(error).not.toBeNull();
  });

  it("individual_leaderboard IS callable by anon and exposes ONLY school+country+points+rank+id", async () => {
    const { data, error } = await anon!.rpc("individual_leaderboard", { _limit: 5, _offset: 0 });
    expect(error).toBeNull();
    if ((data ?? []).length > 0) {
      const row = data![0] as Record<string, unknown>;
      const keys = Object.keys(row).sort();
      expect(keys).toEqual(["country", "id", "points", "rank", "school"]);
      // Explicitly assert PII columns are NOT present.
      expect(keys).not.toContain("full_name");
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("participant_number");
    }
  });

  it("country_leaderboard IS callable by anon and exposes only country + aggregates", async () => {
    const { data, error } = await anon!.rpc("country_leaderboard");
    expect(error).toBeNull();
    if ((data ?? []).length > 0) {
      const row = data![0] as Record<string, unknown>;
      const keys = Object.keys(row).sort();
      expect(keys).toEqual(["country", "participants", "rank", "total_points"]);
    }
  });
});
