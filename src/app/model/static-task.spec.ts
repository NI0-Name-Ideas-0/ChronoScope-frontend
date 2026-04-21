import { StaticTask } from './static-task';

describe('StaticTask', () => {
  it('should create an instance', () => {
    expect(
      new StaticTask(
        1, // id
        'Test Task', // title
        '', // description
        [], // dependencies
        [], // labels
        new Date(), // start
        new Date(), // end
        1, // accountId
        1, // difficulty
        false, // isFinished
      ),
    ).toBeTruthy();
  });
});
