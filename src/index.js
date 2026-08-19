export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Authentication
    const auth = request.headers.get("Authorization");

    if (auth !== `Bearer ${env.API_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Only allow POST for commands
    if (request.method === "POST") {

      let command = null;

      switch (url.pathname) {

        case "/shutdown":
          command = "shutdown";
          break;

        case "/next":
          command = "next";
          break;

        case "/previous":
          command = "previous";
          break;

        case "/playpause":
          command = "playpause";
          break;

        default:
          return new Response("Unknown command", { status: 404 });
      }

      await env.DB.prepare(
        "INSERT INTO commands (command, created_at, executed) VALUES (?, ?, 0)"
      )
        .bind(command, Date.now())
        .run();

      return new Response(`${command} command sent`);
    }

    // PC polls this endpoint
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

    return new Response("Siri PC Remote Server");
  }
};
