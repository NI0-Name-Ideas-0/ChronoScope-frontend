import { Task, TaskColor } from './task';
import { Scope } from './scope';

export class StaticTask extends Task {
  scope: Scope;
  rrule: string;
  isBlocker: boolean;
  constructor(
    id: number,
    title: string,
    description: string = '',
    labels: string[] = [],
    scope: Scope,
    organizationId: string | null,
    difficulty: string,
    isFinished: boolean = false,
    color: TaskColor = 'UNSET',
    rrule: string = '',
    isBlocker: boolean = false,
  ) {
    super(id, title, description, labels, organizationId, difficulty, isFinished, color);
    this.scope = scope;
    this.rrule = rrule;
    this.isBlocker = isBlocker;
  }
}
