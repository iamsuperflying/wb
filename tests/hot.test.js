// ^https://api.weibo.cn/2/(video|statuses|search|profile)/(tiny_stream_video_list|container_timeline_hot|finder|container_discover|container_timeline|me) url script-response-body https://raw.githubusercontent.com/iamsuperflying/wb/master/index.js

const url = `https://api.weibo.cn/2/statuses/finder?gsid=_2A25OZolFDeRxGeVH6FYQ8C3Kyz-IHXVrNZuNrDV6PUJbkdB-LRKtkWpNT0oHthaXHKoO_QlMBBb6SoCrKoETPl_E&wm=3333_2001&launchid=10000365--x&b=0&from=10CB093010&c=iphone&networktype=wifi&v_p=90&skin=default&v_f=1&s=80485EB4&lang=en_US&ua=iPhone14,3__weibo__12.11.0__iphone__os16.2&sflag=1&ft=1&aid=01Azq9GX0G5L7pCQaT7wHNofJbTjdpdbynZPjts69UwgUgn38.&card_users_scroll_enable=1&lon=120.3006942610496&card211_enable=1&containerid=106003_-_type%3A25_-_filter_type%3Amineband&is_auto_scroll=1&sg_one_checkin_enable=1&card204_enable=1&sg_page_header_v2=1&oriuicode=10001344&luicode=10001344&is_winter_olympics_enable=1&sg_cp_template_enable=1&fid=106003_-_type%3A25_-_filter_type%3Amineband&tz=Asia%2FShanghai&card196_videolive_enable=1&profile_toolbar_refactor=1&sys_notify_open=0&enable_card208_hot_discuss=1&is_album_water_fall=1&card213_enable=1&count=20&uicode=10000011&sg_new_page_icon_enable=1&page=1&no_location_permission=0&search_other_channel=1&page_interrupt_enable=1&need_new_pop=1&lat=36.05034066982127&card199_realtime_enable=1&moduleID=pagecard&is_push_open=0&lfid=102803_ctg1_1780_-_ctg1_1780&search_eggs_ad_enable=1&sg_search_person_topic_card_c60_enable=1&card182_schedule_enable=1&extparam=seat%3D1%26filter_type%3Drealtimehot%26lcate%3D1001%26refresh_type%3D3%26position%3D%257B%2522objectid%2522%253A%25228008637020000000000%2522%252C%2522name%2522%253A%2522%255Cu9752%255Cu5c9b%2522%257D%26lon%3D120.3006942610496%26lat%3D36.05034066982127%26c_type%3D30%26cate%3D10103%26dgr%3D0%26region_relas_conf%3D0%26pos%3D0_0%26mi_cid%3D100103%26display_time%3D1667824622%26pre_seqid%3D1341388657&card159164_emoji_enable=1&sgpage_newprofile_enable=1&card145_multi_link_enable=1&st_bottom_bar_new_style_enable=1&refresh_type=0&sgtotal_activity_enable=1&pd_redpacket2022_enable=1&orifid=102803_ctg1_1780_-_ctg1_1780&p_profile_associated_tip_enable=1&image_type=heif&sg_wishing_well_enable=1&need_head_cards=0&location_accuracy=0&is_push_alert=1&show_cache_when_error=1&card210_grade_enable=1&client_key=1f010e1d88debcfa7ba76846859b9d4f&search_tab_mark_enable=1&ul_sid=3BB34120-5047-412B-98DB-57C55577E45E&ul_hid=D9A09829-6B89-4BE2-9419-716F61DAEE00&ul_ctime=1667824697427`;
const res = new RegExp(
  "^https?://m?api.weibo.c(n|om)/2/(cardlist|searchall|page|messageflow|statuses/(unread_)?friends(/|_)timeline|groups/timeline|statuses/(container_timeline|unread_hot_timeline|extend|video_mixtimeline|unread_topic_timeline)|profile/(me|container_timeline)|video/(community_tab|remind_info|tiny_stream_video_list)|checkin/show|!/live/media_homelist|comments/build_comments|container/get_item|search/(finder|container_timeline|container_discover))"
).test(url);

const res2 = new RegExp(
  "^https://api.weibo.cn/2/(video|statuses|search|profile)/(tiny_stream_video_list|container_timeline_hot|finder|container_discover|container_timeline|me)|(page)"
).test(url);

// ^https://api.weibo.cn/2/(video|statuses|search|profile)/(tiny_stream_video_list|container_timeline_hot|finder|container_discover|container_timeline|me)
console.log(res2);

const data = require("./hot.json")
function rwHotPage(pageData) {
  const blackList = ["李峋", "陈飞宇", "阿瑟", "命韵峋环"];
  pageData.cards = pageData.cards.map((card) => {
    card.card_group = card.card_group.filter(
      (group) => !blackList.some((keyword) => group.desc.includes(keyword))
    );
    return card;
  });
  return pageData;
}

const pageData = rwHotPage(data);
debugger
console.log(data);
