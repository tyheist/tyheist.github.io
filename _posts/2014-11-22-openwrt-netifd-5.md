---
layout: post
title: "netifd [5] - interface-ip/interface-event"
date: 2014-11-22
category: openwrt
tags: openwrt netifd
---

## interface-ip
### 数据结构
```c
enum device_addr_flags {
	/* address family for routes and addresses */
	DEVADDR_INET4		= (0 << 0),
	DEVADDR_INET6		= (1 << 0),
	DEVADDR_FAMILY		= DEVADDR_INET4 | DEVADDR_INET6,

	/* externally added address */
	DEVADDR_EXTERNAL	= (1 << 2),

	/* route overrides the default interface metric */
	DEVROUTE_METRIC		= (1 << 3),

	/* route overrides the default interface mtu */
	DEVROUTE_MTU		= (1 << 4),

	/* route automatically added by kernel */
	DEVADDR_KERNEL		= (1 << 5),

	/* address is off-link (no subnet-route) */
	DEVADDR_OFFLINK		= (1 << 6),

	/* route resides in different table */
	DEVROUTE_TABLE		= (1 << 7),

	/* route resides in default source-route table */
	DEVROUTE_SRCTABLE	= (1 << 8),

	/* route is on-link */
	DEVROUTE_ONLINK		= (1 << 9),
};

/** IPv4/IPv6地址对象 */
union if_addr {
	struct in_addr in;
	struct in6_addr in6;
};

struct device_prefix_assignment {
	struct list_head head;
	int32_t assigned;
	uint8_t length;
	bool enabled;
	char name[];
};

struct device_prefix {
	struct vlist_node node;
	struct list_head head;
	struct list_head assignments;
	struct interface *iface;
	time_t valid_until;
	time_t preferred_until;

	struct in6_addr excl_addr;
	uint8_t excl_length;

	struct in6_addr addr;
	uint8_t length;

	char pclass[];
};

struct device_addr {
	struct vlist_node node;
	bool enabled;
	bool failed;

	/* ipv4 only */
	uint32_t broadcast;
	uint32_t point_to_point;

	/* ipv6 only */
	time_t valid_until;
	time_t preferred_until;
	char *pclass;

	/* must be last */
	enum device_addr_flags flags;
	unsigned int mask;
	union if_addr addr;
};
```

```c
struct device_route {
	struct vlist_node node;
	struct interface *iface;

	bool enabled;
	bool keep;
	bool failed;

	union if_addr nexthop;
	int mtu;
	time_t valid_until;

	/* must be last */
	enum device_addr_flags flags;
	int metric; // there can be multiple routes to the same target
	unsigned int table;
	unsigned int mask;
	unsigned int sourcemask;
	union if_addr addr;
	union if_addr source;
};

struct device_source_table {
	struct list_head head;
	uint32_t table;
	uint16_t refcount;
	uint8_t v6;
	uint8_t mask;
	union if_addr addr;
};
```

```c
struct dns_server {
	struct vlist_simple_node node;
	int af;
	union if_addr addr;
};

struct dns_search_domain {
	struct vlist_simple_node node;
	char name[];
};
```

### 属性定义
```c
enum {
	ROUTE_INTERFACE,
	ROUTE_TARGET,
	ROUTE_MASK,
	ROUTE_GATEWAY,
	ROUTE_METRIC,
	ROUTE_MTU,
	ROUTE_VALID,
	ROUTE_TABLE,
	ROUTE_SOURCE,
	ROUTE_ONLINK,
	__ROUTE_MAX
};

static const struct blobmsg_policy route_attr[__ROUTE_MAX] = {
	[ROUTE_INTERFACE] = { .name = "interface", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_TARGET] = { .name = "target", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_MASK] = { .name = "netmask", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_GATEWAY] = { .name = "gateway", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_METRIC] = { .name = "metric", .type = BLOBMSG_TYPE_INT32 },
	[ROUTE_MTU] = { .name = "mtu", .type = BLOBMSG_TYPE_INT32 },
	[ROUTE_TABLE] = { .name = "table", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_VALID] = { .name = "valid", .type = BLOBMSG_TYPE_INT32 },
	[ROUTE_SOURCE] = { .name = "source", .type = BLOBMSG_TYPE_STRING },
	[ROUTE_ONLINK] = { .name = "onlink", .type = BLOBMSG_TYPE_BOOL },
};

const struct uci_blob_param_list route_attr_list = {
	.n_params = __ROUTE_MAX,
	.params = route_attr,
};
```

### 接口说明
```c
/**
 * 初始化interface object中与IP配置相关的所有链表
 */
void interface_ip_init(struct interface *iface)
```

```c
/**
 * 创建DNS Server对象，并添加到interface ip setting中
 *
 * @param ip interface ip setting object
 * @param str dns server string
 */
void interface_add_dns_server(struct interface_ip_settings *ip, const char *str)

/**
 * 把DNS Server对象列表添加到interface ip setting中
 *
 * @param ip interface ip setting object
 * @param list dns server list
 */
void interface_add_dns_server_list(struct interface_ip_settings *ip, struct blob_attr *list)

/**
 * 把dns search对象列表添加到interface ip setting中
 *
 * @param ip interface ip setting object
 * @param list dns search domain list
 */
void interface_add_dns_search_list(struct interface_ip_settings *ip, struct blob_attr *list)

/**
 * 把dns server/dns search信息写到/tmp/resolv.conf文件中
 */
void interface_write_resolv_conf(void)
```

```c
/**
 * 创建route对象，并添加到interface ip setting对象中
 *
 * @param interface object
 * @param attr route info
 * @param v6 true - is IPv6 route, false - is IPv4 route
 */
void interface_ip_add_route(struct interface *iface, struct blob_attr *attr, bool v6)

/**
 *
 */
struct interface *interface_ip_add_target_route(union if_addr *addr, bool v6, struct interface *iface)
```

```c
/**
 * 启用/禁止ip对应的相关配置(addr/route/rule)
 *
 * @param ip interface ip settings object
 * @param enabled true - enable, false - disable
 */
void interface_ip_set_enabled(struct interface_ip_settings *ip, bool enabled)
```

## interface-event
### 数据结构
```c
/** 事件类型定义 */
enum interface_event {
	IFEV_DOWN,
	IFEV_UP,
	IFEV_UPDATE,
	IFEV_FREE,
	IFEV_RELOAD,
};
```

### 属性定义
```c
/** 事件任务回调函数定义 */
static struct uloop_process task = {
	.cb = task_complete,
};

/** interface事件引用回调函数定义 */
static struct interface_user event_user = {
	.cb = interface_event_cb
};
```

### 接口说明
```c
/** 
 * netifd进程启动时初始化事件模块 
 */
static void __init interface_event_init(void)
```

```c
/**
 * interface事件处理入口函数
 */
static void interface_event_cb(struct interface_user *dep, struct interface *iface,
			       enum interface_event ev)
```

```c
/**
 * interface事件进队列
 * 一个interface对象同时只有一个事件在队列，一个事件等待完成
 * 当在队列
 */
static void interface_queue_event(struct interface *iface, enum interface_event ev)

/**
 * interface事件出队列
 */
static void interface_dequeue_event(struct interface *iface)
```

```c
/**
 * 处理事件队列中的第1个事件
 */
static void call_hotplug(void)

/**
 * fork子进程产生hotplug
 */
static void run_cmd(const char *ifname, const char *device, enum interface_event event,
		enum interface_update_flags updated)
		
/**
 * hotplug子进程完成后处理接口，调用call_hotplug函数继续处理事件队列
 */
static void task_complete(struct uloop_process *proc, int ret)
```