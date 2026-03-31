import { Task } from './task';
import { Scope } from './scope';

export class StaticTask extends Task {
  constructor(
    title: string,
    description: string = '',
    startDate: Date | undefined = undefined,
    dueDate: Date,
    dependencies: Task[] = [],
    labels: string[] = [],
    scopes: Scope[] = [],
    isFinished: boolean = false,
  ) {
    super(title, description, startDate, dueDate, dependencies, labels, scopes, isFinished);
  }
}
