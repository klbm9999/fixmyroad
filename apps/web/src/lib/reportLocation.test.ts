import { getInitialLocationFromSearchParams } from './reportLocation';

describe('getInitialLocationFromSearchParams', () => {
  it('returns null when lat is missing', () => {
    expect(getInitialLocationFromSearchParams({ lng: '78.4' })).toBeNull();
  });

  it('returns null when lng is missing', () => {
    expect(getInitialLocationFromSearchParams({ lat: '17.3' })).toBeNull();
  });

  it('returns null when both are missing', () => {
    expect(getInitialLocationFromSearchParams({})).toBeNull();
  });

  it('returns { lat, lng } when both valid numbers are present', () => {
    expect(getInitialLocationFromSearchParams({ lat: '17.385', lng: '78.4867' })).toEqual({
      lat: 17.385,
      lng: 78.4867,
    });
  });

  it('returns null when lat is not a valid number', () => {
    expect(getInitialLocationFromSearchParams({ lat: 'abc', lng: '78' })).toBeNull();
  });

  it('returns null when lng is not a valid number', () => {
    expect(getInitialLocationFromSearchParams({ lat: '17', lng: 'invalid' })).toBeNull();
  });

  it('uses first element when params are arrays (Next.js behavior)', () => {
    expect(getInitialLocationFromSearchParams({ lat: ['17.3'], lng: ['78.4'] })).toEqual({
      lat: 17.3,
      lng: 78.4,
    });
  });

  it('returns null when lat is out of range', () => {
    expect(getInitialLocationFromSearchParams({ lat: '91', lng: '78' })).toBeNull();
    expect(getInitialLocationFromSearchParams({ lat: '-91', lng: '78' })).toBeNull();
  });

  it('returns null when lng is out of range', () => {
    expect(getInitialLocationFromSearchParams({ lat: '17', lng: '181' })).toBeNull();
    expect(getInitialLocationFromSearchParams({ lat: '17', lng: '-181' })).toBeNull();
  });
});
