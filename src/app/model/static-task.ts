import { Task } from './task';

export class StaticTask extends Task {
  start: Date;
  end: Date;

  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    start: Date,
    end: Date,
    accountId: number,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    super(id, title, description, dependencies, labels, accountId, difficulty, isFinished);
    this.start = start;
    this.end = end;
  }
}
