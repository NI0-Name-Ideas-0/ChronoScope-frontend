import { Task } from './task';
import { Scope } from './scope';

export class AlgoTask extends Task {
  startDate: Date;
  dueDate: Date;
  duration: number;
  elapsedMinutes: number;
  dependencies: number[];
  scopes: Scope[];
  minScopeMinutes: number;
  maxScopeMinutes: number;

  constructor(
    id: number,
    title: string,
    description: string = '',
    startDate: Date,
    dueDate: Date,
    duration: number,
    elapsedMinutes: number,
    dependencies: number[] = [],
    labels: string[] = [],
    organizationId: string | null,
    scopes: Scope[] = [],
    difficulty: string,
    isFinished: boolean = false,
    minScopeMinutes: number,
    maxScopeMinutes: number,
  ) {
    // PlannedTask scopes are set by the algorithm, not the user
    super(id, title, description, labels, organizationId, difficulty, isFinished);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.duration = duration;
    this.elapsedMinutes = elapsedMinutes;
    this.dependencies = dependencies;
    this.scopes = scopes;
    this.minScopeMinutes = minScopeMinutes;
    this.maxScopeMinutes = maxScopeMinutes;
  }
}
