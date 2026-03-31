import { AlgoTask } from './algo-task';

describe('AlgoTask', () => {
  it('should create an instance', () => {
    expect(
      new AlgoTask('Test Task', '', new Date(), new Date(), [], [], false, 0, 60),
    ).toBeTruthy();
  });
});
