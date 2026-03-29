import { Scope } from './scope';

describe('Scope', () => {
  it('should create an instance', () => {
    expect(new Scope(new Date(), new Date())).toBeTruthy();
  });
});
