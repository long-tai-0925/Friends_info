function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function withCors(res: Response) {
  const headers = new Headers(res.headers);
  const cors = corsHeaders();

  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    let response: Response;

    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
  		return new Response(null, {
    	headers: corsHeaders(),
  		});
	  }

      // 👉 users
      else if (url.pathname === "/users") {
        const result = await env.DB.prepare("SELECT * FROM users").all();
        response = Response.json(result);
      }

      // 👉 send magic link
      else if (url.pathname === "/auth/send-magic-link" && request.method === "POST") {
        const body = await request.json();
        const email = body.email;

        if (!email) {
          response = Response.json({ error: "Email required" }, { status: 400 });
        } else {
          let user = await env.DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          ).bind(email).first();

          if (!user) {
            const id = crypto.randomUUID();

            await env.DB.prepare(
              "INSERT INTO users (id, email) VALUES (?, ?)"
            ).bind(id, email).run();

            user = { id, email };
          }

          const token = crypto.randomUUID();

          await env.TOKENS.put(token, user.id, {
            expirationTtl: 60 * 15,
          });

          // 🔥 改成前端 URL（很重要）
          const loginLink = `http://localhost:3000?token=${token}`;

          // 👉 發送 email
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to: email,
              subject: "Your Magic Link",
              html: `<p>Click to login:</p><a href="${loginLink}">${loginLink}</a>`,
            }),
          });

          const emailData = await emailRes.json();
          console.log("📧 resend response:", emailData);

          response = Response.json({
            message: "Email sent",
          });
        }
      }

      // 👉 verify
      else if (url.pathname === "/auth/verify") {
        const token = url.searchParams.get("token");

        if (!token) {
          response = new Response("Invalid token", { status: 400 });
        } else {
          const userId = await env.TOKENS.get(token);

          if (!userId) {
            response = new Response("Token expired", { status: 401 });
          } else {
            response = Response.json({
              message: "Login success",
              userId,
            });
          }
        }
      }

      // 👉 invite
      else if (url.pathname === "/friendships/invite" && request.method === "POST") {
        const body = await request.json();
        const { requester_id, receiver_email } = body;

        if (!requester_id || !receiver_email) {
          response = Response.json({ error: "Missing fields" }, { status: 400 });
        } else {
          const receiver = await env.DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          ).bind(receiver_email).first();

          if (!receiver) {
            response = Response.json({ error: "User not found" }, { status: 404 });
          } else {
            await env.DB.prepare(
              `INSERT INTO friendships (id, requester_id, receiver_id, type, status)
               VALUES (?, ?, ?, 'INVITE', 'PENDING')`
            ).bind(crypto.randomUUID(), requester_id, receiver.id).run();

            response = Response.json({ message: "Invite sent" });
          }
        }
      }

      // 👉 accept
      else if (url.pathname === "/friendships/accept" && request.method === "POST") {
        const body = await request.json();
        const { friendship_id } = body;

        if (!friendship_id) {
          response = Response.json({ error: "friendship_id required" }, { status: 400 });
        } else {
          await env.DB.prepare(
            `UPDATE friendships SET status = 'ACCEPTED' WHERE id = ?`
          ).bind(friendship_id).run();

          response = Response.json({ message: "Accepted" });
        }
      }

      // 👉 friendships
      else if (url.pathname === "/friendships") {
        const result = await env.DB.prepare("SELECT * FROM friendships").all();
        response = Response.json(result);
      }

      // 👉 friends
      else if (url.pathname.startsWith("/friends/")) {
        const userId = url.pathname.split("/")[2];

        const result = await env.DB.prepare(`
          SELECT u.id, u.email, u.name
          FROM friendships f
          JOIN users u 
          ON (
            (f.requester_id = ? AND u.id = f.receiver_id)
            OR
            (f.receiver_id = ? AND u.id = f.requester_id)
          )
          WHERE f.status = 'ACCEPTED'
        `).bind(userId, userId).all();

        response = Response.json(result);
      }

      // 👉 public
      else if (url.pathname.startsWith("/public/users/")) {
        const userId = url.pathname.split("/")[3];

        const user = await env.DB.prepare(
          "SELECT id, email, name FROM users WHERE id = ?"
        ).bind(userId).first();

        const friends = await env.DB.prepare(`
          SELECT u.id, u.email, u.name
          FROM friendships f
          JOIN users u 
          ON (
            (f.requester_id = ? AND u.id = f.receiver_id)
            OR
            (f.receiver_id = ? AND u.id = f.requester_id)
          )
          WHERE f.status = 'ACCEPTED'
        `).bind(userId, userId).all();

        response = Response.json({
          user,
          friends: friends.results,
        });
      }

      else {
        response = new Response("Not Found", { status: 404 });
      }

    } catch (err: any) {
      console.error("🔥 ERROR:", err);
      response = Response.json(
        { error: err.message || "Internal error" },
        { status: 500 }
      );
    }

    // 🔥 最終統一 CORS（100% 不會漏）
    return withCors(response);
  },
};