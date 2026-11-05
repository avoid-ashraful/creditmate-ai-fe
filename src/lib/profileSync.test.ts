/**
 * D4 profile sync rules (Phase 3): the server is the account's source of
 * truth, but a device that already holds non-default numbers must not
 * lose them on first sign-in — they upload, once, then the server leads.
 * Later local edits push back, debounced. Modules are re-required per
 * test because the sync has a module-level start guard.
 */

// Module marker: the file only uses require() so isolatedModules needs an export.
// eslint-disable-next-line jest/no-export
export {};

jest.mock('../services/profile', () => ({
  getServerProfileDefaults: jest.fn(),
  updateServerProfileDefaults: jest.fn(),
}));

interface Loaded {
  readProfile: () => { balance: number; monthlySpend: number; loanAmount: number };
  writeProfile: (values: { balance: number; monthlySpend: number; loanAmount: number }) => void;
  startProfileSync: () => Promise<void>;
  getServerProfileDefaults: jest.Mock;
  updateServerProfileDefaults: jest.Mock;
}

const load = (): Loaded => {
  let loaded!: Loaded;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const profile = require('./profile');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sync = require('./profileSync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const service = require('../services/profile');
    loaded = {
      readProfile: profile.readProfile,
      writeProfile: profile.writeProfile,
      startProfileSync: sync.startProfileSync,
      getServerProfileDefaults: service.getServerProfileDefaults as jest.Mock,
      updateServerProfileDefaults: service.updateServerProfileDefaults as jest.Mock,
    };
  });
  return loaded;
};

describe('startProfileSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pulls server values into the local profile, field by field', async () => {
    const m = load();
    m.getServerProfileDefaults.mockResolvedValue({
      typical_balance: '75000.00',
      monthly_card_spend: null,
      planned_loan_amount: '900000.00',
    });
    m.updateServerProfileDefaults.mockResolvedValue({});
    await m.startProfileSync();
    const profile = m.readProfile();
    expect(profile.balance).toBe(75000);
    expect(profile.loanAmount).toBe(900000);
    // A field the server leaves null keeps the local (default) value.
    expect(profile.monthlySpend).toBe(30000);
    expect(m.updateServerProfileDefaults).not.toHaveBeenCalled();
  });

  it('uploads local non-default numbers when the server has none', async () => {
    const m = load();
    m.writeProfile({ balance: 123456, monthlySpend: 30000, loanAmount: 500000 });
    m.getServerProfileDefaults.mockResolvedValue({
      typical_balance: null,
      monthly_card_spend: null,
      planned_loan_amount: null,
    });
    m.updateServerProfileDefaults.mockResolvedValue({});
    await m.startProfileSync();
    expect(m.updateServerProfileDefaults).toHaveBeenCalledWith({
      typical_balance: '123456',
      monthly_card_spend: '30000',
      planned_loan_amount: '500000',
    });
  });

  it('does not upload when the local profile is still the defaults', async () => {
    const m = load();
    m.getServerProfileDefaults.mockResolvedValue({
      typical_balance: null,
      monthly_card_spend: null,
      planned_loan_amount: null,
    });
    m.updateServerProfileDefaults.mockResolvedValue({});
    await m.startProfileSync();
    expect(m.updateServerProfileDefaults).not.toHaveBeenCalled();
  });

  it('pushes later local edits to the server, debounced', async () => {
    const m = load();
    m.getServerProfileDefaults.mockResolvedValue({
      typical_balance: '50000.00',
      monthly_card_spend: '30000.00',
      planned_loan_amount: '500000.00',
    });
    m.updateServerProfileDefaults.mockResolvedValue({});
    await m.startProfileSync();
    m.updateServerProfileDefaults.mockClear();
    m.writeProfile({ balance: 88000, monthlySpend: 30000, loanAmount: 500000 });
    expect(m.updateServerProfileDefaults).not.toHaveBeenCalled();
    jest.advanceTimersByTime(700);
    await Promise.resolve();
    expect(m.updateServerProfileDefaults).toHaveBeenCalledWith({
      typical_balance: '88000',
      monthly_card_spend: '30000',
      planned_loan_amount: '500000',
    });
  });

  it('never throws when the server is unreachable', async () => {
    const m = load();
    m.getServerProfileDefaults.mockRejectedValue(new Error('offline'));
    await expect(m.startProfileSync()).resolves.toBeUndefined();
  });
});
