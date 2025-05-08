from django.contrib import admin
from .models import Event, UserSettings

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'date', 'time', 'event_type', 'priority', 'completed')
    list_filter = ('event_type', 'priority', 'completed', 'date')
    search_fields = ('title', 'description', 'user__username')
    date_hierarchy = 'date'

@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'language', 'timezone')
    list_filter = ('theme', 'language', 'timezone')
    search_fields = ('user__username',)