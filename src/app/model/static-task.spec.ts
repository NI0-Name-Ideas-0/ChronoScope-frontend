import { StaticTask } from './static-task';
import { Scope } from './scope';

describe('StaticTask', () => {
  it('should create an instance', () => {
    expect(
      new StaticTask(
        1, // id
        'Test Task', // title
        '', // description
        [], // dependencies
        [], // labels
        new Scope(new Date(), new Date()), // scope(start, end)
        'uuid', // organizationId
        1, // difficulty
        false, // isFinished
      ),
    ).toBeTruthy();
  });
});
