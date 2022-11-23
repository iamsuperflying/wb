const response = require("../datas/search:finder/搜索页.json");
const DISCOVER_TITLE = "发现";
const DISCOVER_EN_TITLE = "Discover";
const CARD = "card";
// 信息流标识
const FEED = "feed";
const AD_CARD_TYPES = [19, 22, 118, 207];
// 是否是广告标识
const IS_AD_FLAGS = /广告|热推/;
// 某项是否有广告标识
const isAdFlag = IS_AD_FLAGS.test.bind(IS_AD_FLAGS);
const DISCOVER_IMAGE = "https://tva1.sinaimg.cn/large/007S8ZIlgy1gjz5q2q2qjj30u00u0q5y.jpg";

console.log('[ isAdFlag ] >', isAdFlag('1广1告'))

const blackList = [];

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
        return !AD_CARD_TYPES.includes(card_type);
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
        item.data.group = group.filter(({ title_sub }) => {
          // title_sub 为热搜关键词
          return !blackList.some(title_sub.includes.bind(title_sub));
        });
      }
      return item;
    });
  payload.items = items;

  if (
    payload.loadedInfo &&
    payload.loadedInfo.headerBack &&
    payload.loadedInfo.headerBack.channelStyleMap
  ) {
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
 * @description: 移除发现页广告
 */
const rwDiscover = (data) => {
  if (!data) return data;
  // "热搜", "游戏" 不做保留
  const keep = [DISCOVER_TITLE];
  if (data.channelInfo && data.channelInfo.channels) {
    let { channels } = data.channelInfo;
    // 保留 发现
    channels = channels.filter((channel) => {
      return keep.includes(channel.name);
    });
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

const data = rwDiscover(response);
console.log('[ data ] >', data)