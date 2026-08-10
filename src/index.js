export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const auth = request.headers.get("Authorization");

    if (auth !== `Bearer ${env.API_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (request.method === "POST" && url.pathname === "/shutdown") {
      await env.DB.prepare(
        "INSERT INTO commands (command, created_at, executed) VALUES (?, ?, 0)"
      )
        .bind("shutdown", Date.now())
        .run();

      return new Response("Shutdown command sent");
    }

    if (request.method === "GET" && url.pathname === "/check") {
      const result = await env.DB.prepare(
        "SELECT id, command FROM commands WHERE executed = 0 ORDER BY id ASC LIMIT 1"
      ).first();

      if (!result) {
        return new Response("NONE");
      }

      await env.DB.prepare(
        "UPDATE commands SET executed = 1 WHERE id = ?"
      )
        .bind(result.id)
        .run();

      return new Response(result.command);
    }

    return new Response("Siri PC Shutdown Server");
  }
};
