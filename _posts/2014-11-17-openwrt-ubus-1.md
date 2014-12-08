---
layout: post
title: "ubus [1] - ubusd"
date: 2014-11-17
category: openwrt
tags: openwrt ubus
---

## ubusd
### 数据结构

```c
struct ubus_msg_buf {
	uint32_t refcount; /* ~0: uses external data buffer */
	struct ubus_msghdr hdr;
	struct blob_attr *data;
	int fd;            /** 发送msg端进程传过来的fd，用于UBUS_MSG_STATUS消息 */
	int len;
};

struct ubus_client {
	struct ubus_id id;
	struct uloop_fd sock;

	struct list_head objects;

	struct ubus_msg_buf *tx_queue[UBUSD_CLIENT_BACKLOG];
    /**
     * txq_cur  - tx队列未处理头结点
     * txq_tail - tx队列可用结点头
     * txq_ofs  - 当前结点已发送offset
     */
	unsigned int txq_cur, txq_tail, txq_ofs;

	struct ubus_msg_buf *pending_msg;
	int pending_msg_offset;
	int pending_msg_fd;     /** 对端进程传过来的fd */
	struct {
		struct ubus_msghdr hdr;
		struct blob_attr data;
	} hdrbuf;                /** 报文格式头 */
};

struct ubus_path {
	struct list_head list;
	const char name[];
};
```

### 处理流程
`ubusd`启动时自动调用初始化函数`ubusd_obj_init(void)`分别创建**objects**、**obj_types**、**path**三个AVL tree头节点，同时调用`ubusd_event_init()`函数初始化**patterns** AVL tree头节点，创建**event_obj**全局事件对象，对象ID等于1（UBUS_SYSTEM_OBJECT_EVENT）

Server_fd监听函数server_cb注册到uloop中

* 新client连接时
创建struct ubus_client数据结构，初始化client fd回调函数client_cb，并加入到全局clients avl_tree中进行维护，最后把此client注册到uloop中

* 收到client报文时
如果发送队列中存在数据，则尽量把队列中所有内容发出
先收取报文头部数据，以确定整个报文内容长度，报文头部数据结构如下

```c
struct {
		struct ubus_msghdr hdr;
		struct blob_attr data;
	} hdrbuf;
struct ubus_msghdr {
	uint8_t version;
	uint8_t type;
	uint16_t seq;
	uint32_t peer;
} __packetdata;
struct blob_attr {
	uint32_t id_len;
	char data[];
} __packed;
```

收取整个报文内容，存放到`struct ubus_msg_buf`结构中
调用`ubusd_proto_receive_message()`函数处理报文内容，此函数根据`hdr.type`在注册的handlers中查询对应的函数，具体请看ubusd_proto说明

---

## ubusd_proto
### 消息处理

| 消息类型	| 处理函数 |
| --------- | -------- |
| UBUS_MSG_PING	| ubusd_send_pong |
| UBUS_MSG_ADD_OBJECT |	ubusd_handle_add_object |
| UBUS_MSG_REMOVE_OBJECT |	ubusd_handle_remove_object |
| UBUS_MSG_LOOKUP |	ubusd_handle_lookup |
| UBUS_MSG_INVOKE |	ubusd_handle_invoke |
| UBUS_MSG_STATUS |	ubusd_handle_response |
| UBUS_MSG_DATA |	ubusd_handle_response |
| UBUS_MSG_SUBSCRIBE	| ubusd_handle_add_watch |
| UBUS_MSG_UNSUBSCRIBE |	ubusd_handle_remove_watch |
| UBUS_MSG_NOTIFY |	ubusd_handle_notify |


#### UBUS_MSG_PING 
> 保活探测报文，收到后回应一个类型为UBUS_MSG_DATA的报文即可

#### UBUS_MSG_ADD_OBJECT
> 创建内部object，回应一个类型为UBUS_MSG_DATA的报文，报文内容有由ubusd生成的UBUS_ATTR_OBJID

#### UBUS_MSG_REMOVE_OBJECT
> 删除内部object，根据请求报文UBUS_ATTR_OBJID查找对应的内容object，如果存在且object创建者等于删除请求者，则删除此object，回应一个类型为UBUS_MSG_DATA的报文，报文内容有删除object的UBUS_ATTR_OBJID

#### UBUS_MSG_LOOKUP
> 查询object，根据请求报文UBUS_ATTR_OBJPATH查找对应的object，使用ubusd_send_obj()函数把查询出object内容回应给查询请求者

#### UBUS_MSG_INVOKE
> 执行object，根据请求报文UBUS_ATTR_OBJID查找对应的object，如果object为ubusd本地对象（event_object）则由本地对象处理，否则使用ubusd_forward_invoke()函数把消息转发给object拥有者，消息类型为UBUS_MSG_INVOKE

#### UBUS_MSG_STATUS
> 处理结果状态，把结果转发给请求者

#### UBUS_MSG_DATA
> 同UBUS_MSG_STATUS

#### UBUS_MSG_NOTIFY
> 通知所有订阅者，使用ubusd_forward_invoke()函数通知订阅请求者所有订阅者

#### UBUS_MSG_SUBSCRIBE
> 订阅object，使用ubus_subscribe()函数订阅指定object

#### UBUS_MSG_UNSUBSCRIBE
> 退订object，使用ubus_unsubscribe()函数退订所有已订阅的object

---

## ubusd_event
### 数据结构

```c
struct event_source {
	struct list_head list;     /** object结构中events队列 */
	struct ubus_object *obj;   /** 指向事件object实体 */
	struct avl_node avl;       /** patterns全局avl tree队列 */
	bool partial;
};
```

### 处理流程
+ 收到事件处理报文
+ Register注册某个object事件，使用ubusd_alloc_event_pattern()函数创建事件对象并加入到全局patterns队列中
+ 注册报文内容

```c
static struct blobmsg_policy evr_policy[] = {
	[EVREG_PATTERN] = { .name = "pattern", .type = BLOBMSG_TYPE_STRING },
	[EVREG_OBJECT] = { .name = "object", .type = BLOBMSG_TYPE_INT32 },
};
```

Send转发某个事件内容，使用ubusd_forward_event()函数把指定事件内容转发给此事件所属的object拥有者
事件报文内容

```c
static struct blobmsg_policy ev_policy[] = {
	[EVMSG_ID] = { .name = "id", .type = BLOBMSG_TYPE_STRING },
	[EVMSG_DATA] = { .name = "data", .type = BLOBMSG_TYPE_TABLE },
};
```

### 对外接口
提供ubusd_send_obj_event()接口发布"ubus.object.add"和"ubus.object.remove"事件

---

## ubusd_id
### 数据结构

```c
struct ubus_id {
	struct avl_node avl;
	uint32_t id;
};
```

### 接口说明
#### 初始/销毁

```c
void ubus_init_id_tree(struct avl_tree *tree);
/**
 * @param dup - 允许存在相同结点
 */
void ubus_init_string_tree(struct avl_tree *tree, bool dup);
static inline void ubus_free_id(struct avl_tree *tree, struct ubus_id *id)
```

#### 增加
```c
/**
 * 添加新ubus_id到val树中
 *
 * @param tree - val树根结点
 * @param id   - 新ubus_id
 * @param val  - 新ubus_id值，如果为0则表示自动随机生成
 * @return       true - 成功；false - 失败
 */
bool ubus_alloc_id(struct avl_tree *tree, struct ubus_id *id, uint32_t val)
```

#### 查询

```c
static inline struct ubus_id *ubus_find_id(struct avl_tree *tree, uint32_t id)
```

---

## ubusd_object
### 数据结构

```c
struct ubus_object_type {
	struct ubus_id id;
	int refcount;
	struct list_head methods;
};

struct ubus_method {
	struct list_head list;
	const char *name;
	struct blob_attr data[];
};

struct ubus_subscription {
	struct list_head list, target_list;
	struct ubus_object *subscriber, *target;
};

struct ubus_object {
	struct ubus_id id;
	struct list_head list;

	struct list_head events;  /** 事件链表头 */

    /**
     * subscribers - 被哪些对象订阅链表头
     * target_list - 已订阅哪些对象链表头
     */
	struct list_head subscribers, target_list;

	struct ubus_object_type *type;
	struct avl_node path;

	struct ubus_client *client;
	int (*recv_msg)(struct ubus_client *client, const char *method, 
                    struct blob_attr *msg);

	int event_seen;
	unsigned int invoke_seq;
};
```

### 接口说明
#### 创建/销毁

```c
/**
 * 创建新ubus_object
 *
 * @param attr - UBUS_ATTR_OBJTYPE UBUS_ATTR_SIGNATURE UBUS_ATTR_OBJPATH
 */
struct ubus_object *ubusd_create_object(struct ubus_client *cl, 
                                        struct blob_attr **attr);
/**
 * 创建新ubus_object
 */
struct ubus_object *ubusd_create_object_internal(struct ubus_object_type *type, 
                                                uint32_t id);
/**
 * 销毁ubus_object
 */
void ubusd_free_object(struct ubus_object *obj);
```

#### 获取对象

```c
static inline struct ubus_object *ubusd_find_object(uint32_t objid);
```

#### 订阅/退订对象

```c
/**
 * obj订阅target 
 *
 * @param obj - 订阅者对象
 * @param target - 被订阅对象
 */
void ubus_subscribe(struct ubus_object *obj, struct ubus_object *target);

/**
 * 退订
 */
void ubus_unsubscribe(struct ubus_subscription *s);
```

