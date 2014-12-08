---
layout: post
title: "netifd [4] - interface"
date: 2014-11-22
category: openwrt
tags: openwrt netifd
---

## 数据结构
```c
/**
 * interface object
 */
struct interface {
	struct vlist_node node;
	struct list_head hotplug_list;
	enum interface_event hotplug_ev;

	const char *name;
	const char *ifname;

	bool available;
	bool autostart;
	bool config_autostart;
	bool device_config;
	bool enabled;
	bool link_state;
	bool force_link;
	bool dynamic;

	time_t start_time;
	enum interface_state state;
	enum interface_config_state config_state;
	enum interface_update_flags updated;

	struct list_head users;

	const char *parent_ifname;
	struct interface_user parent_iface;

	/* main interface that the interface is bound to */
	struct device_user main_dev;

	/* interface that layer 3 communication will go through */
	struct device_user l3_dev;

	struct blob_attr *config;

	/* primary protocol state */
	const struct proto_handler *proto_handler;
	struct interface_proto_state *proto;

	struct interface_ip_settings proto_ip;
	struct interface_ip_settings config_ip;
	struct vlist_tree host_routes;

	int metric;
	unsigned int ip4table;
	unsigned int ip6table;

	/* IPv6 assignment parameters */
	uint8_t assignment_length;
	int32_t assignment_hint;
	struct list_head assignment_classes;

	/* errors/warnings while trying to bring up the interface */
	struct list_head errors;

	/* extra data provided by protocol handlers or modules */
	struct avl_tree data;

	struct uloop_timeout remove_timer;
	struct ubus_object ubus;
};
```

```c
enum interface_event {
	IFEV_DOWN,
	IFEV_UP,
	IFEV_UPDATE,
	IFEV_FREE,
	IFEV_RELOAD,
};

enum interface_state {
	IFS_SETUP,
	IFS_UP,
	IFS_TEARDOWN,
	IFS_DOWN,
};

enum interface_config_state {
	IFC_NORMAL,
	IFC_RELOAD,
	IFC_REMOVE
};

enum interface_update_flags {
	IUF_ADDRESS	= (1 << 0),
	IUF_ROUTE	= (1 << 1),
	IUF_PREFIX	= (1 << 2),
	IUF_DATA	= (1 << 3),
};

struct interface_error {
	struct list_head list;

	const char *subsystem;
	const char *code;
	const char *data[];
};

/**
 * interface 引用
 */
struct interface_user {
	struct list_head list;
	struct interface *iface;
	void (*cb)(struct interface_user *dep, struct interface *iface, enum interface_event ev);
};

/**
 * interface ip 配置对象
 */
struct interface_ip_settings {
	struct interface *iface;
	bool enabled;
	bool no_defaultroute;
	bool no_dns;
	bool no_delegation;

	struct vlist_tree addr;
	struct vlist_tree route;
	struct vlist_tree prefix;

	struct vlist_simple_tree dns_servers;
	struct vlist_simple_tree dns_search;
};

struct interface_data {
	struct avl_node node;
	struct blob_attr data[];
};

struct interface_assignment_class {
	struct list_head head;
	char name[];
};
```

## 接口说明
```c
/**
 * 根据输入配置创建并初始化interface object
 *
 * @param name interface name
 * @param config configure of interface object
 * @return interface object
 */
struct interface *interface_alloc(const char *name, struct blob_attr *config)
```

```c
/**
 * 添加设置到interface中
 *
 * @param iface interface object
 * @param config configure of interface object
 */
void interface_add(struct interface *iface, struct blob_attr *config)
```

```c
/**
 * 设置interface object的proto处理对象
 *
 * @param iface interface object
 * @param state proto handler object
 */
void interface_set_proto_state(struct interface *iface, struct interface_proto_state *state)
```

```c
/**
 * 使能interface object
 *
 * @param iface interface object
 * @return true - success false - failed
 */
int interface_set_up(struct interface *iface)

/**
 * 停用interface object
 *
 * @param iface interface object
 * @return true - success false - failed
 */
int interface_set_down(struct interface *iface)
```

```c
/**
 * 设置interface对象主device对象
 *
 * @param iface interface object
 * @param dev device object
 */
void interface_set_main_dev(struct interface *iface, struct device *dev)

/**
 * 设置interface对象3层device对象
 *
 * @param iface interface object
 * @param dev device object
 */
void interface_set_l3_dev(struct interface *iface, struct device *dev)
```

```c
/**
 * 添加interface object引用
 *
 * @param dep interface reference object
 * @param iface interface object
 */
void interface_add_user(struct interface_user *dep, struct interface *iface)

/**
 * 删除interface object引用
 *
 * @param dep interface reference object
 */
void interface_remove_user(struct interface_user *dep)
```

```c
/**
 *
 */
int interface_add_link(struct interface *iface, struct device *dev)

/**
 *
 */
int interface_remove_link(struct interface *iface, struct device *dev)

/**
 *
 */
int interface_handle_link(struct interface *iface, const char *name, bool add)
```

## 注意
interface对象avl tree链表设置了`keep_old`和`no_delete`标志，每次执行config_init_all时首先vlist_update把avl tree链表头结点的`version`标志加1,当根据UCI更新interface链表中对象时每个node的`version`保持与头结点`version`一致，后继做vlist_flush时如果存在node的`version`与头结点`version`不一致的将被删除，而netifd在删除某个interface时其实并没有把相应的对象从avl tree链表中删除，而是等下一次restart或reload时再
