# 项目 API 列表

本项目没有自建 HTTP API。这里列的是微博客户端发出的请求中，项目脚本实际处理的接口，以及相关拦截规则。仓库里的 JSON 文件是响应样本。

**Apifox 录入范围**：正式接口只保留 17 条有对应处理代码的微博接口，统一按 POST 录入。POST 是本次录入约定；项目规则没有限定请求方式，也没有定义完整参数、鉴权方式或 HTTP 返回码。下文的“配置中启用”只表示规则未被注释，不代表已在设备上验证。

## Loon 主插件：有专门处理逻辑

这些路径在 [`index.plugin`](index.plugin) 中有未注释的响应拦截规则，脚本也有对应处理分支。`/2/` 路径主要使用 `api.weibo.cn`；第一条通用规则还匹配 `mapi.weibo.com`。

| 接口路径 | 页面或用途 | 脚本实际处理 |
| --- | --- | --- |
| `/2/groups/allgroups` | 首页分组 | 调整默认页和分组列表；`loon.js` |
| `/2/groups/timeline` | 关注时间线 | 过滤 `statuses` 中的广告并清理部分字段；`loon.js` |
| `/2/searchall` | 搜索结果 | 过滤 `cards`、`items` 中的广告；`loon.js` |
| `/2/page` | 热搜页 | 按脚本内的词语黑名单过滤 `cards[].card_group`；`loon.js` |
| `/2/search/finder` | 发现页 | 已知旧格式保留原有频道处理；其他格式保留频道，只清理明确标记的广告；`loon.js` |
| `/2/search/container_timeline` | 发现页刷新 | 过滤卡片、信息流广告等；`loon.js` |
| `/2/search/container_discover` | 发现页内容 | 同上；`loon.js` |
| `/2/comments/build_comments` | 评论列表 | 过滤广告、相关内容和空项；`loon.js` |
| `/2/profile/me` | “我的”页面 | 只保留指定模块，并处理会员入口；`loon.js` |
| `/2/video/tiny_stream_video_list` | 视频列表 | 过滤 `items` 中带广告标识的内容；`loon.js` |
| `/2/statuses/extend` | 微博扩展信息 | 删除 `head_cards`、`trend`、`follow_data`；`loon.js` |
| `/2/users/show?…` | 用户信息 | 改写 `vvip`、`svip`、`followers_count`；`loon.js`。主规则要求路径后有 `?` |
| `/2/push/active` | 全局配置 | 清理明确标记的广告浮窗，保留其他配置；`push-active.js` |
| `/2/statuses/container_timeline` | 首页新时间线 | 过滤广告信息流并清理部分推广字段；`statuses.js` |
| `/2/statuses/container_detail_comment` | 微博详情评论 | 过滤广告评论和趋势广告项；`statuses.js` |
| `/2/statuses/container_detail` | 微博详情 | 清理推广字段和底部广告卡片；`statuses.js` |
| `/2/profile/container_timeline` | 个人页时间线 | 过滤 `feed` 类广告；`profile.js` |

配置依据：`index.plugin:16,19,22,25,31,38`。处理依据：`loon.js` 中的 `isLegacyFinderFlow`、`filterFinderAds` 和响应入口，以及 `statuses.js:307-345`、`profile.js:100-116`、`push-active.js:13-40`。

## 只被规则匹配的路径

`index.plugin:16` 的一条规则还覆盖好友时间线、未读时间线、卡片列表、消息流等路径。比如 `statuses/(unread_)?friends(/|_)timeline` 会匹配四种写法，但 `loon.js` 没有分别处理这四种写法。它们是**匹配范围**，不是四条已经确认的接口，因此不在 Apifox 中逐条建立接口。完整匹配范围以 `index.plugin:16` 为准。

## 开屏广告拦截规则

这些地址用于拦截开屏广告，记录在规则说明中，不列入 17 条有独立处理代码的微博接口。

| 域名 | 路径 | 当前配置和处理 |
| --- | --- | --- |
| `*.uve.weibo.com` | `/v{数字}/ad/preload` | `index.plugin:44` 和 `launch/launch.conf:4` 均有规则；`launch/launch-guard.js` 清空 `ads` 并调整间隔 |
| `*.uve.weibo.com` | `/wbapplua/wbpullad.lua` | 同上，脚本清空 `cached_ad.ads` |
| `wbapp.mobile.sina.cn` | `/wbapplua/wbpullad.lua` | `index.plugin:47` 和 `launch/launch.conf:7` 均有规则；同上 |

另有三条规则在 Loon 主插件 `index.plugin:50-52` 中**被注释**，但写在独立的 `launch/launch.conf:10-12` 中：`*.uve.weibo.com/interface/sdk/sdkad.php`、`mi.gdt.qq.com/gdt_mview.fcg`、`tqt.weibo.cn/api/fortune/decisionMaker`。后两者不在 `launch/launch.conf:1` 的 MITM 域名列表里，单独使用该配置时不能据此认定响应改写会生效。

## Quantumult X 配置中的接口

| 配置 | 匹配范围 | 当前情况 |
| --- | --- | --- |
| `quanx/index.conf:4` | 微博 `/2/{groups,video,statuses,search,profile,comments}/…`，以及 `page`、`searchall` | 脚本 URL 指向仓库根目录的 `index.js`；本仓库只有 `quanx/index.js`，所以不能按当前仓库确认其可加载。该正则也不能当成所有组合均有处理逻辑的 API 契约 |
| `quanx/index.conf:7` | `/2/ad/*` | 直接拒绝请求，不运行响应处理脚本 |
| `quanx/index.conf:10` | `/2/statuses/container_detail_comment` | 指向仓库存在的 `statuses.js`，与 Loon 清单重复 |
| `quanx/modify_request.conf:11` | `/2/statuses/container_timeline` | 请求体改写规则；脚本 URL 指向仓库根目录的 `modify_request.js`，实际文件位于 `quanx/modify_request.js` |

`quanx/modify_request.js:12-58` 会把请求体中的 `preAdInterval`、`preMarkInterval` 设为 `999`，把 `feedDynamicEnable`、`enable_flow_stagger` 设为 `0`。配置简介写 `preAdInterval=0`，与代码不一致。Loon 主插件中的同类请求规则在 `index.plugin:41` 已被注释。

## 只在代码或样本中出现

- `loon.js` 有 `/2/statuses/container_timeline_hot`、`/2/profile/userinfo` 的识别和处理代码，但 Loon 主插件没有把这两个路径交给它。`/2/profile/container_timeline` 则由独立的 `profile.js` 处理。
- `apis/` 下的 `search_finder.json`、`unread.json`、`push_active.json`、`user_show.json` 是本地响应样本；`unread` 不能仅凭文件名当成已配置的接口，`push_active` 由 Loon 插件单独处理。
- `loon.html` 和 `loon_user_show.html` 各自读取对应的本地 JSON 供测试，没有实现向微博发送请求的 API 客户端。
