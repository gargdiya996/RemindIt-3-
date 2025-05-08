from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    EVENT_TYPES = (
        ('task', 'Task'),
        ('reminder', 'Reminder'),
        ('note', 'Note'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES, default='task')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', blank=True, null=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    def __str__(self):
        return self.title

class UserSettings(models.Model):
    THEME_CHOICES = (
        ('dark', 'Dark'),
        ('light', 'Light'),
        ('system', 'System'),
    )
    
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
    )
    
    TIMEZONE_CHOICES = (
        ('utc-5', 'UTC-5 (Eastern Time)'),
        ('utc-6', 'UTC-6 (Central Time)'),
        ('utc-7', 'UTC-7 (Mountain Time)'),
        ('utc-8', 'UTC-8 (Pacific Time)'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='dark')
    accent_color = models.CharField(max_length=10, default='blue')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    timezone = models.CharField(max_length=10, choices=TIMEZONE_CHOICES, default='utc-5')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    reminder_notifications = models.BooleanField(default=True)
    task_completion_notifications = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username}'s settings"