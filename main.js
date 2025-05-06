// Task Management System
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks() || [];
        this.currentFilter = 'all';
        this.currentView = 'tasks';
        this.setupEventListeners();
        this.renderTasks();
        this.renderCalendar();
    }

    loadTasks() {
        const tasksData = window.localStorage.getItem('tasks');
        try {
            return tasksData ? JSON.parse(tasksData) : [];
        } catch (e) {
            console.error('Error loading tasks:', e);
            return [];
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar button').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Task Actions
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('cancelTask').addEventListener('click', () => this.hideModal());

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterTasks(btn.dataset.filter));
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchTasks(e.target.value));

        // Calendar Navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.sidebar button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.views > div').forEach(div => {
            div.classList.toggle('active', div.classList.contains(`${view}-view`));
        });
    }

    showModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');

        if (task) {
            title.textContent = 'Edit Task';
            form.dataset.taskId = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskPriority').value = task.priority;
        } else {
            title.textContent = 'Add New Task';
            form.reset();
            delete form.dataset.taskId;
        }

        modal.classList.add('active');
    }

    hideModal() {
        document.getElementById('taskModal').classList.remove('active');
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const task = {
            id: form.dataset.taskId || Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (form.dataset.taskId) {
            const index = this.tasks.findIndex(t => t.id === form.dataset.taskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...task };
            }
        } else {
            this.tasks.push(task);
        }

        this.saveTasks();
        this.hideModal();
        this.renderTasks();
        this.renderCalendar();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.renderCalendar();
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    filterTasks(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTasks();
    }

    searchTasks(query) {
        const searchQuery = query.toLowerCase();
        const filteredTasks = this.tasks.filter(task => {
            return task.title.toLowerCase().includes(searchQuery) ||
                   task.description.toLowerCase().includes(searchQuery);
        });
        this.renderTasksList(filteredTasks);
    }

    renderTasks() {
        let filteredTasks = [...this.tasks];
        
        if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (this.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        this.renderTasksList(filteredTasks);
    }

    renderTasksList(tasks) {
        const container = document.getElementById('tasksContainer');
        container.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span class="task-date">
                        <span class="material-symbols-rounded">calendar_today</span>
                        ${new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span class="priority-badge priority-${task.priority}">
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    <div class="task-actions">
                        <button onclick="taskManager.toggleTaskStatus('${task.id}')" title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
                            <span class="material-symbols-rounded">${task.completed ? 'undo' : 'check_circle'}</span>
                        </button>
                        <button onclick="taskManager.showModal(${JSON.stringify(task)})" title="Edit task">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button onclick="taskManager.deleteTask('${task.id}')" title="Delete task">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(taskElement);
        });
    }

    renderCalendar() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        document.getElementById('currentMonth').textContent = 
            firstDay.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        
        const daysContainer = document.getElementById('calendarDays');
        daysContainer.innerHTML = '';
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (date.toDateString() === now.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check if there are tasks for this day
            const hasTasksOnDay = this.tasks.some(task => {
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === date.toDateString();
            });
            
            if (hasTasksOnDay) {
                dayElement.classList.add('has-tasks');
            }
            
            dayElement.textContent = day;
            daysContainer.appendChild(dayElement);
        }
    }

    navigateMonth(direction) {
        const currentMonth = document.getElementById('currentMonth').textContent;
        const [month, year] = currentMonth.split(' ');
        const date = new Date(`${month} 1, ${year}`);
        date.setMonth(date.getMonth() + direction);
        
        document.getElementById('currentMonth').textContent = 
            date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            
        this.renderCalendar();
    }

    saveTasks() {
        try {
            window.localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Error saving tasks:', e);
        }
    }
}

// Initialize the Task Manager
const taskManager = new TaskManager();