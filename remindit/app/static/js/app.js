// Updated app.js with fixed calendar functionality

document.addEventListener('DOMContentLoaded', function() {
    // Set CSRF token for AJAX requests
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    const csrftoken = getCookie('csrftoken');
    
    // Initialize calendar if on index page
    const calendarDays = document.getElementById('calendarDays');
    if (calendarDays) {
        initializeCalendar();
    }
    
    // Quick Add button functionality
    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', function() {
            const quickAddModal = new bootstrap.Modal(document.getElementById('quickAddModal'));
            quickAddModal.show();
        });
    }
    
    // Quick Add options
    const quickAddOptions = document.querySelectorAll('.quick-add-option');
    quickAddOptions.forEach(option => {
        option.addEventListener('click', function() {
            const eventType = this.getAttribute('data-type');
            const quickAddModal = bootstrap.Modal.getInstance(document.getElementById('quickAddModal'));
            quickAddModal.hide();
            
            setTimeout(() => {
                showAddEventModal(eventType);
            }, 400);
        });
    });
    
    // Save event button
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
    }
    
    // Event type change handler
    const eventTypeSelect = document.getElementById('eventType');
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', function() {
            const priorityGroup = document.getElementById('priorityGroup');
            if (this.value === 'task') {
                priorityGroup.style.display = 'block';
            } else {
                priorityGroup.style.display = 'none';
            }
        });
    }
    
    // Calendar navigation buttons
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('today');
    
    if (prevMonthBtn && nextMonthBtn && todayBtn) {
        prevMonthBtn.addEventListener('click', function() {
            navigateMonth(-1);
        });
        
        nextMonthBtn.addEventListener('click', function() {
            navigateMonth(1);
        });
        
        todayBtn.addEventListener('click', function() {
            navigateToToday();
        });
    }
    
    // View options
    const viewOptions = document.querySelectorAll('.btn-view');
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const viewType = this.getAttribute('data-view');
            changeCalendarView(viewType);
        });
    });
});

// Calendar functions
function initializeCalendar() {
    // Set current month and year
    const currentDate = new Date();
    updateMonthYearDisplay(currentDate);
    
    // Generate calendar days
    generateCalendarDays(currentDate);
    
    // Fetch events from server
    fetchEvents();
}

function updateMonthYearDisplay(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    const currentMonthYear = document.getElementById('currentMonthYear');
    if (currentMonthYear) {
        currentMonthYear.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
}

function generateCalendarDays(date) {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    // Clear existing calendar days
    calendarDays.innerHTML = '';
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and number of days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get today's date for highlighting
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Create previous month's days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        
        const dayNumber = daysInPrevMonth - i;
        const dateStr = formatDateString(new Date(prevYear, prevMonth, dayNumber));
        
        day.innerHTML = `
            <div class="day-header">
                <span class="day-number">${dayNumber}</span>
            </div>
        `;
        
        calendarDays.appendChild(day);
    }
    
    // Create current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        // Check if it's today
        if (i === todayDate && month === todayMonth && year === todayYear) {
            day.classList.add('today');
        }
        
        const dateStr = formatDateString(new Date(year, month, i));
        day.setAttribute('data-date', dateStr);
        
        day.innerHTML = `
            <div class="day-header">
                <span class="day-number">${i}</span>
                <button class="day-add-btn"><i class="bi bi-plus-circle"></i></button>
            </div>
            <div class="events-container" id="events-${dateStr}">
                <!-- Events will be added here -->
            </div>
        `;
        
        // Add event listeners
        day.querySelector('.day-add-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            showAddEventModal('task', dateStr);
        });
        
        calendarDays.appendChild(day);
    }
    
    // Create next month's days
    const totalDaysShown = firstDay + daysInMonth;
    const nextDaysNeeded = 42 - totalDaysShown; // 6 rows of 7 days
    
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let i = 1; i <= nextDaysNeeded; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        
        day.innerHTML = `
            <div class="day-header">
                <span class="day-number">${i}</span>
            </div>
        `;
        
        calendarDays.appendChild(day);
    }
}

function navigateMonth(direction) {
    const currentMonthYear = document.getElementById('currentMonthYear').textContent;
    const [month, year] = currentMonthYear.split(' ');
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    let monthIndex = monthNames.indexOf(month);
    let yearNum = parseInt(year);
    
    monthIndex += direction;
    
    if (monthIndex < 0) {
        monthIndex = 11;
        yearNum--;
    } else if (monthIndex > 11) {
        monthIndex = 0;
        yearNum++;
    }
    
    const newDate = new Date(yearNum, monthIndex, 1);
    updateMonthYearDisplay(newDate);
    generateCalendarDays(newDate);
    fetchEvents();
}

function navigateToToday() {
    const today = new Date();
    updateMonthYearDisplay(today);
    generateCalendarDays(today);
    fetchEvents();
}

function changeCalendarView(viewType) {
    // This would be implemented to switch between month, week, and day views
    console.log(`Changing to ${viewType} view`);
    // For now, we'll just stick with the month view
}

function fetchEvents() {
    // Get current month and year
    const currentMonthYear = document.getElementById('currentMonthYear').textContent;
    const [month, year] = currentMonthYear.split(' ');
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    const monthIndex = monthNames.indexOf(month);
    const yearNum = parseInt(year);
    
    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthIndex, 1);
    const endDate = new Date(yearNum, monthIndex + 1, 0);
    
    // Format dates for API
    const startDateStr = formatDateString(startDate);
    const endDateStr = formatDateString(endDate);
    
    // Fetch events from server
    fetch(`/api/events/?start=${startDateStr}&end=${endDateStr}`)
        .then(response => response.json())
        .then(events => {
            // Clear existing events
            document.querySelectorAll('.events-container').forEach(container => {
                container.innerHTML = '';
            });
            
            // Add events to calendar
            events.forEach(event => {
                addEventToCalendar(event);
            });
            
            // Update upcoming events
            updateUpcomingEvents(events);
        })
        .catch(error => {
            console.error('Error fetching events:', error);
        });
}

function addEventToCalendar(event) {
    const eventsContainer = document.getElementById(`events-${event.date}`);
    if (!eventsContainer) return;
    
    const eventElement = document.createElement('div');
    eventElement.className = `event ${event.event_type} ${event.completed ? 'completed' : ''}`;
    eventElement.setAttribute('data-event-id', event.id);
    eventElement.textContent = event.title;
    
    eventElement.addEventListener('click', function(e) {
        e.stopPropagation();
        showEventDetails(event.id);
    });
    
    eventsContainer.appendChild(eventElement);
}

function updateUpcomingEvents(events) {
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    if (!upcomingEventsList) return;
    
    // Clear existing events
    upcomingEventsList.innerHTML = '';
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter and sort upcoming events
    const upcomingEvents = events
        .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today && !event.completed;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3); // Limit to 3 events
    
    if (upcomingEvents.length === 0) {
        upcomingEventsList.innerHTML = '<div class="text-center p-4">No upcoming events</div>';
        return;
    }
    
    // Create event cards
    upcomingEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = `event-card ${event.event_type}`;
        eventCard.setAttribute('data-event-id', event.id);
        
        eventCard.innerHTML = `
            <div class="event-card-header">
                <span class="event-type ${event.event_type}">${capitalizeFirstLetter(event.event_type)}</span>
                <div class="event-actions">
                    <button class="event-action-btn edit-btn"><i class="bi bi-pencil"></i></button>
                </div>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-description">${event.description || 'No description'}</p>
            <div class="event-meta">
                <div class="event-meta-item">
                    <i class="bi bi-calendar3"></i>
                    <span>${formatDisplayDate(event.date)}</span>
                </div>
                ${event.time ? `
                    <div class="event-meta-item">
                        <i class="bi bi-clock"></i>
                        <span>${formatTime(event.time)}</span>
                    </div>
                ` : ''}
                ${event.priority ? `
                    <div class="event-meta-item">
                        <span class="priority-badge ${event.priority}">${capitalizeFirstLetter(event.priority)}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add event listeners
        eventCard.addEventListener('click', function() {
            showEventDetails(event.id);
        });
        
        eventCard.querySelector('.edit-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            showAddEventModal(event.event_type, null, event);
        });
        
        upcomingEventsList.appendChild(eventCard);
    });
}

function showAddEventModal(eventType = 'task', dateStr = null, event = null) {
    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
    const isEdit = event !== null;
    
    // Set modal title
    document.getElementById('addEventModalTitle').textContent = isEdit ? 
        `Edit ${capitalizeFirstLetter(event.event_type)}` : 
        `Add New ${capitalizeFirstLetter(eventType)}`;
    
    // Set form fields
    document.getElementById('eventTitle').value = isEdit ? event.title : '';
    document.getElementById('eventDescription').value = isEdit ? (event.description || '') : '';
    document.getElementById('eventDate').value = isEdit ? event.date : (dateStr || formatDateString(new Date()));
    document.getElementById('eventTime').value = isEdit ? (event.time || '') : '';
    
    const eventTypeSelect = document.getElementById('eventType');
    eventTypeSelect.value = isEdit ? event.event_type : eventType;
    
    // Show/hide priority based on event type
    const priorityGroup = document.getElementById('priorityGroup');
    if (isEdit ? event.event_type === 'task' : eventType === 'task') {
        priorityGroup.style.display = 'block';
        
        // Set priority
        const priorityRadios = document.querySelectorAll('input[name="priority"]');
        priorityRadios.forEach(radio => {
            if (isEdit && radio.value === event.priority) {
                radio.checked = true;
            } else if (!isEdit && radio.value === 'medium') {
                radio.checked = true;
            }
        });
    } else {
        priorityGroup.style.display = 'none';
    }
    
    // Set event ID for edit mode
    document.getElementById('eventId').value = isEdit ? event.id : '';
    
    modal.show();
}

function saveEvent() {
    const eventId = document.getElementById('eventId').value;
    const isEdit = eventId !== '';
    
    // Get form values
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const eventType = document.getElementById('eventType').value;
    
    // Get priority if event type is task
    let priority = null;
    if (eventType === 'task') {
        const priorityRadio = document.querySelector('input[name="priority"]:checked');
        priority = priorityRadio ? priorityRadio.value : 'medium';
    }
    
    // Validate form
    if (!title || !date) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Prepare data
    const eventData = {
        title,
        description,
        date,
        time: time || null,
        event_type: eventType,
        priority: priority,
    };
    
    // Send request to server
    const url = isEdit ? `/api/events/${eventId}/update/` : '/api/events/create/';
    const method = isEdit ? 'POST' : 'POST';
    
    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(eventData),
    })
    .then(response => response.json())
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
        modal.hide();
        
        // Refresh calendar
        fetchEvents();
    })
    .catch(error => {
        console.error('Error saving event:', error);
        alert('An error occurred while saving the event');
    });
}

function showEventDetails(eventId) {
    // Fetch event details from server
    fetch(`/api/events/${eventId}/update/`)
        .then(response => response.json())
        .then(event => {
            const modal = new bootstrap.Modal(document.getElementById('eventModal'));
            
            document.getElementById('eventModalTitle').textContent = event.title;
            
            let eventTypeLabel = '';
            if (event.event_type === 'task') eventTypeLabel = '<span class="priority-badge task">Task</span>';
            else if (event.event_type === 'reminder') eventTypeLabel = '<span class="priority-badge reminder">Reminder</span>';
            else if (event.event_type === 'note') eventTypeLabel = '<span class="priority-badge note">Note</span>';
            
            let timeStr = '';
            if (event.time) {
                timeStr = `<div class="detail-item"><i class="bi bi-clock me-2"></i>${formatTime(event.time)}</div>`;
            }
            
            let priorityStr = '';
            if (event.priority && event.event_type === 'task') {
                priorityStr = `<div class="detail-item"><i class="bi bi-flag me-2"></i><span class="priority-badge ${event.priority}">${capitalizeFirstLetter(event.priority)}</span></div>`;
            }
            
            let completedStr = '';
            if (event.event_type === 'task') {
                completedStr = event.completed ? 
                    '<div class="detail-item"><i class="bi bi-check-circle-fill me-2 text-success"></i>Completed</div>' : 
                    '<div class="detail-item"><i class="bi bi-circle me-2"></i>Not completed</div>';
            }
            
            document.getElementById('eventModalBody').innerHTML = `
                <div class="event-details">
                    <div class="detail-section">
                        <div class="detail-header">
                            ${eventTypeLabel}
                            <div class="detail-date"><i class="bi bi-calendar3 me-2"></i>${formatDisplayDate(event.date)}</div>
                        </div>
                        <div class="detail-content">
                            ${timeStr}
                            ${priorityStr}
                            ${completedStr}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-header">Description</div>
                        <div class="detail-content">
                            <p>${event.description || 'No description'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Set up action buttons
            const deleteBtn = document.getElementById('deleteEventBtn');
            const toggleBtn = document.getElementById('toggleCompleteBtn');
            const editBtn = document.getElementById('editEventBtn');
            
            deleteBtn.onclick = function() {
                if (confirm('Are you sure you want to delete this event?')) {
                    deleteEvent(eventId);
                }
            };
            
            toggleBtn.textContent = event.completed ? 'Mark Incomplete' : 'Mark Complete';
            toggleBtn.onclick = function() {
                toggleEventComplete(eventId);
            };
            
            editBtn.onclick = function() {
                modal.hide();
                setTimeout(() => {
                    showAddEventModal(event.event_type, null, event);
                }, 400);
            };
            
            // Show modal
            modal.show();
        })
        .catch(error => {
            console.error('Error fetching event details:', error);
            alert('An error occurred while fetching event details');
        });
}

function deleteEvent(eventId) {
    fetch(`/api/events/${eventId}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
        modal.hide();
        
        // Refresh calendar
        fetchEvents();
    })
    .catch(error => {
        console.error('Error deleting event:', error);
        alert('An error occurred while deleting the event');
    });
}

function toggleEventComplete(eventId) {
    fetch(`/api/events/${eventId}/toggle-complete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
        modal.hide();
        
        // Refresh calendar
        fetchEvents();
    })
    .catch(error => {
        console.error('Error toggling event completion:', error);
        alert('An error occurred while updating the event');
    });
}

// Helper functions
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    
    // If timeStr is already in HH:MM format
    if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    return timeStr;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}