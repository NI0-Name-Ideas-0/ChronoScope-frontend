import { Task } from './task';
import { Scope } from './scope';
import { Account } from './account';

export class StaticTask extends Task {
  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    scopes: Scope[] = [],
    account: Account,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, scopes, account, isFinished);
  }
}
