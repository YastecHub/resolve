export const ICONS = {
  'nav.overview': 'dashboard-square-01',
  'nav.cases': 'folder-01',
  'nav.audit': 'audit-01',
  'nav.settings': 'settings-02',
  'nav.team': 'user-multiple',
  'nav.demo': 'play-circle',
  'nav.collapse': 'sidebar-left',

  'type.failed_transfer': 'money-send-circle',
  'type.duplicate': 'copy-01',
  'type.unauthorised': 'shield-alert',
  'type.non_delivery': 'package-remove',
  'type.legitimate': 'checkmark-circle-02',
  'type.unknown': 'help-circle',

  'provider.onprem': 'server-stack-01',
  'provider.hosted': 'cloud-server',

  'trace.model': 'artificial-intelligence-02',
  'trace.transaction': 'transaction',
  'trace.ledger': 'invoice-01',
  'trace.settlement': 'bank',
  'trace.device': 'smart-phone-01',
  'trace.customer': 'user',
  'trace.merchant': 'store-01',
  'trace.related': 'hierarchy',
  'trace.decision': 'file-validation',
  'trace.error': 'alert-circle',

  'common.search': 'search-01',
  'common.copy': 'copy-01',
  'common.check': 'tick-02',
  'common.chevron': 'arrow-down-01',
  'common.close': 'cancel-01',
  'common.sort': 'arrow-up-down',
  'common.filter': 'filter',
  'common.sun': 'sun-03',
  'common.moon': 'moon-02',
  'common.download': 'download-04',
  'common.sparkle': 'sparkles',
  'common.shield_check': 'shield-check',
  'common.shield_alert': 'shield-alert',
  'common.clock': 'clock-01',
  'common.warning': 'alert-02',
  'common.info': 'information-circle',
  'common.first': 'arrow-left-double',
  'common.prev': 'arrow-left-01',
  'common.next': 'arrow-right-01',
  'common.last': 'arrow-right-double',
  'common.logout': 'logout-01',
  'common.system': 'computer',
} as const;

export type IconKey = keyof typeof ICONS;

export const ICON_PREFIX = 'hugeicons';

export const ICON_SIZES = [16, 20, 24, 48] as const;
export type IconSize = (typeof ICON_SIZES)[number];

export function iconName(key: IconKey): string {
  return `${ICON_PREFIX}:${ICONS[key]}`;
}
