export const GET = async ({ url }) => {
  const host = url.origin;
  const sitemapUrl = `${host}/sitemap.xml`;

  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${sitemapUrl}`].join(
    "\n",
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      // Cache for 604800 seconds (1 week)
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
};
