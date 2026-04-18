import { Task } from './task';
import { Scope } from './scope';

export class AlgoTask extends Task {
  startDate: Date;
  dueDate: Date;
  scopes: Scope[];
  minScopeMinutes: number;
  maxScopeMinutes: number;

  constructor(
    id: number,
    title: string,
    description: string = '',
    startDate: Date,
    dueDate: Date,
    dependencies: Task[] = [],
    labels: string[] = [],
    accountId: number,
    scopes: Scope[] = [],
    difficulty: number,
    isFinished: boolean = false,
    minScopeMinutes: number,
    maxScopeMinutes: number,
  ) {
    // PlannedTask scopes are set by the algorithm, not the user
    super(id, title, description, dependencies, labels, accountId, difficulty, isFinished);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.scopes = scopes;
    this.minScopeMinutes = minScopeMinutes;
    this.maxScopeMinutes = maxScopeMinutes;
  }
}
