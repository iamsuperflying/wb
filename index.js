const version = "1.0.0.39";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

let body = $response.body;
let url = $request.url;

let blackList = [];

// 读取 iCloud 中的配置
let filePath = "/wb/black-list.json";
let readUint8Array = $iCloud.readFile(filePath);
if (!readUint8Array) {
  console.log("NO");
} else {
  let textDecoder = new TextDecoder();
  let readContent = textDecoder.decode(readUint8Array);
  blackList = JSON.parse(readContent);
  console.log(blackList);
}

// 时间线
const timeline = /\/groups\/timeline/.test(url);
// 新的首页时间线
const containerTimeline = /\/statuses\/container_timeline/.test(url);
// 热搜词条点击后的列表
const searchall = /\/searchall/.test(url);

// 推荐
const recommend = new RegExp("statuses/container_timeline_hot").test(url);
// statuses
// 发现页热搜
const discoverRefresh = new RegExp("search/container_timeline").test(url);
const discoverReplace = new RegExp("search/container_discover").test(url);
const discover = new RegExp("search/finder").test(url);
// 热搜
const hotPage = new RegExp("/page").test(url);
// 其他人的 profile 页
const profileTimeline = new RegExp("profile/container_timeline").test(url);
// 我的
const profileMe = new RegExp("profile/me").test(url);
// 视频
const videoList = new RegExp("video/tiny_stream_video_list").test(url);
// 评论
const comment = new RegExp("comments/build_comments").test(url);

const noop = (items) => items;

// 是否是广告标识
const IS_AD_FLAGS = /广告|热推/;
// card_type === 118 为图片轮播广告
// card_type === 207 为各种赛程比分广告
// card_type === 19 为小图标广告
// card_type === 22 为图片广告
const AD_CARD_TYPES = /118|207|19|22/;
// 卡片标识
const CARD = "card";
// 信息流标识
const FEED = "feed";

const DISCOVER_TITLE = "发现";
const DISCOVER_EN_TITLE = "Discover";

const DISCOVER_IMAGE =
  "https://images.unsplash.com/photo-1542880941-1abfea46bba6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1827&q=80";
// 某项是否有广告标识
const isAdFlag = IS_AD_FLAGS.test.bind(IS_AD_FLAGS);

const isString = (item) => item && typeof item === "string";

const safeIncludes = (source, target) => {
  if (!isString(source) || !isString(target)) return false;
  return source.includes(target);
};

const isBlack = (target) => {
  if (!isString(target)) return false;
  return blackList.some(target.includes.bind(target));
};

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

const rwContainerTimeline = (data) => data.filter(isNormalTopic)

const rwTimeline = (data) => {
  // for (const s of ["ad", "advertises", "trends"]) {
  //   if (data[s]) {
  //     delete data[s];
  //   }
  // }
  // if (!data.statuses) {
  //   return;
  // }
  // let newStatuses = [];
  // for (const s of data.statuses) {
  //   if (!isAd(s)) {
  //     lvZhouHandler(s);
  //     if (!isBlock(s)) {
  //       newStatuses.push(s);
  //     }
  //   }
  // }
  // data.statuses = newStatuses;

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
    return !isAd;
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

const discoverItemsFilter = (payload) => {
  if (!payload && !payload.items) return payload;
  let { items } = payload;
  items = items
    .filter((item) => {
      if (!item) return false;
      const { data, category } = item;
      if (!data || !category) return true;
      if (category === CARD) {
        const { card_type } = data;
        return !AD_CARD_TYPES.test(card_type);
      }
      // category === 'feed' 为信息流
      // 此时判断是否为正常帖子
      if (category === FEED) {
        return isNormalTopic(item);
      }
      return true;
    })
    .map((item) => {
      const { data, category } = item;
      if (!data || !category || category !== CARD) return item;
      const { card_type, title, itemid, group } = data;
      if (card_type === 17 || title === "微博热搜" || itemid === "hotsearch") {
        item.data.group = group.filter(({ title_sub }) => !isBlack(title_sub));
      }
      return item;
    });
  payload.items = items;
  payload = rwChannelStyleMap(payload);
  return payload;
};

/**
 * @description: 移除发现页广告
 */
const rwDiscover = (data) => {
  if (!data) return data;
  // "热搜", "游戏" 不做保留
  const keep = [DISCOVER_TITLE];
  if (data.channelInfo && data.channelInfo.channels) {
    let { channels } = data.channelInfo;
    // 保留 发现
    channels = channels.filter(({ name }) => keep.includes(name));
    // map 发现
    channels = channels.map((channel) => {
      const { name, title, en_name } = channel;
      // 发现
      if (
        name === DISCOVER_TITLE ||
        title === DISCOVER_TITLE ||
        en_name === DISCOVER_EN_TITLE
      ) {
        channel.payload = discoverItemsFilter(channel.payload);
      }
      return channel;
    });

    data.channelInfo.channels = channels;
  }
  return data;
};

const rwDiscoverContainer = discoverItemsFilter;

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
          (id) => `100505_-_${id}`
        );
        item.items = item.items.filter(({ itemId }) => top4.includes(itemId));
        return item;
      }
      return item;
    });
}

const rwSearchAll = (data) => {
  if (!data) return data;
  const { cards } = data;
  if (!cards) return data;
  data.cards = cards.filter(({ mblog }) => {
    if (!mblog) return true;
    if (mblog.ad_state) return true;
    return isNormalTopic({ data: mblog });
  });
  return data;
}

function rwViewList(items) {
  return items.filter(isNormalTopic);
}

if (body) {
  let data = JSON.parse($response.body);

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
