import type en from './en';
type T = Record<keyof typeof en, string>;

const hi: T = {
  tab_home:    'होम',
  tab_deals:   'डील्स',
  tab_wallet:  'वॉलेट',
  tab_refer:   'रेफर',
  tab_account: 'अकाउंट',

  drawer_section_menu:    'मेनू',
  drawer_section_shop:    'शॉप और बचत',
  drawer_section_support: 'सहायता',

  drawer_home:          'होम',
  drawer_wallet:        'वॉलेट और कैशबैक',
  drawer_refer:         'रेफर करें और कमाएं',
  drawer_account:       'मेरा अकाउंट',
  drawer_wishlist:      'विशलिस्ट',
  drawer_notifications: 'सूचनाएं',
  drawer_all_deals:     'सभी डील्स',
  drawer_top_stores:    'टॉप कैशबैक स्टोर्स',
  drawer_blog:          'गाइड्स और ब्लॉग',
  drawer_write_review:  'रिव्यू लिखें',
  drawer_help:          'मदद और सहायता',
  drawer_sign_in:       'साइन इन / अकाउंट बनाएं',
  drawer_logout:        'लॉग आउट',

  btn_shop_now:       'अभी खरीदें',
  btn_sign_in:        'साइन इन',
  btn_create_account: 'अकाउंट बनाएं',
  btn_logout:         'लॉग आउट',
  btn_subscribe:      'सब्सक्राइब करें',

  heading_featured:        'फीचर्ड डील्स',
  heading_shop_earn:       'शॉप करें और कैशबैक कमाएं',
  heading_categories:      'श्रेणियां',
  heading_recently_viewed: 'हाल ही में देखे गए',
  heading_how_it_works:    'यह कैसे काम करता है',

  member_label:  'Raikaro सदस्य',
  guest_user:    'अतिथि उपयोगकर्ता',
  guest_tagline: 'कैशबैक पाने के लिए साइन इन करें',

  lang_picker_title: 'भाषा चुनें',
};

export default hi;
