import { Scope } from './scope';

export abstract class Task {
  /**
   * Task Model.
   *
   * @remarks The scopes will later correspond to actual fullcalendar Event objects.
   *
   * @param title - Title of the task
   * @param description - Description of the task
   * @param startDate - A Date where work on this task can/will start (optional)
   * @param dueDate - A Date where this task ends, if startDate has been omitted,
   * the task will be displayed on this Date in the calendar
   * @param dependencies - Arraay of Tasks that need to be finished before this one can start (optional)
   * @param labels - Tags to label the task (optional)
   * @param scopes - Time blocks  where the user plans to work on the task (optional)
   * @param isFinished - Boolean to set when the task gets done (optional)
   *
   */
  id: string;
  title: string;
  description: string;
  startDate: Date | undefined;
  dueDate: Date;
  dependencies: Task[];
  labels: string[];
  scopes: Scope[];
  isFinished: boolean;

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
    this.id = crypto.randomUUID(); //TODO This will change once the backend is connected
    ((this.title = title),
      (this.description = description),
      (this.startDate = startDate),
      (this.dueDate = dueDate),
      (this.dependencies = dependencies),
      (this.labels = labels),
      (this.scopes = scopes),
      (this.isFinished = isFinished));
  }
}
