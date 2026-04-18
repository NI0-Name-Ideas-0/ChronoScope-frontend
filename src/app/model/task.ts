export abstract class Task {
  /**
   * Task Model.
   *
   * @remarks The scopes will later correspond to actual fullcalendar Event objects.
   *
   * @param id - derived from the backend id
   * @param title - Title of the task
   * @param description - Description of the task
   * @param dependencies - Array of Tasks that need to be finished before this one can start (optional)
   * @param labels - Tags to label the task (optional)
   * @param accountId - ID of the account this task belongs to
   * @param difficulty - Difficulty level of the task
   * @param isFinished - Boolean to set when the task gets done (optional)
   *
   */
  id: number;
  title: string;
  description: string;
  dependencies: Task[];
  labels: string[];
  accountId: number;
  difficulty: number;
  isFinished: boolean;

  constructor(
    id: number,
    title: string,
    description: string = '',
    dependencies: Task[] = [],
    labels: string[] = [],
    accountId: number,
    difficulty: number,
    isFinished: boolean = false,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dependencies = dependencies;
    this.labels = labels;
    this.accountId = accountId;
    this.difficulty = difficulty;
    this.isFinished = isFinished;
  }
}
