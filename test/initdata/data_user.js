import md5sum from '../../src/utils/md5sum';

const PASSWORD = 'sharks2018';

export const data = [
  {
    nickname: 'root',
    phone: 'root',
    password: md5sum(PASSWORD)
  },
  {
    nickname: '李四',
    address: [
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
    ],
    wechat: 'openid/unionid',
    mybalance: {
      advertTotal: '0.00',
      balance: '0.00', //余额
      benefits: '0.00',
      commission: '0.00',
      couponNum: 9, //优惠券数量
      identifyBal: '0.00',
      identifySettle: '0.00',
      residue: '0.00',
      shopAuthStatus: 1,
      showAdvert: true
    },
    phone: '18815281234',
    password: md5sum(PASSWORD)
  },
  {
    nickname: '张三哥哥',
    address: [
      {
        name: '李四弟弟',
        phone: '15518934556',
        district: [
          { id: 10000, name: '安徽省' },
          { id: 100001, name: '黄山市' },
          { id: 1000011, name: '歙县' }
        ],
        address: '新安路61号',
        postcode: '245200',
        ismain: 1
      }
    ],
    wechat: 'openid/unionid',
    mybalance: {
      advertTotal: '0.00',
      balance: '0.00', //余额
      benefits: '0.00',
      commission: '0.00',
      couponNum: 9, //优惠券数量
      identifyBal: '0.00',
      identifySettle: '0.00',
      residue: '0.00',
      shopAuthStatus: 1,
      showAdvert: true
    },
    phone: '18815281256',
    password: md5sum(PASSWORD)
  },
  {
    nickname: '李四弟弟',
    address: [
      {
        name: '李四',
        phone: '15519634829',
        district: [
          { id: 10000, name: '安徽省' },
          { id: 100001, name: '黄山市' },
          { id: 1000011, name: '歙县' }
        ],
        address: '新安路116号',
        postcode: '245200',
        ismain: 1
      }
    ],
    wechat: 'openid/unionid',
    mybalance: {
      advertTotal: '0.00',
      balance: '0.00', //余额
      benefits: '0.00',
      commission: '0.00',
      couponNum: 9, //优惠券数量
      identifyBal: '0.00',
      identifySettle: '0.00',
      residue: '0.00',
      shopAuthStatus: 1,
      showAdvert: true
    },
    phone: '18815238965',
    password: md5sum(PASSWORD)
  }
];

export default data;
