import { Task } from './task';

describe('Task', () => {
  it('should create an instance', () => {
    expect(new Task('Test Task', '', undefined, new Date())).toBeTruthy();
  });
});
