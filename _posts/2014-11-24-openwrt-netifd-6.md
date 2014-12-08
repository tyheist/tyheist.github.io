---
layout: post
title: "netifd [6] - proto"
date: 2014-11-24
category: openwrt
tags: openwrt netifd
---

## 数据结构
```c
enum interface_proto_event {
	IFPEV_UP,
	IFPEV_DOWN,
	IFPEV_LINK_LOST,
	IFPEV_RENEW,
};

enum interface_proto_cmd {
	PROTO_CMD_SETUP,
	PROTO_CMD_TEARDOWN,
	PROTO_CMD_RENEW,
};

enum {
	PROTO_FLAG_IMMEDIATE = (1 << 0),
	PROTO_FLAG_NODEV = (1 << 1),
	PROTO_FLAG_INIT_AVAILABLE = (1 << 2),
	PROTO_FLAG_RENEW_AVAILABLE = (1 << 3),
};

struct interface_proto_state {
	const struct proto_handler *handler;
	struct interface *iface;

	/* filled in by the protocol user */
	void (*proto_event)(struct interface_proto_state *, enum interface_proto_event ev);

	/* filled in by the protocol handler */
	int (*notify)(struct interface_proto_state *, struct blob_attr *data);
	int (*cb)(struct interface_proto_state *, enum interface_proto_cmd cmd, bool force);
	void (*free)(struct interface_proto_state *);
};


struct proto_handler {
	struct avl_node avl;

	unsigned int flags;

	const char *name;
	const struct uci_blob_param_list *config_params;

	struct interface_proto_state *(*attach)(const struct proto_handler *h,
		struct interface *iface, struct blob_attr *attr);
};
```

## 属性定义
```c
enum {
	OPT_IPADDR,
	OPT_IP6ADDR,
	OPT_NETMASK,
	OPT_BROADCAST,
	OPT_GATEWAY,
	OPT_IP6GW,
	OPT_IP6PREFIX,
	__OPT_MAX,
};

static const struct blobmsg_policy proto_ip_attributes[__OPT_MAX] = {
	[OPT_IPADDR] = { .name = "ipaddr", .type = BLOBMSG_TYPE_ARRAY },
	[OPT_IP6ADDR] = { .name = "ip6addr", .type = BLOBMSG_TYPE_ARRAY },
	[OPT_NETMASK] = { .name = "netmask", .type = BLOBMSG_TYPE_STRING },
	[OPT_BROADCAST] = { .name = "broadcast", .type = BLOBMSG_TYPE_STRING },
	[OPT_GATEWAY] = { .name = "gateway", .type = BLOBMSG_TYPE_STRING },
	[OPT_IP6GW] = { .name = "ip6gw", .type = BLOBMSG_TYPE_STRING },
	[OPT_IP6PREFIX] = { .name = "ip6prefix", .type = BLOBMSG_TYPE_ARRAY },
};

static const struct uci_blob_param_info proto_ip_attr_info[__OPT_MAX] = {
	[OPT_IPADDR] = { .type = BLOBMSG_TYPE_STRING },
	[OPT_IP6ADDR] = { .type = BLOBMSG_TYPE_STRING },
	[OPT_IP6PREFIX] = { .type = BLOBMSG_TYPE_STRING },
};

static const char * const proto_ip_validate[__OPT_MAX] = {
	[OPT_IPADDR] = "ip4addr",
	[OPT_IP6ADDR] = "ip6addr",
	[OPT_NETMASK] = "netmask",
	[OPT_BROADCAST] = "ipaddr",
	[OPT_GATEWAY] = "ip4addr",
	[OPT_IP6GW] = "ip6addr",
	[OPT_IP6PREFIX] = "ip6addr",
};

const struct uci_blob_param_list proto_ip_attr = {
	.n_params = __OPT_MAX,
	.params = proto_ip_attributes,
	.validate = proto_ip_validate,
	.info = proto_ip_attr_info,
};

enum {
	ADDR_IPADDR,
	ADDR_MASK,
	ADDR_BROADCAST,
	ADDR_PTP,
	ADDR_PREFERRED,
	ADDR_VALID,
	ADDR_OFFLINK,
	ADDR_CLASS,
	__ADDR_MAX
};

static const struct blobmsg_policy proto_ip_addr[__ADDR_MAX] = {
	[ADDR_IPADDR] = { .name = "ipaddr", .type = BLOBMSG_TYPE_STRING },
	[ADDR_MASK] = { .name = "mask", .type = BLOBMSG_TYPE_STRING },
	[ADDR_BROADCAST] = { .name = "broadcast", .type = BLOBMSG_TYPE_STRING },
	[ADDR_PTP] = { .name = "ptp", .type = BLOBMSG_TYPE_STRING },
	[ADDR_PREFERRED] = { .name = "preferred", .type = BLOBMSG_TYPE_INT32 },
	[ADDR_VALID] = { .name = "valid", .type = BLOBMSG_TYPE_INT32 },
	[ADDR_OFFLINK] = { .name = "offlink", .type = BLOBMSG_TYPE_BOOL },
	[ADDR_CLASS] = { .name = "class", .type = BLOBMSG_TYPE_STRING },
};
```

## 接口说明
```c
/**
 * 添加新的proto类型处理对象到全局链表中
 */
void add_proto_handler(struct proto_handler *p)
```

```c
/**
 * 初始化interface对象的proto相关属性
 */
void proto_init_interface(struct interface *iface, struct blob_attr *attr)
```

```c
/**
 * 根据proto名称找到对应的proto类型处理对象，并绑定到interface对象中
 *
 * @param iface interface object
 * @param proto_name protocol name string
 */
void proto_attach_interface(struct interface *iface, const char *proto_name)
```

```c
/**
 * interface对象proto事件触发
 */
int interface_proto_event(struct interface_proto_state *proto,
			  enum interface_proto_cmd cmd, bool force)
```

```c
/**
 * 设置interface对象静态IP配置
 *
 * @param iface interface object
 * @param attr configure of static ip
 */
int proto_apply_static_ip_settings(struct interface *iface, struct blob_attr *attr)

/**
 * 设备interface对象IP配置
 *
 * @param iface interface object
 * @param attr configure of ip
 * @param ext 
 */
int proto_apply_ip_settings(struct interface *iface, struct blob_attr *attr, bool ext)
```

```c
/**
 * 输入当时所有proto类型处理接口信息
 */
void proto_dump_handlers(struct blob_buf *b)
```
