import { Task } from './task';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard';

export class AlgoTask extends Task {
  minScopeMinutes: number;
  maxScopeMinutes: number;
  priority: Priority;
  difficulty: Difficulty;

  constructor(
    title: string,
    description: string = '',
    startDate: Date,
    dueDate: Date,
    dependencies: Task[] = [],
    labels: string[] = [],
    isFinished: boolean = false,
    minScopeMinutes: number,
    maxScopeMinutes: number,
    priority: Priority = 'medium',
    difficulty: Difficulty = 'medium',
  ) {
    // PlannedTask scopes are set by the algorithm, not the user
    super(title, description, startDate, dueDate, dependencies, labels, [], isFinished);
    this.minScopeMinutes = minScopeMinutes;
    this.maxScopeMinutes = maxScopeMinutes;
    this.priority = priority;
    this.difficulty = difficulty;
  }
}
