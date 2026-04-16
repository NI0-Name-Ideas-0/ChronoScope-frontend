import { Task } from './task';
import { Scope } from './scope';
import { Account } from './account';

export class StaticTask extends Task {
  constructor(
    id: number | null,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    scopes: Scope[] = [],
    account: Account,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, scopes, account, difficulty, isFinished);
  }
}
