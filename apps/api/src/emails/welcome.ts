export function getWelcomeEmail(username: string) {
  return {
    subject: '🎬 Welcome to MegDB — Your Movie Journey Starts Here!',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MegDB</title>
  <style>
    /* ── Reset ── */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }

    /* ── Light mode (default) ── */
    .email-body {
      background: linear-gradient(135deg, #f0f0f0 0%, #e8e0e0 100%);
    }
    .card {
      background: linear-gradient(165deg, #ffffff 0%, #fafafa 100%);
      border: 2px solid rgba(229, 9, 20, 0.25);
      box-shadow: 0 24px 64px rgba(0,0,0,0.12), 0 0 40px rgba(229,9,20,0.08);
    }
    .body-text {
      color: #111111 !important;
    }
    .body-text-muted {
      color: #444444 !important;
    }
    .body-text-faint {
      color: #666666 !important;
    }
    .feature-card {
      background: rgba(229, 9, 20, 0.05);
      border: 1px solid rgba(229, 9, 20, 0.18);
    }
    .footer-bg {
      background: rgba(0,0,0,0.04);
      border-top: 1px solid rgba(229,9,20,0.15);
    }
    .footer-copy {
      color: #888888 !important;
    }
    .footer-rights {
      color: #aaaaaa !important;
    }
    .help-text {
      color: #555555 !important;
    }
    .username-highlight {
      color: #E50914 !important;
    }

    /* ── Dark mode ── */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%) !important;
      }
      .card {
        background: linear-gradient(165deg, rgba(31,31,31,0.97) 0%, rgba(18,18,18,0.99) 100%) !important;
        border: 2px solid rgba(229,9,20,0.3) !important;
        box-shadow: 0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(229,9,20,0.15) !important;
      }
      .body-text {
        color: #ffffff !important;
      }
      .body-text-muted {
        color: rgba(255,255,255,0.85) !important;
      }
      .body-text-faint {
        color: rgba(255,255,255,0.6) !important;
      }
      .feature-card {
        background: rgba(229,9,20,0.08) !important;
        border: 1px solid rgba(229,9,20,0.2) !important;
      }
      .footer-bg {
        background: rgba(0,0,0,0.3) !important;
        border-top: 1px solid rgba(229,9,20,0.2) !important;
      }
      .footer-copy {
        color: rgba(255,255,255,0.5) !important;
      }
      .footer-rights {
        color: rgba(255,255,255,0.35) !important;
      }
      .help-text {
        color: rgba(255,255,255,0.6) !important;
      }
      .username-highlight {
        color: #ff3b47 !important;
      }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="padding:48px 20px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="600" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;border-radius:24px;overflow:hidden;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#E50914 0%,#b0060f 100%);padding:52px 40px 44px;text-align:center;">

              <!-- Film icon (SVG) -->
              <div style="margin-bottom:20px;">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.4));">
                  <rect width="24" height="24" rx="4" fill="rgba(255,255,255,0.15)"/>
                  <path d="M4 8h2v2H4V8zm14 0h2v2h-2V8zM4 14h2v2H4v-2zm14 0h2v2h-2v-2z" fill="white"/>
                  <rect x="2" y="6" width="20" height="12" rx="2" stroke="white" stroke-width="1.5" fill="none"/>
                  <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill="white"/>
                  <line x1="8" y1="6" x2="8" y2="18" stroke="white" stroke-width="1" opacity="0.5"/>
                  <line x1="16" y1="6" x2="16" y2="18" stroke="white" stroke-width="1" opacity="0.5"/>
                </svg>
              </div>

              <h1 style="margin:0;font-size:38px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;text-shadow:0 4px 16px rgba(0,0,0,0.35);line-height:1.1;">
                Welcome to MegDB!
              </h1>
              <p style="margin:14px 0 0;font-size:17px;color:rgba(255,255,255,0.92);font-weight:500;letter-spacing:0.01em;">
                Your cinematic adventure begins now
              </p>

              <!-- Decorative dots row -->
              <div style="margin-top:28px;display:flex;justify-content:center;gap:6px;">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);"></span>
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.7);"></span>
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);"></span>
              </div>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:48px 40px 36px;">

              <!-- Greeting -->
              <p class="body-text" style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.4;">
                Hey, <span class="username-highlight">${username}</span>
                <!-- Wave hand SVG -->
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-left:6px;">
                  <path d="M7.5 4.5C7.5 3.67 8.17 3 9 3s1.5.67 1.5 1.5v6l1.5-1.5V5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5l1.5-1.5V7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V7.5C7.5 6.67 8.17 6 9 6s1.5.67 1.5 1.5" stroke="#E50914" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </p>

              <p class="body-text-muted" style="margin:0 0 28px;font-size:16px;line-height:1.7;">
                Thank you for joining <strong class="body-text">MegDB</strong> — the ultimate destination for movie lovers. We're thrilled to have you as part of our community.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(229,9,20,0.3),transparent);margin-bottom:32px;"></div>

              <!-- Features -->
              <p class="body-text" style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.5;">What you can do</p>

              <!-- Feature 1: Discover -->
              <table width="100%" cellpadding="0" cellspacing="0" class="feature-card" style="border-radius:14px;margin-bottom:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <!-- Search / Discover icon -->
                          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#E50914,#b0060f);display:flex;align-items:center;justify-content:center;">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="44" height="44" rx="12" fill="url(#g1)"/>
                              <defs><linearGradient id="g1" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#E50914"/><stop offset="1" stop-color="#b0060f"/></linearGradient></defs>
                              <circle cx="20" cy="20" r="6" stroke="white" stroke-width="2" fill="none"/>
                              <path d="M25 25l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                          </div>
                        </td>
                        <td style="vertical-align:middle;">
                          <h3 class="body-text" style="margin:0 0 4px;font-size:16px;font-weight:700;">Discover Movies &amp; Shows</h3>
                          <p class="body-text-muted" style="margin:0;font-size:13px;line-height:1.5;">Explore thousands of titles, trailers, and hidden gems</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Feature 2: Rate -->
              <table width="100%" cellpadding="0" cellspacing="0" class="feature-card" style="border-radius:14px;margin-bottom:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <!-- Star icon -->
                          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="44" height="44" rx="12" fill="url(#g2)"/>
                            <defs><linearGradient id="g2" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#E50914"/><stop offset="1" stop-color="#b0060f"/></linearGradient></defs>
                            <path d="M22 14l2.47 5.01L30 19.9l-4 3.9.94 5.5L22 26.77l-4.94 2.53.94-5.5-4-3.9 5.53-.89L22 14z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <h3 class="body-text" style="margin:0 0 4px;font-size:16px;font-weight:700;">Rate &amp; Review</h3>
                          <p class="body-text-muted" style="margin:0;font-size:13px;line-height:1.5;">Share your take and help others find great content</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Feature 3: Watchlist -->
              <table width="100%" cellpadding="0" cellspacing="0" class="feature-card" style="border-radius:14px;margin-bottom:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <!-- Bookmark icon -->
                          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="44" height="44" rx="12" fill="url(#g3)"/>
                            <defs><linearGradient id="g3" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#E50914"/><stop offset="1" stop-color="#b0060f"/></linearGradient></defs>
                            <path d="M16 14h12a1 1 0 011 1v15l-7-4-7 4V15a1 1 0 011-1z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <h3 class="body-text" style="margin:0 0 4px;font-size:16px;font-weight:700;">Build Your Watchlist</h3>
                          <p class="body-text-muted" style="margin:0;font-size:13px;line-height:1.5;">Never lose track of what you want to watch next</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Feature 4: Community -->
              <table width="100%" cellpadding="0" cellspacing="0" class="feature-card" style="border-radius:14px;margin-bottom:0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <!-- People / community icon -->
                          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="44" height="44" rx="12" fill="url(#g4)"/>
                            <defs><linearGradient id="g4" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#E50914"/><stop offset="1" stop-color="#b0060f"/></linearGradient></defs>
                            <circle cx="19" cy="18" r="3" stroke="white" stroke-width="1.8" fill="none"/>
                            <path d="M13 29c0-3.31 2.69-6 6-6" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                            <circle cx="27" cy="17" r="2.5" stroke="white" stroke-width="1.6" fill="none"/>
                            <path d="M27 23c2.76 0 5 2.24 5 5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <h3 class="body-text" style="margin:0 0 4px;font-size:16px;font-weight:700;">Join the Community</h3>
                          <p class="body-text-muted" style="margin:0;font-size:13px;line-height:1.5;">Connect with fellow cinephiles and share your passion</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:40px 0 28px;">
                <tr>
                  <td align="center">
                    <a href="https://megdb.app" style="display:inline-block;padding:18px 52px;background:linear-gradient(135deg,#E50914 0%,#b0060f 100%);color:#ffffff;text-decoration:none;font-size:17px;font-weight:800;border-radius:14px;letter-spacing:0.01em;box-shadow:0 8px 32px rgba(229,9,20,0.45),0 0 0 1px rgba(229,9,20,0.3);">
                      Start Exploring
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-left:8px;">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Help line -->
              <p class="help-text" style="margin:0;font-size:13px;line-height:1.6;text-align:center;">
                Need help? Reply to this email or visit our
                <a href="https://megdb.app/help" style="color:#E50914;text-decoration:none;font-weight:600;">Help Center</a>
              </p>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td class="footer-bg" style="padding:28px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <p style="margin:0 0 6px;font-size:22px;font-weight:900;color:#E50914;letter-spacing:-0.03em;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:4px;">
                        <polygon points="5,3 19,12 5,21" fill="#E50914"/>
                      </svg>MegDB
                    </p>
                    <p class="footer-copy" style="margin:0 0 10px;font-size:13px;">Your ultimate movie database</p>

                    <!-- Social icons row -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                      <tr>
                        <!-- X / Twitter -->
                        <td style="padding:0 6px;">
                          <a href="https://x.com/megdb" style="display:inline-block;width:32px;height:32px;border-radius:8px;background:rgba(229,9,20,0.12);text-align:center;line-height:32px;text-decoration:none;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                              <path d="M4 4l16 16M4 20L20 4" stroke="#E50914" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                          </a>
                        </td>
                        <!-- Instagram -->
                        <td style="padding:0 6px;">
                          <a href="https://instagram.com/megdb" style="display:inline-block;width:32px;height:32px;border-radius:8px;background:rgba(229,9,20,0.12);text-align:center;line-height:32px;text-decoration:none;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                              <rect x="3" y="3" width="18" height="18" rx="5" stroke="#E50914" stroke-width="1.8" fill="none"/>
                              <circle cx="12" cy="12" r="4" stroke="#E50914" stroke-width="1.8" fill="none"/>
                              <circle cx="17.5" cy="6.5" r="1" fill="#E50914"/>
                            </svg>
                          </a>
                        </td>
                        <!-- Discord -->
                        <td style="padding:0 6px;">
                          <a href="https://discord.gg/megdb" style="display:inline-block;width:32px;height:32px;border-radius:8px;background:rgba(229,9,20,0.12);text-align:center;line-height:32px;text-decoration:none;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                              <path d="M9 12a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" fill="#E50914"/>
                              <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0 11.12 11.12 0 00-.54-1.09.07.07 0 00-.07-.03c-1.5.26-2.93.71-4.27 1.33a.07.07 0 00-.02.03C2.18 9.03 1.45 12.6 1.8 16.12a.08.08 0 00.03.05 20.03 20.03 0 006.04 3.05.07.07 0 00.08-.03c.46-.63.87-1.3 1.22-2a.07.07 0 00-.04-.1 13.2 13.2 0 01-1.87-.9.07.07 0 010-.12l.37-.29a.07.07 0 01.07-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 01.07.01l.37.29a.07.07 0 010 .12 12.3 12.3 0 01-1.87.9.07.07 0 00-.04.1c.36.7.77 1.37 1.22 2a.07.07 0 00.08.03 19.96 19.96 0 006.05-3.05.08.08 0 00.03-.05c.44-4.53-.73-8.06-3.1-11.39a.06.06 0 00-.01-.03z" fill="#E50914"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p class="footer-rights" style="margin:0;font-size:11px;">
                      © 2026 MegDB. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Main Card -->

      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}
