const version = "0.0.3";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

let body = $response.body;
const url = $request.url;

const blackList = [
  "贾玲",
  "热辣滚烫",
  "乐莹",
  "谢娜",
  "中医",
  "DeepSeek",
  "肖战",
  "射雕",
  "侠之大者",
  "汪小菲",
  "大S",
  "具俊晔",
];

// 分组
const groups = /\/groups\/allgroups/.test(url);
// 时间线
const timeline = /\/groups\/timeline/.test(url);
// 新的首页时间线
const containerTimeline = /\/statuses\/container_timeline/.test(url);
// 热搜词条点击后的列表
const searchall = /\/searchall/.test(url);

// 推荐
const recommend = /\/statuses\/container_timeline_hot/.test(url);
// statuses
// 发现页热搜
const discoverRefresh = /\/search\/container_timeline/.test(url);
const discoverReplace = /\/search\/container_discover/.test(url);
const discover = /\/search\/finder/.test(url);
// 热搜
const hotPage = /\/page/.test(url);
// 其他人的 profile 页
const profileTimeline = /\/profile\/container_timeline/.test(url);
// 其他人的页面 / 新
const userinfo = /\/profile\/userinfo/.test(url);
// 我的
const profileMe = /\/profile\/me/.test(url);
// 视频
const videoList = /\/video\/tiny_stream_video_list/.test(url);
// 评论
const comment = /\/comments\/build_comments/.test(url);
// 我的某条微博
const extend = /\/statuses\/extend/.test(url);
// 用户信息
const userShow = /\/users\/show/.test(url);

const noop = (items) => items;

// 是否是广告标识
const IS_AD_FLAGS = /广告|热推/;
// card_type === 118 为图片轮播广告
// card_type === 207 为各种赛程比分广告
// card_type === 19 为小图标广告
// card_type === 22 为图片广告
// card_type === 208 为热聊
const AD_CARD_TYPES = /19|22|118|207|208/;
// 分隔标识
const CELL = "cell";
// 卡片标识
const CARD = "card";
// 信息流标识
const FEED = "feed";
// 热搜标识
const GROUP = "group";

const DISCOVER_TITLE = "发现";
const DISCOVER_EN_TITLE = "Discover";

const DISCOVER_IMAGE =
  "https://images.unsplash.com/photo-1542880941-1abfea46bba6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1827&q=80";
// 某项是否有广告标识
const isAdFlag = IS_AD_FLAGS.test.bind(IS_AD_FLAGS);

const isString = (item) => item && typeof item === "string";

// **********************
try {
  if (typeof [].forEach === "function") {
    console.log("forEach 是一个函数");
  } else {
    console.log("forEach 不是一个函数或未定义");
  }
} catch (e) {
  console.error("函数执行出错:", e);
}
// **********************

const safeIncludes = (source, target) => {
  if (!isString(source) || !isString(target)) return false;
  // target 和 source 转换为小写
  return target.toLowerCase().indexOf(source.toLowerCase()) !== -1;
};

const isBlack = (target) =>
  blackList.some((item) => safeIncludes(item, target));

function isNormalFeedTopic(category, item) {
  const feed = category === FEED;
  return feed ? isNormalTopic(item) : !feed;
}

function promiseItems(data) {
  return new Promise((resolve, reject) => {
    if (data && data.items) {
      resolve(data.items);
    } else {
      reject("data is null");
    }
  });
}

function promiseStatuses(data) {
  return new Promise((resolve, reject) => {
    if (data && data.statuses) {
      resolve(data.statuses);
    } else {
      reject("data is null");
    }
  });
}

/**
 * @description: 区分不同的 url
 */
function diffUrl() {
  if (containerTimeline) {
    return rwContainerTimeline;
  } else if (profileTimeline | recommend) {
    return rwProfile;
  } else if (profileMe) {
    return rwProfileMe;
  } else if (videoList) {
    return rwViewList;
  } else {
    return noop;
  }
}

/**
 * 是否是正常的帖子
 * @param {Object} item 帖子, 包含 data 或者 item 属性
 * @returns  {Boolean} true: 正常帖子, false: 广告帖子
 */
const isNormalTopic = (item) => {
  const topic = item.data || item;
  // item.data.mblogtypename === '广告'
  // item.data.content_auth_info.content_auth_title === '广告' | '热推'
  // item.data.promotion.recommend === '广告' | '热推
  const { mblogtypename, content_auth_info, promotion } = topic;
  if (mblogtypename) {
    return !isAdFlag(mblogtypename);
  } else if (content_auth_info) {
    return !isAdFlag(content_auth_info.content_auth_title);
    // return (
    //   content_auth_info.content_auth_title !== "广告" &&
    //   content_auth_info.content_auth_title !== "热推"
    // );
  } else if (promotion) {
    return !isAdFlag(promotion.recommend) && promotion.type !== "ad";
    // return promotion.recommend !== "广告" && promotion.recommend !== "热推";
  } else {
    return true;
  }
};

const rwContainerTimeline = (data) =>
  data.filter(isNormalTopic).map((topic) => {
    delete topic.data.extend_info;
    delete topic.data.common_struct;
    delete topic.data.pic_bg_scheme;
    return topic;
  });

const rwTimeline = (data) => {
  data.statuses = data?.statuses?.filter(isNormalTopic).map((status) => {
    delete status.extend_info;
    delete status.common_struct;
    // 测试是否可删除卡片背景
    delete status.pic_bg_scheme;
    return status;
  });

  return data;
};

/**
 * 移除热搜页面广告 & 黑名单
 * @param {*} pageData
 * @returns
 */
function rwHotPage(pageData) {
  pageData.cards = pageData.cards.map((card) => {
    card.card_group = card.card_group.filter(({ desc }) => !isBlack(desc));
    return card;
  });
  return pageData;
}

/**
 * @description: 移除评论
 * @param {*} items
 */
function rwComments(data) {
  if (!data || !data.datas) return data;

  data.lack = 1;
  data.max_id = 0;
  data.max_id_str = "0";

  // 001OutQmly1h8eswmmhe1j60zo0qy46i02

  // data.status?.source_type = 1;
  if (data.status) {
    data.status.source_type = 1;
    delete data.status.ad_state;

    if (data.status.pic_infos) {
      let { pic_infos } = data.status;
      Object.keys(pic_infos).forEach((key) => {
        pic_infos[key].pic_status = 0;
      });

      data.status.pic_infos = pic_infos;
    }
  }
  // delete data.tip_msg,
  data.datas = data.datas.filter((item) => {
    const { type, commentAdSubType, commentAdType, adType } = item;
    const isAd =
      type === 1 ||
      commentAdSubType === 1 ||
      commentAdType === 1 ||
      isAdFlag(adType);
    // 相关内容
    const is5 = type === 5 || commentAdType === 5 || adType === "相关内容";
    // 空评论
    const is6 = type === 6;
    return !isAd && !is5 && !is6;
  });
  return data;
}

/**
 * 重写发现页背景图
 * @param {Object} payload 发现页数据, 可能包含 loadedInfo 属性
 */
const rwChannelStyleMap = (payload) => {
  if (payload?.loadedInfo?.headerBack?.channelStyleMap) {
    let { channelStyleMap } = payload.loadedInfo.headerBack;
    Object.keys(channelStyleMap).forEach((key) => {
      const { data } = channelStyleMap[key];
      if (data) {
        data.backgroundImage = DISCOVER_IMAGE;
        data.backgroundDarkImage = DISCOVER_IMAGE;
      }
      channelStyleMap[key].data = data;
    });
    payload.loadedInfo.headerBack.channelStyleMap = channelStyleMap;
  }
  return payload;
};

/**
 * 现在的微博热搜结构
 * payload > items
 * 微博热搜和广告在第一个 item
 */
const discoverItemsFilter = (payload) => {
  if (!payload && !payload.items) return payload;

  const rmHotItem = (args) => {
    const { category, data } = args;
    if (!category || !data) return true;
    if (category !== CARD) return true;
    const { card_type } = data;
    return !AD_CARD_TYPES.test(card_type);
  };

  let { items } = payload;
  items = items
    // 这个判断是新的热搜
    .map((item) => {
      const { data, category } = item;
      if (!data || !category || category !== GROUP) return item;
      // if (!data || !category || category !== CARD) return item;
      const { card_type, title, itemid, group } = data;
      if (card_type === 17 || title === "微博热搜" || itemid === "hotsearch") {
        item.data.group = group.filter(({ title_sub }) => !isBlack(title_sub));
      }

      const { items } = item;
      if (!items) return item;
      item.items = items.filter(rmHotItem);
      return item;
    })
    .filter((item) => {
      if (!item) return false;
      const { data, category } = item;
      if (!data || !category) return true;
      /// 这个判断是旧的热搜
      if (category === CARD) {
        const { card_type } = data;
        return !AD_CARD_TYPES.test(card_type);
      }
      // category === 'feed' 为信息流
      // 此时判断是否为正常帖子
      // if (category === FEED) {
      //   return isNormalTopic(item);
      // }
      // return true;
      return isNormalFeedTopic(category, data);
    });
  payload.items = items;
  payload = rwChannelStyleMap(payload);
  return payload;
};

/**
 * 移除 category 为 card 的广告
 */
const rmCardAd = (payload) => {
  if (!payload || payload.category !== CARD || !payload.data) return payload;

  /** 目前是中文广告 */
  const { card_type } = payload.data;
  /** 1. 从 card_type 中判断是否为广告 */
  const isAd = AD_CARD_TYPES.test("" + card_type);

  console.log("isAd", isAd);
  console.log("card_type", card_type);

  if (isAd) return null;

  /** 2. 从 data 中判断是否为广告 */
  /**
   * 2.1 promotion 字段：
   * 如果 data 对象中包含 promotion 字段，通常表示这是一个广告卡片。promotion 字段通常包含广告的监控链接等信息。
   */
  // const { promotion } = payload.data;
  // if (promotion) return null;
  // /** 2.2 adid 字段： */
  // const { adid } = payload.data;
  // if (adid) return null;

  // 从 data 中判断是否有 group 字段
  const { group } = payload.data;
  if (group) {
    function isAdHotSearch(item) {
      // 条件1: 存在promotion节点且包含监测链接
      const hasPromotion = item.promotion?.monitor_url?.length > 0;

      // 条件2: action_log.ext包含ads_word或adid
      const hasAdKeyword = /(ads_word|adid:\d+)/.test(
        item.action_log?.ext || "",
      );

      // 条件3: scheme链接包含广告参数
      const hasAdScheme =
        item.scheme?.includes("source=is_ad") ||
        item.scheme?.includes("topic_ad=1");

      // 条件4: itemid格式为adid:数字
      const hasAdItemId = /^adid:\d+$/.test(item.itemid || "");

      return hasPromotion || hasAdKeyword || hasAdScheme || hasAdItemId;
    }

    payload.data.group = group.filter((item) => {
      return !isAdHotSearch(item) && !isBlack(item.title_sub);
    });
  }

  /** 3. 处理 data.items 中的频道卡片广告（如轮播卡片） */
  const { items } = payload.data;
  if (items && Array.isArray(items)) {
    payload.data.items = items.filter((item) => {
      if (!item) return false;

      // 检查 sub_item 中的广告标识
      const { sub_item } = item;
      if (sub_item) {
        // 过滤视频广告: ad_videoinfo 字段
        if (sub_item.ad_videoinfo) {
          console.log("过滤视频广告: ad_videoinfo");
          return false;
        }

        // 过滤推广内容: promotion 字段
        if (sub_item.promotion) {
          console.log("过滤推广频道: promotion");
          return false;
        }
      }

      return true;
    });
  }

  return payload;
};

/**
 * 移除 category 为 feed 的广告
 */
const rmFeedAd = (payload) => {
  if (!payload || payload.category !== FEED || !payload.data) return payload;
  const { data } = payload;
  const {
    is_id,
    ad_state,
    mblogtypename,
    content_auth_info,
    ad_actionlogs,
    promotion_info,
    readtimetype,
    timestamp_text,
  } = data;

  /** 1. 从 is_id 中判断是否为广告 */
  if (is_id === 1 || ad_state === 1) return null;

  /** 2. 从 mblogtypename 中判断是否为广告 */
  /** 2.1 从 mblogtypename 中判断是否为广告, 目前: mblogtypename === '广告' */
  if (mblogtypename) return null;
  /** 3. 从 content_auth_info 中判断是否为广告 */
  if (content_auth_info) {
    const { content_auth_title, actionlog } = content_auth_info;
    if (
      content_auth_title === "广告" ||
      (actionlog && actionlog.source === "ad")
    )
      return null;
  }
  /** 4. 从 ad_actionlogs 中判断是否为广告 */
  if (ad_actionlogs) {
    return null;
  }
  /** 5. 从 promotion_info 中判断是否为广告 */
  if (promotion_info) {
    const { display_text } = promotion_info;
    if (display_text === "推荐内容") return null;
  }

  /**
   * 6. 从 readtimetype 中判断是否为广告
   * mblog：普通微博内容
   * adMblog：广告内容
   * video：视频内容
   * live：直播内容
   * article：文章内容
   */
  if (readtimetype === "adMblog") return null;

  /** 7. 从 timestamp_text 中判断是否为广告 */
  if (timestamp_text === "推荐内容") return null;
  return payload;
};

/**
 * 移除 category 为 group 的广告
 */
const rmGroupAd = (payload) => {
  console.log("rmGroupAd...");
  if (!payload || payload.category !== GROUP || !payload.items) return payload;
  payload.items.forEach((item, index, array) => {
    console.log("rmGroupAd item block");
    const { category } = item;
    if (category === CELL) {
      return null;
    }

    if (category === CARD) {
      array[index] = rmCardAd(item);

      // 递归处理 CARD 中的 data.items[] 结构
      const processedItem = array[index];
      if (processedItem && processedItem.data && processedItem.data.items) {
        processedItem.data.items = processedItem.data.items.filter(
          (subItem) => {
            if (!subItem) return false;

            // 递归处理嵌套的 CARD
            if (subItem.category === CARD) {
              const filtered = rmCardAd(subItem);
              if (!filtered) return false;
              Object.assign(subItem, filtered);
            }

            // 递归处理嵌套的 FEED
            if (subItem.category === FEED) {
              const filtered = rmFeedAd(subItem);
              if (!filtered) return false;
              Object.assign(subItem, filtered);
            }

            return true;
          },
        );
      }
    }

    if (category === FEED) {
      array[index] = rmFeedAd(item);
    }
  });
  payload.items = payload.items.filter(Boolean);
  return payload;
};

/**
 * 移除发现(热搜)页广告
 * 广告信息的位置：
 * promotion 字段：在 searchBarContent 数组中，某些对象包含 promotion 字段，这表示这些内容是广告。例如：
 * 老乡鸡送出12万份鸡汤
 * #今晚8点 京东年货最后一波放价#
 * #恋爱脑程序员修成正果#
 * adid 字段：在 ext 字段中，adid 表示广告的唯一标识符。例如：
 * adid:273447（老乡鸡送出12万份鸡汤）
 * adid:273435（京东年货最后一波放价）
 * adid:271875（恋爱脑程序员修成正果）
 * @param {*} payload 发现页数据
 * @returns 发现页数据
 */
function rwDiscoverContainer(payload) {
  if (!payload || !payload.items) return payload;
  // 推荐搜索过滤
  if (payload.loadedInfo) {
    payload.loadedInfo.searchBarContent =
      payload.loadedInfo.searchBarContent.filter(({ note, promotion, ext }) => {
        const _isB = !isBlack(note);
        const _isAd = ext.includes("adid");
        return _isB || !promotion || _isAd;
      });
  }

  /**
   *
   * card_type 的可能类型如下：
   * 101：通常用于表示热搜卡片或标题卡片，包含热搜话题、广告等内容。
   * 17：可能用于表示热搜列表卡片，包含多个热搜话题的列表。
   * 119：通常用于表示广告卡片，包含广告内容、图片或视频等。
   * 118：可能用于表示广告窗口卡片，包含多个广告子项。
   * 264：通常用于表示趋势卡片，包含趋势话题及其相关信息。
   */

  // const rmHotItem = (args) => {
  //   const { category, data } = args;
  //   if (!category || !data) return true;
  //   if (category !== CARD) return true;
  //   const { card_type } = data;
  //   return !AD_CARD_TYPES.test(card_type);
  // };

  payload.items.forEach((item, index, array) => {
    const { data, category, items: groupItems } = item;
    if (!category) return;
    // 分隔标识, 不会包含广告
    if (category === CELL) return;

    // 热搜
    if (category === GROUP) {
      array[index] = rmGroupAd(item);
    }
  });

  payload.items = payload.items.filter(Boolean);

  /**
  payload.items = payload.items
    .filter((item) => {
      if (!item) return false;
      const { data, category } = item;
      // if (!data || !category) return true;
      const { card_type, items } = data || {};
      /// 182: 热门人物啥的

      if (category === GROUP) {
        return !(!!item.items || !!items);
      }

      // return (
      //   !(category === CARD && AD_CARD_TYPES.test(card_type)) &&
      //   !(category === FEED && !isNormalTopic(item))
      // );
    })
    .map((item) => {
      if (item.category !== CARD) return item;
      // if (!item.data || !item.data.group || item.data.card_type !== 17)
      //   return item;
      if (!item.data || !item.data.group) return item;
      item.data.group = item.data.group.filter(
        ({ title_sub }) => !isBlack(title_sub)
      );
      return item;
    });

    */
  return rwChannelStyleMap(payload);
}

/**
 * @description: 移除发现页广告
 */
const rwDiscover = (data) => {
  if (!data) return data;
  // "热搜", "游戏" 不做保留
  const keep = [DISCOVER_TITLE];

  if (data.header) {
    data.header.params = {
      square_bigday_enable: false,
      square_new_bigday_enable: false,
    };
  }
  if (data.header && data.header.data) {
    data.header.data = rwDiscoverContainer(data.header.data);
  }

  if (!data.channelInfo) return data;

  data.channelInfo.moreChannels = [];

  const keepChannels = [
    "discover_channel",
    "hot_reposts_channel",
    "qa_channel",
  ];

  if (data.channelInfo.channels) {
    data.channelInfo.channels = data.channelInfo.channels.filter((channel) => {
      return keepChannels.includes(channel.key);
    });
  }
  // if (data.channelInfo && data.channelInfo.channels) {
  //   let { channels } = data.channelInfo;
  //   // 保留 发现
  //   channels = channels
  //     .filter(({ name }) => keep.includes(name))
  //     .map((channel) => {
  //       const { name, title, en_name } = channel;
  //       // 发现
  //       if (
  //         name === DISCOVER_TITLE ||
  //         title === DISCOVER_TITLE ||
  //         en_name === DISCOVER_EN_TITLE
  //       ) {
  //         // channel.payload = discoverItemsFilter(channel.payload);
  //         channel.payload = rwDiscoverContainer(channel.payload);
  //       }
  //       return channel;
  //     });

  //   data.channelInfo.channels = channels;
  // }
  return data;
};

/**
 * @description: 解析 profile 页
 */
function rwProfile(items) {
  return items.filter(isNormalTopic);
}

/**
 * @description: 解析我的
 */
function rwProfileMe(items) {
  const filtereds = [
    "profileme_mine",
    "100505_-_top8",
    "100505_-_recentlyuser",
    "100505_-_manage",
  ];

  return items
    .filter(({ itemId }) => filtereds.includes(itemId))
    .map((item) => {
      if (item.itemId === "profileme_mine") {
        if (item.header && item.header.vipView) {
          item.header.vipView = null;
        }
      }

      if (item.itemId === "100505_-_top8") {
        const top4 = ["album", "like", "watchhistory", "draft"].map(
          (id) => `100505_-_${id}`,
        );
        item.items = item.items.filter(({ itemId }) => top4.includes(itemId));
      }

      return item;
    });
}

const rwSearchAll = (data) => {
  if (!data) return data;
  const { cards, items } = data;
  data.cards = cards?.filter(({ mblog }) => {
    if (!mblog) return true;
    if (mblog.ad_state) return false;
    return isNormalTopic(mblog);
  });

  data.items = items?.filter((item) => {
    console.log("category");
    return isNormalFeedTopic(item.category, item);
  });

  return data;
};

function rwViewList(items) {
  return items.filter(isNormalTopic);
}

function rwExtend(data) {
  if (!data || !data["head_cards"]) return data;
  data.head_cards = [];
  delete data.head_cards;
  // 疑似广告
  data.trend = {};
  delete data.trend;
  // 测试移除关注 toast
  data.follow_data = {};
  delete data.follow_data;
  return data;
}

function rwUserinfo(data) {
  if (!data || !data.footer) return data;
  let { items, servicePopup, style } = data.footer.data.toolbar_menus_new;
  const filteredsToolbar = (item) =>
    ["toolbar_follow", "toolbar_serve"].includes(item.type);
  items = items.filter(filteredsToolbar);

  servicePopup.subData.data = [];
  servicePopup.durationTime = 0;
  const filteredsData = (item) => item.header.text === "其他";
  const filteredsService = (item) => ["投诉", "拉黑"].includes(item.text);
  servicePopup.allData.data = servicePopup.allData.data
    .filter(filteredsData)
    .map((item) => {
      item.items = item.items.filter(filteredsService);
      return item;
    });

  data.footer.data.toolbar_menus_new = {
    style,
    items,
    servicePopup,
  };
  return data;
}

function owUserShow(payload) {
  payload.vvip = 1;
  payload.svip = 1;
  payload.followers_count = 100000000;
  return payload;
}

function rwProfileTimeline(data) {
  if (!data || !data.loadedInfo || !data.loadedInfo.follow_guide_info) {
    return data;
  }
  delete data.loadedInfo.follow_guide_info;
  return data;
}

/**
 * 处理微博首页分组数据
 * @param {Object} data - 原始分组数据
 * @returns {Object} 处理后的分组数据
 */
function processGroupsData(data) {
  const homeFeed = "homeFeed";
  const homeHot = "homeHot";
  const timelineGid = "4235641627355405"; // TimeLine 的 gid

  // 1. 设置默认页面为"关注"
  data.defaultPageId = homeFeed;
  data.feed_default = 0; // 0 = 关注, 1 = 推荐
  data.pageDatasType = 10;

  // 2. 过滤顶层 pageDatas: 只保留"关注"和"推荐"
  data.pageDatas = data.pageDatas
    .filter(
      ({ pageDataTitle, pageDataType, pageId }) =>
        [homeFeed, homeHot].includes(pageDataType) ||
        [homeFeed, homeHot].includes(pageId) ||
        ["关注", "推荐"].includes(pageDataTitle),
    )
    .map((page) => {
      // 只处理"关注"页
      if (page.pageId === homeFeed && page.pageDataType === homeFeed) {
        return processHomeFeedCategories(page, timelineGid);
      }
      return page;
    });

  return data;
}

/**
 * 处理关注页的分类数据
 * @param {Object} page - 关注页数据
 * @param {String} timelineGid - TimeLine 的 gid
 * @returns {Object} 处理后的关注页数据
 */
function processHomeFeedCategories(page, timelineGid) {
  const keepCategories = ["默认分组", "我的分组"];
  const keepDefaultGroupItems = ["全部关注", "好友圈"];
  let timelineGroup = null;

  // 1. 过滤 categories: 只保留"默认分组"和"我的分组"
  page.categories = page.categories
    .filter((category) => keepCategories.includes(category.title))
    .map((category) => {
      // 处理"默认分组"
      if (category.title === "默认分组") {
        category.pageDatas = category.pageDatas.filter(({ title }) =>
          keepDefaultGroupItems.includes(title),
        );
      }

      // 从"我的分组"中提取 TimeLine
      if (category.title === "我的分组") {
        const index = category.pageDatas.findIndex(
          (g) => g.gid === timelineGid,
        );
        if (index !== -1) {
          timelineGroup = category.pageDatas.splice(index, 1)[0];
          // 🔑 关键修改: 添加 navigation_title 字段
          timelineGroup.navigation_title = "关注";
          // 备选: 完全模拟"全部关注"（如果第一步不生效）
          // timelineGroup.type = 1;
          // timelineGroup.sysgroup = 2;
          // timelineGroup.ad_scene = 1;
        }
      }

      return category;
    });

  // 2. 将 TimeLine 插入到"默认分组"第一位
  if (timelineGroup) {
    const defaultCategory = page.categories.find((c) => c.title === "默认分组");
    if (defaultCategory) {
      defaultCategory.pageDatas.unshift(timelineGroup);
    }
  }

  return page;
}

if (body) {
  let data = JSON.parse(body);

  try {
    // 1. 首页 时间线
    if (timeline) {
      data = rwTimeline(data);
    }

    // 2. 我的页面
    if (profileMe) {
      // 1. 移除广告
      // delete data.vipHeaderBgImage;
    }

    // 3. 移除热搜
    if (hotPage) {
      data = rwHotPage(data);
    }

    // 4. 移除评论区的广告
    if (comment) {
      data = rwComments(data);
    }

    // 5. 移除发现页面的广告
    if (discover) {
      data = rwDiscover(data);
    }
    if (discoverRefresh) {
      data = rwDiscoverContainer(data);
    }
    if (discoverReplace) {
      data = rwDiscoverContainer(data);
    }

    // 6. 移除热搜某词条下的广告
    if (searchall) {
      data = rwSearchAll(data);
    }
    // 7. 移除我的某条微博的广告
    if (extend) {
      data = rwExtend(data);
    }

    // 8. 别人的微博
    if (userinfo) {
      data = rwUserinfo(data);
    }
    // 9. 别人的微博
    if (profileTimeline) {
      data = rwProfileTimeline(data);
    }
    // 10. 分组
    if (groups) {
      data = processGroupsData(data);
    }

    if (userShow) {
      data = owUserShow(data);
    }
  } catch (error) {
    console.log("[ error ] >", error);
  }

  promiseItems(data)
    .then((items) => {
      const rw = diffUrl();
      data.items = rw(items);
      $done({ body: JSON.stringify(data) });
    })
    .catch((_error) => {
      $done({ body: JSON.stringify(data) });
    });

  promiseStatuses(data)
    .then((statuses) => {
      const rw = diffUrl();
      data.statuses = rw(statuses);
      $done({ body: JSON.stringify(data) });
    })
    .catch((_error) => {
      $done({ body: JSON.stringify(data) });
    });
} else {
  $done({});
}
