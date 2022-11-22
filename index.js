const version = "1.0.0.25";
const proxy_name = "Weibo Ad Block";
console.log(`${proxy_name}: ${version}`);

let body = $response.body;
let url = $request.url;

let blackList = [];

// 读取 iCloud 中的配置
let filePath = "/wb/black-list.json";
let readUint8Array = $iCloud.readFile(filePath);
if (readUint8Array === undefined) {
  console.log("NO");
} else {
  let textDecoder = new TextDecoder();
  let readContent = textDecoder.decode(readUint8Array);
  blackList = JSON.parse(readContent);
  console.log(blackList);
}

// 推荐
const recommend = new RegExp("statuses/container_timeline_hot").test(url);
// statuses
// 热搜
const hot = new RegExp(
  "search/(finder|container_timeline|container_discover)"
).test(url);
// 发现页
const discoverRefresh = new RegExp("search/container_timeline").test(url);
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
const IS_AD_FLAGS = ["广告", "热推"];
// card_type === 118 为图片轮播广告
// card_type === 207 为各种赛程比分广告
// card_type === 19 为小图标广告
// card_type === 22 为图片广告
const AD_CARD_TYPES = [19, 22, 118, 207];
// 卡片标识
const CARD = "card";
// 信息流标识
const FEED = "feed";

// 某项是否有广告标识
const isAdFlag = (item) => IS_AD_FLAGS.some((flag) => item.includes(flag));

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
  if (hot) {
    return rwHotItems;
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

/**
 * 移除热搜页面广告 & 黑名单
 * @param {*} pageData
 * @returns
 */
function rwHotPage(pageData) {
  pageData.cards = pageData.cards.map((card) => {
    card.card_group = card.card_group.filter((group) => {
      if (!group.desc) {
        return true;
      }
      return !blackList.some((keyword) => group.desc.includes(keyword));
    });
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

const discoverItemsFilter = (payload) => {
  if (!payload) return payload;
  let { items } = payload;
  if (!items) return payload;
  items = items.filter((item) => {
    if (!item) return false;
    const { data, category } = item;
    if (!data || !category) return true;
    if (category === CARD) {
      const { card_type } = data;
      return !AD_CARD_TYPES.includes(card_type);
    }
    // category === 'feed' 为信息流
    // 此时判断是否为正常帖子
    if (category === FEED) {
      return isNormalTopic(item);
    }
    return true;
  });
  payload.items = items;
  return payload;
};

/**
 * @description: 移除发现页广告
 */
const rwDiscover = (data) => {
  if (!data) return data;
  const keep = ["发现", "热搜", "游戏"];
  if (data.channelInfo && data.channelInfo.channels) {
    let { channels } = data.channelInfo;
    // 保留 发现/热搜/游戏
    channels = channels.filter((channel) => {
      return keep.includes(channel.name);
    });
    // map 发现/热搜/游戏
    channels = channels.map((channel) => {
      const { name, title, en_name } = channel;
      if (name === "发现" || title === "发现" || en_name === "Discover") {
        channel.payload = discoverItemsFilter(channel.payload);
      }
      return channel;
    });

    data.channelInfo.channels = channels;
  }

  // 移除广告 card_type: 22
  // 热搜底下的图片广告

  return data;
}

const rwDiscoverRefresh = discoverItemsFilter;

/**
 * @description: 热搜页面
 */
function rwHotItems(items) {
  // "card_type": 118, // 118: 轮播图
  // "card_type": 19, // 19: 热聊/找人/热议/直播/本地......
  return items
    .map((item) => {
      if (item.category !== "card") return item;

      if (item.data && item.data.title && item.data.title === "微博热搜") {
        // 过滤热搜
        item.data.group = item.data.group.filter(({ title_sub }) => {
          return !blackList.some((keyword) => title_sub.includes(keyword));
        });
      }
      return item;
    })
    .filter((item) => {
      if (item.category === "card") {
        return item.data["card_type"] !== 118 && item.data["card_type"] !== 19;
      }
      // 热搜信息流
      else if (item.category === "feed") {
        return isNormalTopic(item);
      } else {
        return true;
      }
    });
  // .map((item) => {
  //   if (item.card_type === 17 || item.title === "微博热搜") {
  //     item.group = item.group.filter((groupItem) => {
  //       const blackList = ["李峋", "陈飞宇", "阿瑟", "命韵峋环"];
  //       return blackList.some(
  //         (keyword) =>
  //           groupItem.title_sub.concat(keyword) ||
  //           groupItem.item_log.key.concat(keyword)
  //       );
  //     });
  //   }
  //   return item;
  // });
}

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
    .filter((item) => {
      return filtereds.includes(item.itemId);
    })
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
        item.items = item.items.filter((topItem) => {
          return top4.includes(topItem.itemId);
        });
        return item;
      }
      return item;
    });
}

function rwViewList(items) {
  return items.filter(isNormalTopic);
}

if (body) {
  var data = JSON.parse($response.body);

  /// 我的页面
  if (profileMe) {
    // 1. 移除广告
    // delete data.vipHeaderBgImage;
  }

  // 2. 移除热搜
  if (hotPage) {
    data = rwHotPage(data);
  }

  // 3. 移除评论区的广告
  if (comment) {
    data = rwComments(data);
  }

  // 4. 移除发现页面的广告
  if (discover) {
    data = rwDiscover(data);
  }
  if (discoverRefresh) {
    data = rwDiscoverRefresh(data);
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
