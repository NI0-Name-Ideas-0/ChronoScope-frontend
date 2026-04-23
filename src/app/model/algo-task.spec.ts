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
        [], // dependencies
        [], // labels
        1, // accountId
        [], // scopes
        1, // difficulty
        false, // isFinished
        30, // minScopeMinutes
        120, // maxScopeMinutes
      ),
    ).toBeTruthy();
  });
});
