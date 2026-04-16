import { Task } from './task';
import { Account } from './account';

export class AlgoTask extends Task {
  startDate: Date;
  dueDate: Date;
  minScopeMinutes: number;
  maxScopeMinutes: number;

  constructor(
    id: number | null,
    title: string,
    description: string = '',
    startDate: Date,
    dueDate: Date,
    dependencies: Task[] = [],
    labels: string[] = [],
    account: Account,
    difficulty: number,
    isFinished: boolean = false,
    minScopeMinutes: number,
    maxScopeMinutes: number,
  ) {
    // PlannedTask scopes are set by the algorithm, not the user
    super(id, title, description, dependencies, labels, [], account, difficulty, isFinished);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.minScopeMinutes = minScopeMinutes;
    this.maxScopeMinutes = maxScopeMinutes;
  }
}
