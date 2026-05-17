import { AlgoTask } from './algo-task';

describe('AlgoTask', () => {
  it('should create an instance', () => {
    expect(
      new AlgoTask(
        1, // id
        'Test Task', // title
        '', // description
        new Date(), // startDate
        new Date(), // dueDate
        60, // duration
        0, // elapsedMinutes
        [], // dependencies
        [], // labels
        'uuid', // organizationId
        [], // scopes
        'MEDIUM', // difficulty
        false, // isFinished
        'UNSET', // color
        30, // minScopeMinutes
        120, // maxScopeMinutes
      ),
    ).toBeTruthy();
  });
});
