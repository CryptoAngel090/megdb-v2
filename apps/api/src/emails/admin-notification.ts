export function getAdminNotificationEmail(user: {
  email: string
  username: string
  createdAt: Date
}) {
  return {
    subject: `🎉 New User Registration: ${user.username}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Registration</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E50914 0%, #c00812 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">
                🎉 New User Registration
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #333333;">
                A new user just joined <strong>MegDB</strong>!
              </p>

              <!-- User Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px; width: 120px;">Username:</td>
                        <td style="color: #E50914; font-weight: 700; font-size: 16px;">${user.username}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px;">Email:</td>
                        <td style="color: #333; font-size: 15px;">${user.email}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 600; color: #666; font-size: 14px;">Registered:</td>
                        <td style="color: #333; font-size: 15px;">${new Date(
                          user.createdAt
                        ).toLocaleString('en-US', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #666; text-align: center;">
                Total users are growing! 🚀
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #999;">
                MegDB Admin Notification System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}
