import { AccountResponse } from '../api/models';
/**
 * Extracts human-readable account names from AccountResponse objects
 * Returns organization names if available, falls back to account ID
 *
 * @param account The account response object
 * @returns A human-readable name for the account (organization name or account ID)
 */
export function getAccountDisplayName(account: AccountResponse): string {
  if (account.organizations && account.organizations.length > 0) {
    // Join multiple organization names with commas
    return account.organizations.map((org) => org.name || `Account ${account.id}`).join(', ');
  }
  return `Account ${account.id}`;
}
/**
 * Converts an array of accounts to a format suitable for dropdown/select options
 *
 * @param accounts Array of account responses
 * @returns Array of objects with id and display name
 */
export function formatAccountsForDropdown(
  accounts: AccountResponse[],
): Array<{ id: number; displayName: string }> {
  return accounts
    .filter((account) => account.id !== undefined)
    .map((account) => ({
      id: account.id!,
      displayName: getAccountDisplayName(account),
    }));
}
