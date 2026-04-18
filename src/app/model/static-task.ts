import { Task } from './task';
import { Scope } from './scope';

export class StaticTask extends Task {
  scope: Scope;
  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    scope: Scope,
    accountId: number,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, accountId, difficulty, isFinished);
    this.scope = scope;
  }
}
