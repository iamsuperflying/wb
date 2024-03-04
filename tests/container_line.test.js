const fs = require("fs");
const containerLine = require("../container_line.json");

const DISCOVER_IMAGE = ""

// 热搜标识
const GROUP = "group";
// 信息流标识
const FEED = "feed";
// 卡片标识
const CARD = "card";

const AD_CARD_TYPES = /19|22|118|207|208/;

function isBlack(target) {
  return false;
}

function isNormalTopic (item) {
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

function rwChannelStyleMap (payload) {
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

function rwDiscoverContainer(payload) {
  if (!payload || !payload.items) return payload;
  // 推荐搜索过滤
  if (payload.loadedInfo) {
    payload.loadedInfo.searchBarContent =
      payload.loadedInfo.searchBarContent.filter(({ note }) => !isBlack(note));
  }

  // const rmHotItem = (args) => {
  //   const { category, data } = args;
  //   if (!category || !data) return true;
  //   if (category !== CARD) return true;
  //   const { card_type } = data;
  //   return !AD_CARD_TYPES.test(card_type);
  // };

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

      /**
       * !(category === GROUP && (!!item.items || !!data.items)) &&
       */
      return (
        !(category === CARD && AD_CARD_TYPES.test(card_type)) &&
        !(category === FEED && !isNormalTopic(item))
      );
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

  return rwChannelStyleMap(payload);
}

const data = rwDiscoverContainer(containerLine);
// 写入文件
fs.writeFileSync("./container_line.json", JSON.stringify(data, null, 2));
console.log(data);