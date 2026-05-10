import nodemailer from "nodemailer"
import { getSiteSettings } from "./db/queries"

/**
 * Send an email using SMTP settings from the database (or environment variables as fallback)
 */
export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) {
  try {
    const settings = await getSiteSettings()
    const smtp = settings.email

    // Priority: Database settings > Environment variables
    const host = smtp?.smtpHost || process.env.SMTP_HOST
    const port = smtp?.smtpPort || Number(process.env.SMTP_PORT) || 465
    const user = smtp?.smtpUser || process.env.SMTP_USER
    const pass = smtp?.smtpPassword || process.env.SMTP_PASSWORD

    if (!host || !user || !pass) {
      console.error("Mail settings are not fully configured", { host, user, hasPass: !!pass })
      return { success: false, error: "Mail settings not configured" }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || port === 2465, // Use SSL for port 465/2465
      auth: {
        user,
        pass,
      },
    })

    const info = await transporter.sendMail({
      from: `"${settings.siteName}" <${user}>`, // Usually Resend requires the 'from' to be a verified domain or the user itself
      to,
      subject,
      text,
      html,
    })

    console.log("Message sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("Error sending email:", error)
    return { success: false, error: error.message }
  }
}
