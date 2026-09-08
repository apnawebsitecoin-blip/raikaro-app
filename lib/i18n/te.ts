import type en from './en';
type T = Record<keyof typeof en, string>;

const te: T = {
  tab_home:    'హోమ్',
  tab_deals:   'డీల్స్',
  tab_wallet:  'వాలెట్',
  tab_refer:   'రిఫర్',
  tab_account: 'అకౌంట్',

  drawer_section_menu:    'మెనూ',
  drawer_section_shop:    'షాప్ & సేవ్',
  drawer_section_support: 'మద్దతు',

  drawer_home:          'హోమ్',
  drawer_wallet:        'వాలెట్ & క్యాష్‌బ్యాక్',
  drawer_refer:         'రిఫర్ చేసి సంపాదించండి',
  drawer_account:       'నా అకౌంట్',
  drawer_wishlist:      'విష్‌లిస్ట్',
  drawer_notifications: 'నోటిఫికేషన్లు',
  drawer_all_deals:     'అన్ని డీల్స్',
  drawer_top_stores:    'టాప్ క్యాష్‌బ్యాక్ స్టోర్లు',
  drawer_blog:          'గైడ్స్ & బ్లాగ్',
  drawer_write_review:  'రివ్యూ రాయండి',
  drawer_help:          'సహాయం & మద్దతు',
  drawer_sign_in:       'సైన్ ఇన్ / అకౌంట్ సృష్టించండి',
  drawer_logout:        'లాగ్ అవుట్',

  btn_shop_now:       'ఇప్పుడే కొనండి',
  btn_sign_in:        'సైన్ ఇన్',
  btn_create_account: 'అకౌంట్ సృష్టించండి',
  btn_logout:         'లాగ్ అవుట్',
  btn_subscribe:      'సబ్‌స్క్రైబ్ చేయండి',

  heading_featured:        'ఫీచర్డ్ డీల్స్',
  heading_shop_earn:       'షాప్ చేసి క్యాష్‌బ్యాక్ సంపాదించండి',
  heading_categories:      'విభాగాలు',
  heading_recently_viewed: 'ఇటీవల చూసినవి',
  heading_how_it_works:    'ఇది ఎలా పని చేస్తుందో',

  member_label:  'Raikaro సభ్యుడు',
  guest_user:    'అతిథి వినియోగదారు',
  guest_tagline: 'క్యాష్‌బ్యాక్ పొందడానికి సైన్ ఇన్ చేయండి',

  lang_picker_title: 'భాష ఎంచుకోండి',
};

export default te;
