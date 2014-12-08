---
layout: post
title: "ubus [3] - cli"
date: 2014-11-17
category: openwrt
tags: openwrt ubus
---

## cli
### 数据结构

```c
struct ubus_context {
	struct list_head requests;   /** 请求object队列 */
	struct avl_tree objects;
	struct list_head pending;

	struct uloop_fd sock;

	uint32_t local_id;
	uint16_t request_seq;
	int stack_depth;

	void (*connection_lost)(struct ubus_context *ctx);

	struct {
		struct ubus_msghdr hdr;
		char data[UBUS_MAX_MSGLEN];
	} msgbuf;          /** 报文格式头 */              
};
```

### call

```bash
call <path> <method> [<message>]
```
使用ubus_lookup_id()函数根据UBUS_ATTR_OBJPATH请求UBUS_MSG_LOOKUP，返回UBUS_ATTR_OBJID

使用ubus_invoke()函数把UBUS_ATTR_OBJID、UBUS_ATTR_METHOD、UBUS_ATTR_DATA通过请求UBUS_MSG_INVOKE消息类型通知执行指定方法，返回信息可由传入ubus_invoke()函数的回调函数receive_call_result_data()处理

### list

```bash
list [<path>]
```

使用ubus_lookup()函数根据UBUS_ATTR_OBJPATH通过请求UBUS_MSG_LOOKUP消息类型进行查询操作，返回信息可由传入ubus_lookup()函数的回调函数receive_list_result()处理

### listen

```bash
listen [<path>...]
```

使用ubus_register_event_handler()函数注册指定事件，并进行监听

### send

```bash
send <type> [<message>]
```

使用ubus_send_event()函数发送事件消息

### wait_for

```bash
wait_for <object> [<object>...]
```
