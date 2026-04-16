import { Task } from './task';
import { Account } from './account';

export class AlgoTask extends Task {
  startDate: Date;
  dueDate: Date;
  minScopeMinutes: number;
  maxScopeMinutes: number;
  difficulty: number;

  constructor(
    id: number,
    title: string,
    description: string = '',
    startDate: Date,
    dueDate: Date,
    dependencies: Task[] = [],
    labels: string[] = [],
    account: Account,
    isFinished: boolean = false,
    minScopeMinutes: number,
    maxScopeMinutes: number,
    difficulty: number,
  ) {
    // PlannedTask scopes are set by the algorithm, not the user
    super(id, title, description, dependencies, labels, [], account, isFinished);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.minScopeMinutes = minScopeMinutes;
    this.maxScopeMinutes = maxScopeMinutes;
    this.difficulty = difficulty;
  }
}
