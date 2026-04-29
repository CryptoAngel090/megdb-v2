interface CommentModerationEmailInput {
  movieTitle: string
  authorName: string
  authorEmail: string
  body: string
  approveUrl: string
  rejectUrl: string
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function getCommentModerationEmail(input: CommentModerationEmailInput) {
  const safeMovieTitle = escapeHtml(input.movieTitle)
  const safeAuthorName = escapeHtml(input.authorName)
  const safeAuthorEmail = escapeHtml(input.authorEmail)
  const safeBody = escapeHtml(input.body)

  return {
    subject: `💬 Comment pending moderation: ${input.movieTitle}`,
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:24px;">
    <div style="max-width:700px; margin:0 auto; background:#fff; border-radius:10px; padding:24px; border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 12px; color:#111827;">New comment pending approval</h2>
      <p style="margin:0 0 16px; color:#374151;">
        <strong>Movie:</strong> ${safeMovieTitle}
      </p>
      <p style="margin:0 0 8px; color:#374151;"><strong>Author:</strong> ${safeAuthorName}</p>
      <p style="margin:0 0 16px; color:#374151;"><strong>Email:</strong> ${safeAuthorEmail}</p>
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; margin-bottom:18px; white-space:pre-wrap; color:#111827;">${safeBody}</div>
      <div>
        <a href="${input.approveUrl}" style="display:inline-block; padding:10px 16px; border-radius:8px; background:#16a34a; color:#fff; text-decoration:none; font-weight:700; margin-right:8px;">Approve</a>
        <a href="${input.rejectUrl}" style="display:inline-block; padding:10px 16px; border-radius:8px; background:#dc2626; color:#fff; text-decoration:none; font-weight:700;">Reject</a>
      </div>
    </div>
  </body>
</html>`,
  }
}
