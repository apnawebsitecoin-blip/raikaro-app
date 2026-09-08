import type en from './en';
type T = Record<keyof typeof en, string>;

const bn: T = {
  tab_home:    'হোম',
  tab_deals:   'ডিলস',
  tab_wallet:  'ওয়ালেট',
  tab_refer:   'রেফার',
  tab_account: 'অ্যাকাউন্ট',

  drawer_section_menu:    'মেনু',
  drawer_section_shop:    'শপ ও সেভ',
  drawer_section_support: 'সহায়তা',

  drawer_home:          'হোম',
  drawer_wallet:        'ওয়ালেট ও ক্যাশব্যাক',
  drawer_refer:         'রেফার করুন ও আয় করুন',
  drawer_account:       'আমার অ্যাকাউন্ট',
  drawer_wishlist:      'উইশলিস্ট',
  drawer_notifications: 'বিজ্ঞপ্তি',
  drawer_all_deals:     'সব ডিলস',
  drawer_top_stores:    'টপ ক্যাশব্যাক স্টোর',
  drawer_blog:          'গাইড ও ব্লগ',
  drawer_write_review:  'রিভিউ লিখুন',
  drawer_help:          'সাহায্য ও সহায়তা',
  drawer_sign_in:       'সাইন ইন / অ্যাকাউন্ট তৈরি করুন',
  drawer_logout:        'লগ আউট',

  btn_shop_now:       'এখনই কিনুন',
  btn_sign_in:        'সাইন ইন',
  btn_create_account: 'অ্যাকাউন্ট তৈরি করুন',
  btn_logout:         'লগ আউট',
  btn_subscribe:      'সাবস্ক্রাইব করুন',

  heading_featured:        'ফিচার্ড ডিলস',
  heading_shop_earn:       'শপ করুন ও ক্যাশব্যাক পান',
  heading_categories:      'বিভাগ',
  heading_recently_viewed: 'সম্প্রতি দেখা',
  heading_how_it_works:    'এটি কীভাবে কাজ করে',

  member_label:  'Raikaro সদস্য',
  guest_user:    'অতিথি ব্যবহারকারী',
  guest_tagline: 'ক্যাশব্যাক পেতে সাইন ইন করুন',

  lang_picker_title: 'ভাষা বেছে নিন',
};

export default bn;
