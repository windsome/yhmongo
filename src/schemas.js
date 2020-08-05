import _debug from 'debug';
const debug = _debug('yh:mongo:schemas');
import { Schema } from 'mongoose';
import mongoose_delete from 'mongoose-delete';

/**
 * https://docs.mongodb.com/manual/tutorial/query-embedded-documents/
 */

/**
 * @api {GET} /apis/v1/rest/user 表User
 * @apiName Db-User
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  _id,
 * status //0:正常，1：注销，2：待审核（申请开通中）,3:审核失败
 * phone // 手机号，同时也是登录帐号
 * password
 * point // 鲨鱼币,鲨鱼币
 * heat // 热度,鲨气值
 * fee // 总消费资金数,以分为单位
 * // vip //是否vip,不再需要,直接通过vip起止时间判断用户是否为VIP会员.TODO:(目前发信暂时需要用VIP).
 * vipStartAt //vip开通时间
 * vipExpiredAt //vip结束时间
 * vipNumber // vip卡号.在某个范围内自增,遇到某些特殊号码略过并递增.
 * signature // 个性签名
 * desc: { // 额外描述信息
 *  birth //出生日期,不在wechat中.
 * }
 * wechat: {, //微信信息
 *  city: ""
 *  country: "阿尔及利亚"
 *  headimgurl: "http://thirdwx.qlogo.cn/mmopen/vi_32/LM0PAPLX34zst3FglSICnVmKJ4BxcIDICLJl9icmIkVSVJc5CdacthxOoQpU8KNEdlPj4GIhpcl1yib2ibSn0ap7A/132"
 *  language: "zh_CN"
 *  nickname: "羊小喵"
 *  openid: "op35F5yCt1Np9FduNz5QvAQ7LZWM"
 *  privilege: []
 *  province: ""
 *  scope: "snsapi_userinfo"
 *  sex: 2
 *  unionid: "oObNCs56ebKAkor8imt3HS-x5yM4"
 * }
 * silent // 禁言
 * stat { // 各种统计数字:
 *    签到数sign,
 *    打卡数checkin,
 *    登录数login,
 *    signAt最后签到时间,
 *    loginAt最后登录时间
 *    medal徽章个数
 *  }
 * gstat: { // 竞猜统计:
 *    updatedAt最后更新时间,用这个时间来判断是不是最后一周
 *    count总竞猜次数,
 *    total总获得鲨鱼币,
 *    finished总完成竞猜次数,
 *    win赢的次数,
 *    week周鲨鱼币,
 *    finishedWeek周完成竞猜次数,
 *    winWeek一周内赢的次数.
 *  }
 * medals // {徽章集合: 徽章id:获取时间, badge1:'2018-10-12 11:12:43' }
 * // badges // {徽章集合: 徽章id:获取时间, badge1:'2018-10-12 11:12:43' }
 * caps // 权限列表,全部用大写字母: [ROOT]
 * }
 */
export const User = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    phone: { type: String, index: true, default: '' },
    password: { type: String, default: '' },
    nickname: { type: String, default: '' },
    avatar: {
      type: String,
      default:
        'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1595940140523&di=efe0b817a19768f8263e18aecd5fdfaf&imgtype=0&src=http%3A%2F%2Fn.sinaimg.cn%2Fsinacn%2Fw640h640%2F20180203%2F100c-fyrcsrx3577030.jpg'
    },
    address: Schema.Types.Mixed,
    wechat: { type: String, default: '' },
    mybalance: Schema.Types.Mixed,
    focus :{type :Number ,default :0},
    fensi :{type :Number ,default :0},
    getZan :{type :Number ,default :0},
    msg: {type :Number ,default :0},
    level:{type :Number ,default :0},
    integral: {type :Number ,default :0},
    coin: {type :Number ,default :0},
    pAuc: {type :Number ,default :0},
    follow:{type :Number ,default :0},
    footPrint: {type :Number ,default :0},
  },
  {
    timestamps: true,
    versionKey: false
  }
);


/**
 * @api {GET} /apis/v1/rest/userbase 表Userbase
 * @apiName Db-Userbase
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 用户基本信息表,可暴露给任何用户.一般用在列表关联中使用。不存放隐私和频繁改动的数据
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  _id,
 * status // 0:正常，1：注销，2：待审核（申请开通中）,3:审核失败
 * num // 序号,用来做展示,不做关联. 默认从10000开始. 注册时自动生成,在原有最大值基础上加1.(去掉某些特殊规则的号码,比如豹子号).
 * nickname // 昵称
 * avatar // 头像
 * level // 级别:0~10
 * desc: { // 额外描述信息
 *  cover //个人中心封面
 * }
 * caps // 权限列表,全部用大写字母: [ROOT]
 * }
 */
export const Userbase = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    num: { type: Number, index: true, default: 0 },
    nickname: { type: String, default: '' },
    avatar: { type: String, default: ''},
    level:{type :Number ,default :0},
    desc: {type: Schema.Types.Mixed, default: null},
    caps: {type: Schema.Types.Mixed, default: null},
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * @api {GET} /apis/v1/rest/userextend 表Userextend
 * @apiName Db-Userextend
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 用户扩展信息表,一般只暴露给本人和超级管理员. _id与userbase表相同,一般在创建userbase表记录的同时创建一条userextend表记录.
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  _id, // 同Userbase的id.
 * phone // 用户真实电话.
 * password: { // 密码
 * vphone // 虚拟手机号.
 * address: [ // 收货地址列表. 其中ismain表示默认地址
      {
        name: '张三',
        phone: '15519634856',
        district: [
          { id: 10000, name: '安徽省' },
          { id: 100001, name: '黄山市' },
          { id: 1000011, name: '歙县' }
        ],
        address: '新安路16号',
        postcode: '245200',
        ismain: 1
      }
 * ]
 * wechat: {// 微信相关信息,
 *   openid,
 *   unionid,
 *   ... // 其他用户详细信息: head_image, sex, ...
 * }
 * wallet: {// 个人钱包信息,
 *   amount, // 钱包余额.
 *   withdrawType, // 提现类型:0无,1银行卡,2支付宝,3微信支付
 *   ...withdraw // 提现信息, 银行账号/开户行/户名;支付宝账号;微信账号;不同提现手段字段不同.
 * }
 * stat: {// 统计相关,其中内容不确定,根据实际情况而定,有的系统无积分无金币等. 有很多关联的记录表,数据可能需要注意与记录表同步.
 *   points, // 积分数.
 *   coins, // 金币数.
 *   thumbup // 收到的点赞数量.
 *   focus // 关注收藏的数量.
 *   fans // 粉丝数量follow
 *   footprint // 足迹总数量
 *   auction // 参拍总数.
 *   //// 订单系列
 *   orderStatus{0:100,1:20,3:2} // 不同订单状态的数量 0:未付款,1:代发货,2:待收货,3:待评价,4:退货/售后...
 *   //// 优惠券系列
 *   couponStatus{0:10,1:2,2:3}, // 不同状态优惠券的数量 0: 未使用/可使用, 1: 已使用, 2: 已过期.
 * }
 * cert: {// 个人认证相关.
 *   idcardFront, // 身份证头像面.
 *   idcardBack, // 身份证国徽面.
 *   photo, // 头像照片.
 *   video // 一段眨眼摇头视频.
 * }
 */
export const Userextend = new Schema(
  {
    phone: { type: String, index: true, default: '' },
    password: { type: String, default: '' },
    vphone: { type: String, index: true, default: '' },
    address: Schema.Types.Mixed,
    wechat: Schema.Types.Mixed,
    wallet: Schema.Types.Mixed,
    stat: Schema.Types.Mixed,
    cert: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * @api {GET} /apis/v1/rest/shop 表shop
 * @apiName Db-shop
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 店铺表,一般所有信息都公开.
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  _id,
 * status // 店铺状态 0:正常，1：注销，2：待审核（申请开通中）,3:审核失败
 * num // 店铺序号,用来做展示,不做关联. 默认从10000开始. 注册时自动生成,在原有最大值基础上加1.(去掉某些特殊规则的号码,比如豹子号).
 * name // 店铺名称
 * brief // 店铺概要介绍
 * logo // 店铺logo
 * desc: { // 额外描述信息
 *  cover //店铺封面
 * }
 * level // 级别:0~10
 * goodShop // 是否优店.
 * stat: {// 统计相关,其中内容不确定,根据实际情况而定,有的系统无积分无金币等. 有很多关联的记录表,数据可能需要注意与记录表同步.
 *   fans // 粉丝数量follow(关注数量)
 *   //// 评分系列
 *   count // 总评分个数(可以从评分记录表中得到此店铺的总评分个数)
 *   express // 物流分
 *   goods // 商品评分
 *   serve // 服务评分
 *   //// 商品统计(用来计算各种率,根据订单及其中sku个数)
 *   saleCount // 卖出的sku总个数
 *   appeal // 申诉的sku个数
 *   appealRate // 申诉率
 *   // 违约率
 *   // 退货率
 *   // 总评分
 * }
 * cert: {// 企业认证相关
 *   guarantee // 保证金,以分为单位.
 *   license // 营业执照照片.
 *   pcert // 是否通过个人认证. 一般在创建时从个人认证中计算得到.
 *   quality // 是否为品质店铺.
 *   // 是否加入实物查验保障计划
 * }
 * owner // 店铺所有者.与User表id关联. 创建店铺时附带.
 * }
 */
export const Shop = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    num: { type: Number, index: true, default: 0 },
    name: { type: String, default: '' },
    brief: { type: String, default: ''},
    logo: { type: String, default: ''},
    desc: Schema.Types.Mixed,
    level:{type :Number ,default :0},
    goodShop:{type :Boolean ,default :false},
    cert: Schema.Types.Mixed,
    stat: Schema.Types.Mixed,
    owner: { type: Schema.Types.ObjectId, default: null },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * @api {GET} /apis/v1/rest/shopextend 表shopextend
 * @apiName Db-shopextend
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 店铺扩展表,一些动态改变的统计数据(一般需要放入队列中得到处理结果).
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  _id, // 同shop表.
 * stat: {// 统计相关,其中内容不确定,根据实际情况而定,有的系统无积分无金币等. 有很多关联的记录表,数据可能需要注意与记录表同步.
 *   fans // 粉丝数量follow(关注数量)
 *   //// 评分系列
 *   count // 总评分个数(可以从评分记录表中得到此店铺的总评分个数)
 *   express // 物流分
 *   goods // 商品评分
 *   serve // 服务评分
 *   //// 商品统计(用来计算各种率,根据订单及其中sku个数)
 *   saleCount // 卖出的sku总个数
 *   appeal // 申诉的sku个数
 *   appealRate // 申诉率
 *   // 违约率
 *   // 退货率
 *   // 总评分
 * }
 * payment: {// 店铺提现相关 (注意:真正成交(销售成功)的判断依据,为用户收货后7天,14天后无纠纷)
 *   //// 基本金额数据.(用订单的实际金额,不包含优惠券抵扣,即消费者实际支付的金额)
 *   realTotal // 从店铺开业至今的所有销售成功(真正成交)金额.
 *   paidTotal // 所有已付款订单总金额
 *   refund // 退款总金额
 *   withdrawn // 已提现总金额
 *   other // 额外的资金入账(优惠券由平台兑现,平台奖励等)
 *   //// 计算出的用于显示或者提现的金额
 *   balance // 账户余额(所有已付款paidTotal+other额外入账-提现的withdrawn-退款的refund)
 *   withdraw // 可提现金额(真正成交的金额realTotal+other额外入账-提现的withdrawn)
 * }
 * }
 */
export const Shopextend = new Schema(
  {
    stat: Schema.Types.Mixed,
    payment: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * @api {GET} /apis/v1/rest/product 表product(SPU商品描述表)
 * @apiName Db-product
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 商品表,
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 * _id,
 * status // 状态 0:草案状态/刚创建，1：已上架，2：已下架(对于单品拍卖的,卖出即为已下架)
 * type //商品类型 0:正常商品(一口价);1:拍品
 * title //商品展示标题
 * brief //商品描述
 * summary{ // 商品通用概述SPU的描述.
 *   images // 轮播图列表(同时是商品图片列表)
 *   texts // 文字列表
 *   service:[] // 服务保证: 全国包邮,七天退换等等
 * }
 * tags:[]  //商品标签: 翡翠/天然红/老坑
 * category:'' //所属分类: 商品分类
 * priceOrg //商品原始价格
 * price //商品实际价格
 * start //商品上架时间
 * expire //过期时间(显示为过期,不能再购买,需要将状态改成已下架,店家可以重新上架,过期时间一般为上架后3天/7天等)
 * share: { // 分享相关
 *   image  //分享商品时的分享图片
 *   brief  //商品分享时的描述信息
 *   url // 需要进入的页面url
 * }
 * stock //商品的库存数量
 * desc:{  //不同type有不同描述,目前主要针对拍品.type为1
 *   priceMini // 拍品底价,一般为0元起拍.
 *   priceSaled // 出售的价格, 判断是否卖出. >0表示卖出.
 *   priceUp //一次加价金额
 *   priceNow //目前出价价格
 *   count //加价次数
 * }
 * shop  //商品所属店铺id
 * owner // 店铺所有者.与User表id关联. 创建店铺时附带.
 * }
 */
export const Product = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    type: { type: Number, index: true, default: 0 },
    title:{type: String, default: ''},
    brief: { type: String, default: ''},
    summary: Schema.Types.Mixed,
    tags: Schema.Types.Mixed,
    category: Schema.Types.Mixed,
    priceOrg:{ type :Number ,default :0 },
    price:{ type :Number ,default :0 },
    start: Date,
    expire: Date,
    share: Schema.Types.Mixed,
    stock:{ type :Number ,default :0 },
    desc: Schema.Types.Mixed,
    shop: { type: Schema.Types.ObjectId, default: null },
    owner: { type: Schema.Types.ObjectId, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * @api {GET} /apis/v1/rest/order 表Order
 * @apiName Db-Order订单表
 * @apiDescription 购物及卡券一般过程:
 *  1. 商家创建一些卡券,目前有:vip兑换码vipcard(不需要与订单配合支付),满减券voucher(满50减5,指定商品有效,指定品类有效,指定店家有效,指定时间段有效)
 *  2. 用户浏览店铺或商品页里发现到卡券,点击领取,或者商家发消息/邮件给某些用户,其中带了卡券宣传页,用户点击领券.
 *  3. 前往购物页,点击卡券可以去往当前卡券对应的购物页,或者直接进入会员卡购买,商品购买页.
 *  4. 用户点击购买后,生成订单,填写或选择送货地址.
 *  5. 支付订单,用户选择支付手段组合,列出可选的卡券,可抵扣的鲨鱼币/现金,需支付的现金.
 *  6. 订单触发支付,将鲨鱼币扣除,卡券锁定,调起现金支付
 *  7. 支付失败或订单超时,订单关闭,退回卡券,鲨鱼币.
 *  8. 支付完成后,订单完成,根据商品类型做后续操作.如果是会员卡,则即刻生效.如果是商品,则通知管理员发货.
 *  9. 管理员给订单发货,并填写订单的快递单号.
 *  10. 客户收到货后,修改订单为完成状态,可以点评.
 *  11. 如果客户退货,根据退货规则退货.一般退现金,鲨鱼币,优惠券等.
 * 订单状态变化:
 * 草案 => 草案,等待支付(订单提交),买家关闭, 超时关闭
 * 等待支付 => 卖家关闭,买家关闭,买家支付完成(等待卖家发货),超时关闭,卖家修改支付金额(暂不支持)
 * 买家支付完成 => 卖家关闭(退款完成则订单结束),卖家已发货(物流中),买家取消订单(目前不支持,可与卖家协商)
 * 卖家已发货 => 买家已收货(确认收货), 超时自动收货(7天或更久)
 * 买家已收货 => 订单正常完成, 买家退货并寄出快递(订单完成后的7天或一个月内可退货)
 * 买家退货并寄出快递 => 卖家已收货(订单完成,退款,退鲨鱼币,退券), 买家发起系统仲裁中, 卖家发起仲裁
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 *  status //状态[0草案,1等待支付(已经设置关联商品信息,确认了商品信息),2支付完成(等待发货),3支付失败(某些情况取消等),4人工取消订单,5超时取消订单,6订单完成],
 *  buyer //订单购买者的id
 *  seller //卖家,方便查询
 *  shop //订单所属商铺的id
 *  payment //付款id,对应支付系统支付单,可能一个支付单对应多个订单.(用户在购物车中购买多款不同商家的商品时产生一个支付单,多个订单)(微信支付/支付宝/银行卡等信息存在于支付单中)
 *  products: {//订单商品信息 [{productID: 522222,number: 1,feeTotle: 99,fee: 90,}]
 *        [productId1]:{
 *          count购买个数,
 *          snapshot: { //商品快照,即下单时刻商品的所有信息,
 *            title, brief, summary, price, image
 *          }
 *          selection:{型号等具体参数},
 *          comment:留言,对选型的补充,可能买多件且每件型号不同.
 *          point抵扣积分,
 *          fee需支付金额,
 *          card: { //优惠券
 *            [cardId1]: 100 //本商品分摊到的抵扣面额为100分.
 *            [cardId2]: 200 //本商品分摊到的抵扣面额为100分.
 *          }
 *        },
 *        [productId2]:{...},
 *        ... 
 *  }
 *  desc: { //订单介绍,(需考虑购物车等集中支付的情况,如果购物车中有多个商家的商品,则拆分成多个订单,但可以是一个支付单)
 *      point: //总抵扣积分
 *      cards:{ //其他优惠券信息,不与商品关联的无差别优惠券等.
 *        [cardId1]: 1000 //该优惠券总面额为1000分.
 *        [cardId2]: 1000 //该优惠券总面额为10元
 *      }
 *      comment: //留言,
 *      address: //地址信息+联系人
 *      phone: 联系电话(可能不是自己,可能是收货人)
 *    },
 *  fee: // 最终计算后,总需支付金额
 *  reward {//订单产生的奖励{包含积分等},
 *    point //产生的积分,可能等于支付金额大小
 *    // 可能产生其他的.
 *  }
 *  paidAt //支付时间,
 *  createdAt //创建时间,
 *  updatedAt //更新时间
 * }
 */
export const Order = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    buyer :{ type: Schema.Types.ObjectId, default: null },
    seller :{ type: Schema.Types.ObjectId, default: null },
    shop :{ type: Schema.Types.ObjectId, default: null },
    payment :{ type: Schema.Types.ObjectId, default: null },
    products:Schema.Types.Mixed,
    desc: Schema.Types.Mixed,
    fee: { type: Number, default: 0 },
    reward: Schema.Types.Mixed,
    paidAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);


/**
 * @api {GET} /apis/v1/rest/room 表room(直播间信息表)
 * @apiName Db-room
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 直播间当前信息表,
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 * _id,
 * status // 状态 0: 未开播 1:正在直播
 * name // 直播间名字 同roomName
 * brief // 直播间简介,同玩物得志的roomIntroduce
 * image // 同roomImg
 * share: { // 分享相关
 *   image  //分享商品时的分享图片
 *   brief  //商品分享时的描述信息
 *   //url // 需要进入的页面url
 * }
 * live: { // 直播相关
 *   h5LiveUrl  //直播间H5页面地址
 *   h5PlayUrl  //H5直播流地址
 *   hlsTemplateUrl: { //不同分辨率直播流地址
 *     lhd:"https://live.wanwudezhi.com/wwdz/104332_lhd.m3u8",
 *     lsd,
 *     lud
 *   }
 *   rtmpPlayUrl: "rtmp://live.wanwudezhi.com/wwdz/104332",
 *   rtmpTemplateUrl: { // rtmp流地址.
 *     lhd:"rtmp://live.wanwudezhi.com/wwdz/104332_lhd",
 *     lsd,
 *     lud
 *   }
 * }
 * im: { //聊天室相关
 *   groupId
 * }
 * stat { //统计信息
 *   watch // 观看人数.
 *   rank // 排名,可能不在该表中,由后端在redis中暂存.
 * }
 * startTime  //直播的开始时间,最近一次直播开始的时间.
 * shop  //直播间所属店铺id
 * owner // 店铺所有者.与User表id关联. 创建店铺时附带. *
 * }
 */
export const Room = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    name:{type: String, default: ''},
    brief:{type: String, default: ''},
    image:{type: String, default: ''},
    share: Schema.Types.Mixed,
    live: Schema.Types.Mixed,
    im: Schema.Types.Mixed,
    stat: Schema.Types.Mixed,
    startAt: { type: Date, default: null },
    shop: { type: Schema.Types.ObjectId, default: null },
    owner: { type: Schema.Types.ObjectId, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);



/**
 * @api {GET} /apis/v1/rest/roomRecord 表Roomrecord(直播间记录表)
 * @apiName Db-Roomrecord
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 直播间记录表,
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 * _id,
 * room //直播间的id
 * startAt  //直播的开始时间
 * endAt //单次直播的结束时间
 * }
 */
export const Roomrecord = new Schema(
  {
    room: { type: Schema.Types.ObjectId, default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false
  }
);







/**
 * @api {GET} /apis/v1/rest/payment 表payment(付款记录表)
 * @apiName Db-payment
 * @apiGroup Database
 * @apiVersion 1.0.0
 * @apiDescription 付款记录表,
 * @apiContentType application/json
 * @apiParamExample {json} Request-Example:
 * {
 * _id,付款记录的id
 * status // 状态 0: 草案状态,刚建立付款单 1: 付款成功 2: 付款失败 
 * fee //付款单总金额
 * orders:[] // 付款单对应的订单id数组
 * type // 付款类型0: 银行卡支付 1:微信支付 2:支付宝支付
 * extend // 不同支付系统返回的支付结果,是否成功付款以及对应的原因
 * payer //付款的用户Id
 * payee //收款人的用户Id
 * shop //收款店铺ID
 * }
 */
export const Payment = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    fee: { type: Number, default: 0 },
    orders: Schema.Types.Mixed,
    type :{ type: Number, default: 0},
    extend: Schema.Types.Mixed,
    payer :{ type: Schema.Types.ObjectId, default: null },
    payee :{ type: Schema.Types.ObjectId, default: null },
    shop :{ type: Schema.Types.ObjectId, default: null },
 },
  {
    timestamps: true,
    versionKey: false
  }
);






// plugin delete.

User.plugin(mongoose_delete, { overrideMethods: true });

// schemas map.
export const SchemaMap = {
  User
};

export default SchemaMap;
