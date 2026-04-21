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
  ) {}

  tasks: Task[] = [];
  searchTask: string = '';
  activeFilter: 'all' | 'todo' | 'today' | 'done' = 'today';
  
  //filters for the automatic Button creation in the .html
  filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Open', value: 'todo' as const },
    { label: 'Today', value: 'today' as const },
    { label: 'Done', value: 'done' as const }
  ];

  ngOnInit(): void {
    this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  onSearchChange(){

  }

  clearSearch(){

  }

  //used by the Filter-Buttons to set the value
  setFilter(filterValue: 'todo' | 'today' | 'done' | 'all'){
    this.activeFilter = filterValue;
  }

  //used for creating the List-View with the diffrent filter values, default is the unfiltered List
  filteringTasks(): Task[] {
    let result = this.tasks;

    switch (this.activeFilter) {
      case 'todo':
        result = result.filter(task => task.isFinished === false);
        break;
      case 'done':
        result = result.filter(task => task.isFinished === true);
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        result = result.filter(task => {
          const due = new Date(task.dueDate);
          due.setHours(0, 0, 0, 0);
          return due.getTime() === today.getTime();
        });
        break;
      default:
        break;
    }

    return result;
  }

  //returns the overall number of open tasks 
  openCount(): number {
    return this.tasks.filter(task => task.isFinished === false).length;
  }

  //returns the overall number of done tasks
  doneCount(): number{
    return this.tasks.filter(task => task.isFinished === true).length;
  }

  onTaskClick(task:Task){

  }

  onEdit(task:Task, event:Event){

  }

  onDelete(task:Task, event:Event){
    
  }
}