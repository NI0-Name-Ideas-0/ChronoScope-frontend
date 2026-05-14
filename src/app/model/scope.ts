export class Scope {
  start: Date;
  end: Date;
  isFinished: boolean;

  constructor(start: Date, end: Date, isFinished: boolean = false) {
    this.start = start;
    this.end = end;
    this.isFinished = isFinished;
  }
}
