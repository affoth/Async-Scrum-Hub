"""
Email utilities for Async Scrum Hub.

Provides a helper to send invitation emails containing the organization
join code.  When SMTP settings are not configured the function logs a
warning and returns silently.  When SMTP is configured but the send
fails, the exception is re-raised so the caller can handle it.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from src.config.settings import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
	"""Return True when all required SMTP settings are present."""
	return all([settings.smtp_host, settings.smtp_user, settings.smtp_password])


def send_invite_email(
	to_email: str,
	to_name: str,
	organization_name: str,
	join_code: str,
) -> None:
	"""Send an invitation email with the organization join code.

	Parameters
	----------
	to_email : str
		Recipient email address.
	to_name : str
		Display name used in the greeting.
	organization_name : str
		Name of the organization the user is being invited to.
	join_code : str
		The join code the recipient can use to join.
	"""

	if not _smtp_configured():
		logger.warning(
			"SMTP is not configured — skipping invite email to %s. "
			"Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD to enable emails.",
			to_email,
		)
		return

	from_email = settings.smtp_from_email or settings.smtp_user

	subject = f"You've been invited to join {organization_name}"

	# ── Plain-text version ────────────────────────────────────────────
	text_body = (
		f"Hi {to_name},\n\n"
		f"You have been invited to join the organization \"{organization_name}\" "
		f"on Async Scrum Hub.\n\n"
		f"Use the following join code to accept the invitation:\n\n"
		f"    {join_code}\n\n"
		f"If you don't have an account yet, sign up first and then use the code above.\n\n"
		f"— The Async Scrum Hub Team"
	)

	# ── HTML version ──────────────────────────────────────────────────
	html_body = f"""\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <h2>You've been invited!</h2>
  <p>Hi {to_name},</p>
  <p>
    You have been invited to join the organization
    <strong>{organization_name}</strong> on Async Scrum Hub.
  </p>
  <p>Use the following join code to accept the invitation:</p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;
            background: #f4f4f4; display: inline-block; padding: 10px 20px;
            border-radius: 6px;">
    {join_code}
  </p>
  <p>
    If you don't have an account yet, sign up first and then use the
    code above.
  </p>
  <br/>
  <p style="color: #888;">— The Async Scrum Hub Team</p>
</body>
</html>
"""

	msg = MIMEMultipart("alternative")
	msg["Subject"] = subject
	msg["From"] = from_email
	msg["To"] = to_email
	msg.attach(MIMEText(text_body, "plain"))
	msg.attach(MIMEText(html_body, "html"))

	try:
		with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
			server.ehlo()
			server.starttls()
			server.ehlo()
			server.login(settings.smtp_user, settings.smtp_password)
			server.sendmail(from_email, [to_email], msg.as_string())
		logger.info("Invite email sent to %s for org '%s'", to_email, organization_name)
	except Exception:
		logger.exception("Failed to send invite email to %s", to_email)
		raise
