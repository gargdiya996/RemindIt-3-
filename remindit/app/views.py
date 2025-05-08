from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils.dateparse import parse_date
from django.db.models import Q
from datetime import datetime, date
import json
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

from .models import Event, UserSettings
from .forms import CustomUserCreationForm, CustomAuthenticationForm, EventForm, UserSettingsForm

# Email utility function
def send_reminder_email(user_email, event_title, event_date, event_description=""):
    """Send reminder email with proper date formatting"""
    subject = f"🔔 Reminder: {event_title}"
    
    # Format date for email display
    if isinstance(event_date, date):
        formatted_date = event_date.strftime('%Y-%m-%d')
    else:
        formatted_date = str(event_date)
    
    html_message = render_to_string('app/reminder_email.html', {
        'title': event_title,
        'date': formatted_date,
        'description': event_description,
    })
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        html_message=html_message,
        fail_silently=False,
    )

def landing_page(request):
    if request.user.is_authenticated:
        return redirect('index')
    return render(request, 'app/landing.html')

def signup_view(request):
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'app/signup.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('index')
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'app/login.html', {'form': form})

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
def index_view(request):
    today = datetime.now().date()
    upcoming_events = Event.objects.filter(
        user=request.user,
        date__gte=today,
        completed=False
    ).order_by('date', 'time')[:3]
    
    context = {
        'upcoming_events': upcoming_events,
    }
    return render(request, 'app/index.html', context)

@login_required
def tasks_view(request):
    tasks = Event.objects.filter(
        user=request.user,
        event_type='task'
    ).order_by('date', 'time')
    
    context = {
        'tasks': tasks,
    }
    return render(request, 'app/tasks.html', context)

@login_required
def settings_view(request):
    try:
        user_settings = UserSettings.objects.get(user=request.user)
    except UserSettings.DoesNotExist:
        user_settings = UserSettings.objects.create(user=request.user)
    
    if request.method == 'POST':
        form = UserSettingsForm(request.POST, instance=user_settings)
        if form.is_valid():
            form.save()
            return redirect('settings')
    else:
        form = UserSettingsForm(instance=user_settings)
    
    context = {
        'form': form,
        'user_settings': user_settings,
    }
    return render(request, 'app/settings.html', context)

# API Views
@login_required
def get_events(request):
    start_date = request.GET.get('start')
    end_date = request.GET.get('end')
    
    events = Event.objects.filter(user=request.user)
    
    if start_date:
        events = events.filter(date__gte=parse_date(start_date))
    if end_date:
        events = events.filter(date__lte=parse_date(end_date))
    
    events_data = []
    for event in events:
        event_data = {
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'time': event.time.strftime('%H:%M:%S') if event.time else None,
            'event_type': event.event_type,
            'priority': event.priority,
            'completed': event.completed,
        }
        events_data.append(event_data)
    
    return JsonResponse(events_data, safe=False)

@login_required
def get_event(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)
    
    event_data = {
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'date': event.date.isoformat(),
        'time': event.time.strftime('%H:%M:%S') if event.time else None,
        'event_type': event.event_type,
        'priority': event.priority,
        'completed': event.completed,
    }
    
    return JsonResponse(event_data)

@login_required
@require_POST
def create_event(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('title') or not data.get('date'):
            return JsonResponse({'error': 'Title and date are required'}, status=400)
        
        event_date = parse_date(data.get('date'))
        if not event_date:
            return JsonResponse({'error': 'Invalid date format'}, status=400)
        
        event = Event(
            user=request.user,
            title=data.get('title'),
            description=data.get('description', ''),
            date=event_date,
            time=data.get('time'),
            event_type=data.get('event_type', 'task'),
            priority=data.get('priority') if data.get('event_type') == 'task' else None,
            completed=False
        )
        event.save()
        
        # Send email notification if user has email
        if request.user.email:
            try:
                send_reminder_email(
                    user_email=request.user.email,
                    event_title=event.title,
                    event_date=event.date,
                    event_description=event.description
                )
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
        
        return JsonResponse({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'time': event.time.strftime('%H:%M:%S') if event.time else None,
            'event_type': event.event_type,
            'priority': event.priority,
            'completed': event.completed,
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_POST
def update_event(request, event_id):
    try:
        event = get_object_or_404(Event, id=event_id, user=request.user)
        data = json.loads(request.body)
        
        new_date = parse_date(data.get('date', event.date.isoformat()))
        if not new_date:
            return JsonResponse({'error': 'Invalid date format'}, status=400)
        
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.date = new_date
        event.time = data.get('time', event.time)
        event.event_type = data.get('event_type', event.event_type)
        
        if event.event_type == 'task':
            event.priority = data.get('priority', event.priority)
        else:
            event.priority = None
        
        event.completed = data.get('completed', event.completed)
        event.save()
        
        return JsonResponse({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'time': event.time.strftime('%H:%M:%S') if event.time else None,
            'event_type': event.event_type,
            'priority': event.priority,
            'completed': event.completed,
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_POST
def delete_event(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)
    event.delete()
    return JsonResponse({'success': True})

@login_required
@require_POST
def toggle_complete(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)
    event.completed = not event.completed
    event.save()
    return JsonResponse({
        'id': event.id,
        'completed': event.completed,
    })

@login_required
def filter_tasks(request):
    filter_type = request.GET.get('filter', 'all')
    category = request.GET.get('category', 'all')
    search = request.GET.get('search', '')
    
    tasks = Event.objects.filter(user=request.user, event_type='task')
    
    # Apply filter
    if filter_type == 'active':
        tasks = tasks.filter(completed=False)
    elif filter_type == 'completed':
        tasks = tasks.filter(completed=True)
    
    # Apply category
    today = datetime.now().date()
    if category == 'today':
        tasks = tasks.filter(date=today)
    elif category == 'upcoming':
        tasks = tasks.filter(date__gt=today, completed=False)
    elif category == 'important':
        tasks = tasks.filter(priority='high')
    elif category == 'past':
        tasks = tasks.filter(date__lt=today)
    
    # Apply search
    if search:
        tasks = tasks.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )
    
    tasks_data = []
    for task in tasks:
        task_data = {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'date': task.date.isoformat(),
            'time': task.time.strftime('%H:%M:%S') if task.time else None,
            'priority': task.priority,
            'completed': task.completed,
        }
        tasks_data.append(task_data)
    
    return JsonResponse(tasks_data, safe=False)