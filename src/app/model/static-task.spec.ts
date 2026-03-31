import { StaticTask } from './static-task';

describe('StaticTask', () => {
  it('should create an instance', () => {
    expect(new StaticTask('Test Task', '', undefined, new Date())).toBeTruthy();
  });
});
