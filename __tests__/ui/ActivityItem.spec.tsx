import type * as browser from 'webextension-polyfill';
import { cookieToSetDetails } from '../../src/ui/common_components/ActivityItem';
import type { CookiePropertiesCleanup } from '../../src/typings/Cleanup';

const cookie: CookiePropertiesCleanup = {
  domain: '.tracker.test',
  expirationDate: 123456789,
  firstPartyDomain: 'first-party.test',
  hostOnly: false,
  hostname: 'tracker.test',
  httpOnly: true,
  mainDomain: 'tracker.test',
  name: 'session',
  path: '/',
  preparedCookieDomain: 'https://tracker.test/',
  sameSite: 'no_restriction',
  secure: true,
  session: false,
  storeId: 'firefox-default',
  value: 'value',
};

describe('cookieToSetDetails()', () => {
  it('preserves the complete partitionKey', () => {
    const partitionKey: browser.Cookies.PartitionKey = {
      topLevelSite: 'https://example.com',
      hasCrossSiteAncestor: true,
    };

    expect(cookieToSetDetails({ ...cookie, partitionKey }, false)).toEqual(
      expect.objectContaining({ partitionKey }),
    );
  });

  it('does not add partitionKey to an unpartitioned cookie', () => {
    expect(cookieToSetDetails(cookie, false)).not.toHaveProperty(
      'partitionKey',
    );
  });

  it('keeps firstPartyDomain for Firefox', () => {
    expect(cookieToSetDetails(cookie, true)).toHaveProperty(
      'firstPartyDomain',
      'first-party.test',
    );
  });

  it('removes firstPartyDomain for Chromium', () => {
    expect(cookieToSetDetails(cookie, false)).not.toHaveProperty(
      'firstPartyDomain',
    );
  });
});
