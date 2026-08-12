import { drizzle } from "drizzle-orm/sqlite-proxy";
import { env } from "$env/dynamic/private";

const getEnv = (key: string) => {
  return env[key];
};

const accountId = getEnv("CLOUDFLARE_ACCOUNT_ID");
const databaseId = getEnv("CLOUDFLARE_DATABASE_ID");
const token = getEnv("CLOUDFLARE_D1_TOKEN");

interface D1Response {
  success: boolean;
  result: { results: string[] }[];
  errors: { message: string }[];
}

export const db = drizzle(async (sql, params) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  const data = (await res.json()) as D1Response;

  if (!data.success) {
    throw new Error(
      `D1 Query failed: ${data.errors?.[0]?.message || "Unknown error"}`,
    );
  }

  const result = data.result[0];
  return { rows: result ? result.results : [] };
});
