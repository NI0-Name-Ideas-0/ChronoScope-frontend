// src/app/components/list-view/list-view.ts
import { Component, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { Task } from '@app/model/task';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'list-view.html',
  styleUrl: 'list-view.css'
})
export class ListView implements OnInit {
   constructor(
    private taskService: TaskService,
    private taskModalService: TaskModalService,
  ) {}

  // Inputs
  tasks: Task[] = [];
  
  // Interner State
  searchTask: string = '';
  activeFilter: 'todo' | 'today' | 'done' = 'todo';
  
  filters = [
    { label: 'Open', value: 'todo' as const },
    { label: 'Today', value: 'today' as const },
    { label: 'Done', value: 'done' as const }
  ];

  ngOnInit(): void {
    this.tasks = this.taskService.getTasks();
  }

  onSearchChange(){

  }

  clearSearch(){

  }

  setFilter(filterValue:string){

  }

  filteredTasks(){
    return this.tasks
  }

  openCount(){
    return 0
  }

  doneCount(){
    return 0
  }

  onTaskClick(task:Task){

  }

  onEdit(task:Task, event:Event){

  }

  onDelete(task:Task, event:Event){
    
  }
}