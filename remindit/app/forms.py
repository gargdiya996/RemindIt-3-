from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import Event, UserSettings

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    full_name = forms.CharField(max_length=100, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'full_name', 'password1', 'password2')
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        
        # Split full name into first and last name
        full_name = self.cleaned_data['full_name'].split(' ', 1)
        user.first_name = full_name[0]
        if len(full_name) > 1:
            user.last_name = full_name[1]
        
        if commit:
            user.save()
            # Create default settings for the user
            UserSettings.objects.create(user=user)
        return user

class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(label='Email / Username')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Enter your email or username'})
        self.fields['password'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Enter your password'})

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ('title', 'description', 'date', 'time', 'event_type', 'priority')
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make priority field optional for non-task events
        self.fields['priority'].required = False

class UserSettingsForm(forms.ModelForm):
    class Meta:
        model = UserSettings
        exclude = ('user',)