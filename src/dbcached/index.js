/**
 * 带redis缓存的mongodb数据操作,注意事项:
 * 1. 数据库映射
 * 2. 单表增删改查,不做关联表的查询. 关联表的查询分多次操作进行. (存疑???)
 * 3. 单表均有_id字段作为标识
 *
 * 增删改查中用到的redis-key,共有如下类型: key的类型: 单条数据d、列表数据s、单条查询w、条数查询c
 * 1. 单条数据d: key为"<模块名>_d:<_id>",值为json,使用hmset方式存入redis.
 *   如: { key: 'user_d:2', value: {id:2,...} }
 * 2. 列表数据s: retrieve获得，分两部分存储，实体和列表，列表是一个有序集合,内容为id数组,score为数据的排序,key为"<模块名>_s:<json_encode(查询条件)>"。如：
 *   列表值：{ key: 'product_s:{category:2}', value:[_id1,_id2,_id3,_id4,_id5]}
 *   数据值为上面单条d类型
 * 3. 单条查询w: getOne获得，分两部分存储，查询条件及id或id组合(与列表数据s差不多)。
 *   查询条件：{ key: 'product_s:{code:21232}', value:['2']}
 *   数据值为上面单条d类型
 * 4. 条数查询c: 与列表数据查询几乎一致，只是返回条数。
 *   例子: { key: 'product_c:{status:2}', value:'200'}
 *
 * 数据访问时序问题(包含redis中key删除更新时机问题.以下以product中_id为10为例)
 * 1. 查询单条记录(根据id查询或根据条件查询,id查询也会转成条件查询)
 *  + 首先从redis中找key为"product_s:{_id:10}"的值,找到则继续找key为"product_d:10"的值,找到则返回.
 *  + 未找到则从数据库中去找,找到就更新到redis中"product_s:{_id:10}"和"product_d:10",并返回.
 *  + 未从数据库中找到,则直接返回空.
 * 2. 创建记录.
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 一些逻辑判断,比如是否可以创建,一般根据条件判断是否有相同的记录存在.(可调用上面查询单个接口)
 *  + 确认可以创建记录后,到数据库创建记录.
 *  + 查询刚创建的记录(调用上面查询单条记录方法,key自动会进入redis)
 *  + 返回记录.
 * 3. 更新记录(一般更新某一条id的记录).
 *  + 首先做参数检查,参数不合法直接退回.
 *  + 计算或整理得到查询条件{x:xxx1,y:yyy1,z:zzz1}.
 *  + 一些逻辑判断,比如是否可以更新,一般先获取原记录,判断字段权限等.(可调用上面查询单个接口)
 *  + 确认可以更新记录后,到数据库更新记录.
 *  + 将数据库中更新的记录*强制更新*到redis中.key为"product_d:10"和"product_s:{_id:10}"或"product_s:<查询条件>"
 *  + 返回记录
 * 4. 删除记录(一般删除某一条id的记录).
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如是否可以删除,一般先获取原记录,判断权限等.(可调用上面查询单个接口)
 *  + 确认可以删除后,先删除redis中"product_d:10"或"product_s:<查询条件>"
 *  + 删除数据库中记录.
 * 5. 查询多条记录.
 *  + 首先做参数检查
 *  + 一些逻辑判断,比如判断权限,此人可显示字段等.
 *  + 计算或整理得到查询条件where:{x:xxx1,y:yyy1,z:zzz1},排序条件sort,populate信息,分页信息limit/skip,
 *  + 从redis中根据查询条件"product_s:{x:xxx1,y:yyy1,z:zzz1}"获取值,有则根据分页信息limit/skip及总数得到当前分页应该返回的内容.
 *  + 如果redis中没有相应内容,则进行数据库查询,并添加进product_s:{x:xxx1,y:yyy1,z:zzz1}有序集合中.
 *  + 返回结果数据.
 * 6. 批量更新记录(后台使用:根据条件更新一系列记录)
 * 7. 批量删除记录(后台使用:根据条件删除一系列记录)
 *
 * 数据查询的redis缓存穿透问题:
 * 某个时刻某个查询结果不在redis中,若此刻很多人同时请求此查询,则所有人都将直接查询数据库,这就是缓存穿透.
 * 而创建/更新/删除请求必然会进行到数据库层,并且一般都是一人操作,所以不会有此问题.
 * 穿透的情况:
 * 1. 突然间很多请求访问一个不存在redis键,触发频繁访问数据库.
 * 2.
 *
 * redis数据与mongodb中数据一致性问题:
 * 1. 当创建/删除时,在redis中的列表查询数据还是旧的,需要有一套机制更新这些查询.
 *  --- 相关模块的s型查询需要更新,如何更新?根据where和sort条件(是否要包含populate条件)构建查询,
 *  --- 遍历其中元素score值,将score范围内的值都更新
 * 2. 当更新数据时,redis中还是旧数据. ---更新完数据后,强制更新d类型相关id数据.
 *
 *
 */

export {
  _retrieve,
  _count,
  _createOne,
  _deleteOne,
  _updateOne,
  _createMany,
  _updateMany,
  _deleteOneById,
  _updateOneById,
  _findOne,
  _findOneById,
  delRedisKey,
  _getFirstOfRetrieve
} from './ops';

// timelyCheck
export { emitRedisUpdateEvent } from './mqExpire';
