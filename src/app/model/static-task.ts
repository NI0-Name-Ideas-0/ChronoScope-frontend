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
    organizationId: string | null,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, organizationId, difficulty, isFinished);
    this.scope = scope;
  }
}
