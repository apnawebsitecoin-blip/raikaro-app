import type en from './en';
type T = Record<keyof typeof en, string>;

const mr: T = {
  tab_home:    'मुख्यपृष्ठ',
  tab_deals:   'डील्स',
  tab_wallet:  'वॉलेट',
  tab_refer:   'रेफर',
  tab_account: 'अकाउंट',

  drawer_section_menu:    'मेनू',
  drawer_section_shop:    'शॉप आणि बचत',
  drawer_section_support: 'सहाय्य',

  drawer_home:          'मुख्यपृष्ठ',
  drawer_wallet:        'वॉलेट आणि कॅशबॅक',
  drawer_refer:         'रेफर करा आणि कमवा',
  drawer_account:       'माझे अकाउंट',
  drawer_wishlist:      'विशलिस्ट',
  drawer_notifications: 'सूचना',
  drawer_all_deals:     'सर्व डील्स',
  drawer_top_stores:    'टॉप कॅशबॅक स्टोअर्स',
  drawer_blog:          'मार्गदर्शन आणि ब्लॉग',
  drawer_write_review:  'रिव्यू लिहा',
  drawer_help:          'मदत आणि सहाय्य',
  drawer_sign_in:       'साइन इन / अकाउंट तयार करा',
  drawer_logout:        'लॉग आउट',

  btn_shop_now:       'आत्ता खरेदी करा',
  btn_sign_in:        'साइन इन',
  btn_create_account: 'अकाउंट तयार करा',
  btn_logout:         'लॉग आउट',
  btn_subscribe:      'सदस्यता घ्या',

  heading_featured:        'वैशिष्ट्यीकृत डील्स',
  heading_shop_earn:       'शॉप करा आणि कॅशबॅक कमवा',
  heading_categories:      'श्रेणी',
  heading_recently_viewed: 'अलीकडे पाहिलेले',
  heading_how_it_works:    'हे कसे कार्य करते',

  member_label:  'Raikaro सदस्य',
  guest_user:    'अतिथी वापरकर्ता',
  guest_tagline: 'कॅशबॅक मिळवण्यासाठी साइन इन करा',

  lang_picker_title: 'भाषा निवडा',
};

export default mr;
