import { Account } from './account';

export abstract class Task {
  /**
   * Task Model.
   *
   * @remarks The scopes will later correspond to actual fullcalendar Event objects.
   *
   * @param id - derived from the backend id
   * @param title - Title of the task
   * @param description - Description of the task
   * @param dependencies - Arraay of Tasks that need to be finished before this one can start (optional)
   * @param labels - Tags to label the task (optional)
   * @param scopes - Time blocks  where the user plans to work on the task (optional)
   * @param account - an account the task belongs to
   * @param isFinished - Boolean to set when the task gets done (optional)
   *
   */
  id: number;
  title: string;
  description: string;
  dependencies: Task[];
  labels: string[];
  account: Account;
  difficulty: number;
  isFinished: boolean;

  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    account: Account,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    ((this.id = id), //TODO This will change once the backend is connected
      (this.title = title),
      (this.description = description),
      (this.dependencies = dependencies),
      (this.labels = labels),
      (this.account = account),
      (this.difficulty = difficulty),
      (this.isFinished = isFinished));
  }
}
