# reminders/utils.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_reminder_email(user_email, reminder_title, reminder_date, reminder_notes):
    subject = f"🔔 RemindIt: {reminder_title}"  # Email subject
    html_message = render_to_string('reminders/reminder_email.html', {
        'title': reminder_title,
        'date': reminder_date,
        'notes': reminder_notes,
    })
    plain_message = strip_tags(html_message)  # Fallback for non-HTML emails
    
    send_mail(
        subject,
        plain_message,
        'remindit@example.com',  # Sender email (can be anything)
        [user_email],  # Recipient (user's email)
        html_message=html_message,  # HTML version
        fail_silently=False,  # Raise errors if email fails
    )