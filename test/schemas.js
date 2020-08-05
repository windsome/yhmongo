// DEBUG="app:*" node ./test_conns.js

require('babel-register');
const _debug = require('debug').default;
const debug = _debug('app:test:schemas');
const Schema = require('mongoose').Schema;
const mongoose_delete = require('mongoose-delete');

/**
 * @api {GET} /apis/v1/rest/user 表User
 * @apiName Db-User
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
const User = new Schema(
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

const Mark = new Schema(
  {
    status: { type: Number, index: true, default: 0 },
    author: {type: Schema.Types.ObjectId, default: null},
    table: { type: String, default: '' },
    target: {type: Schema.Types.ObjectId, default: null},
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// plugin delete.
User.plugin(mongoose_delete, { overrideMethods: true });

// schemas map.
export const schemas = {
  User,
  Mark
};
