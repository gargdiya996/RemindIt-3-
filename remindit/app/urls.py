from django.urls import path
from . import views

urlpatterns = [
    # Page views
    path('', views.landing_page, name='landing'),
    path('calendar/', views.index_view, name='index'),
    path('tasks/', views.tasks_view, name='tasks'),
    path('settings/', views.settings_view, name='settings'),
    
    # Authentication
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    

    # API endpoints
    path('api/events/', views.get_events, name='get_events'),
    path('api/events/<int:event_id>/', views.get_event, name='get_event'),
    path('api/events/create/', views.create_event, name='create_event'),
    path('api/events/<int:event_id>/update/', views.update_event, name='update_event'),
    path('api/events/<int:event_id>/delete/', views.delete_event, name='delete_event'),
    path('api/events/<int:event_id>/toggle-complete/', views.toggle_complete, name='toggle_complete'),
    path('api/tasks/filter/', views.filter_tasks, name='filter_tasks'),
]
