// src/app/components/list-view/list-view.ts
import { Component, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignee?: {
    name: string;
    avatar?: string;
    initials: string;
  };
}

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'list-view.html',
  styleUrl: 'list-view.css'
})
export class ListView implements OnInit {
  // Inputs
  tasks = input<Task[]>([]);
  
  // Outputs
  taskClick = output<Task>();
  taskEdit = output<Task>();
  taskDelete = output<Task>();
  
  // Interner State
  searchTask: string = '';
  activeFilter: 'all' | 'todo' | 'in-progress' | 'done' = 'all';
  
  filters = [
    { label: 'Alle', value: 'all' as const },
    { label: 'Offen', value: 'todo' as const },
    { label: 'In Arbeit', value: 'in-progress' as const },
    { label: 'Erledigt', value: 'done' as const }
  ];

  ngOnInit(): void {
    // Initialisierung falls nötig
  }

  // Gefilterte Tasks
  filteredTasks(): Task[] {
    let result = this.tasks();
    
    // Text-Suche
    if (this.searchTask.trim()) {
      const search = this.searchTask.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.assignee?.name.toLowerCase().includes(search)
      );
    }
    
    // Status-Filter
    if (this.activeFilter !== 'all') {
      result = result.filter(t => t.status === this.activeFilter);
    }
    
    return result;
  }

  // Computed Stats
  openCount(): number {
    return this.tasks().filter(t => t.status !== 'done').length;
  }
  
  doneCount(): number {
    return this.tasks().filter(t => t.status === 'done').length;
  }

  // Event Handler
  onSearchChange(): void {
    // Suche wird automatisch über filteredTasks() aktualisiert
  }

  clearSearch(): void {
    this.searchTask = '';
  }

  setFilter(filter: typeof this.activeFilter): void {
    this.activeFilter = filter;
  }

  onTaskClick(task: Task): void {
    this.taskClick.emit(task);
  }

  onEdit(task: Task, event: Event): void {
    event.stopPropagation();
    this.taskEdit.emit(task);
  }

  onDelete(task: Task, event: Event): void {
    event.stopPropagation();
    this.taskDelete.emit(task);
  }

  // Helper für Styling
  getStatusClass(status: Task['status']): string {
    const map = {
      'todo': 'badge-neutral',
      'in-progress': 'badge-warning',
      'done': 'badge-success'
    };
    return map[status];
  }

  getStatusLabel(status: Task['status']): string {
    const map = {
      'todo': 'Offen',
      'in-progress': 'In Arbeit',
      'done': 'Erledigt'
    };
    return map[status];
  }

  getPriorityLabel(priority: Task['priority']): string {
    const map = {
      'low': 'Niedrig',
      'medium': 'Mittel',
      'high': 'Hoch'
    };
    return map[priority];
  }
}