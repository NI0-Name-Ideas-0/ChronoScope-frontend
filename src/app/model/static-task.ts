import { Task } from './task';
import { Scope } from './scope';
import { Account } from './account';

export class StaticTask extends Task {
  scope: Scope;
  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    scope: Scope,
    account: Account,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, account, difficulty, isFinished);
    this.scope = scope;
  }
}
