import type en from './en';
type T = Record<keyof typeof en, string>;

const ta: T = {
  tab_home:    'முகப்பு',
  tab_deals:   'சலுகைகள்',
  tab_wallet:  'பணப்பை',
  tab_refer:   'பரிந்துரை',
  tab_account: 'கணக்கு',

  drawer_section_menu:    'மெனு',
  drawer_section_shop:    'கடை & சேமிப்பு',
  drawer_section_support: 'ஆதரவு',

  drawer_home:          'முகப்பு',
  drawer_wallet:        'பணப்பை & கேஷ்பேக்',
  drawer_refer:         'பரிந்துரைத்து சம்பாதிக்கவும்',
  drawer_account:       'என் கணக்கு',
  drawer_wishlist:      'விருப்பப்பட்டியல்',
  drawer_notifications: 'அறிவிப்புகள்',
  drawer_all_deals:     'அனைத்து சலுகைகள்',
  drawer_top_stores:    'சிறந்த கேஷ்பேக் கடைகள்',
  drawer_blog:          'வழிகாட்டிகள் & வலைப்பதிவு',
  drawer_write_review:  'மதிப்பாய்வு எழுதுக',
  drawer_help:          'உதவி & ஆதரவு',
  drawer_sign_in:       'உள்நுழைக / கணக்கு உருவாக்குக',
  drawer_logout:        'வெளியேறு',

  btn_shop_now:       'இப்போதே வாங்கு',
  btn_sign_in:        'உள்நுழைக',
  btn_create_account: 'கணக்கு உருவாக்குக',
  btn_logout:         'வெளியேறு',
  btn_subscribe:      'சந்தா செலுத்துக',

  heading_featured:        'சிறப்பு சலுகைகள்',
  heading_shop_earn:       'கடை & கேஷ்பேக் சம்பாதிக்கவும்',
  heading_categories:      'வகைகள்',
  heading_recently_viewed: 'சமீபத்தில் பார்த்தவை',
  heading_how_it_works:    'இது எவ்வாறு செயல்படுகிறது',

  member_label:  'Raikaro உறுப்பினர்',
  guest_user:    'விருந்தினர் பயனர்',
  guest_tagline: 'கேஷ்பேக் பெற உள்நுழைக',

  lang_picker_title: 'மொழியை தேர்ந்தெடுக்கவும்',
};

export default ta;
