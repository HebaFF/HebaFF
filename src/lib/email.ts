// Minimal pluggable email sender. With RESEND_API_KEY set, sends via Resend's
// HTTP API (no SDK dependency needed for one call type). Without it — e.g.
// local dev — logs the email to the server console instead of failing, so
// the password-reset flow is fully testable without a real provider.
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "GlucoDose <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email: ${res.status} ${body}`);
  }
}

export function passwordResetEmail(resetUrl: string) {
  const text = `Reset your GlucoDose password by visiting this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  const html = `<p>Reset your GlucoDose password by clicking the link below (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`;
  return { subject: "Reset your GlucoDose password", html, text };
}
