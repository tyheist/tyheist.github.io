---
layout: post
title: "netifd [2] - device"
date: 2014-11-20
category: openwrt
tags: openwrt netifd
---

## 数据结构

```c
/**
 * 设备类型对象，不同设备定义自己的类型处理函数
 */
struct device_type {
	struct list_head list;
	const char *name;

	const struct uci_blob_param_list *config_params;

	struct device *(*create)(const char *name, struct blob_attr *attr);
	void (*config_init)(struct device *);
	enum dev_change_type (*reload)(struct device *, struct blob_attr *);
	void (*dump_info)(struct device *, struct blob_buf *buf);
	void (*dump_stats)(struct device *, struct blob_buf *buf);
	int (*check_state)(struct device *);
	void (*free)(struct device *);
};
```

```c
enum device_event {
	DEV_EVENT_ADD,
	DEV_EVENT_REMOVE,

	DEV_EVENT_UPDATE_IFNAME,
	DEV_EVENT_UPDATE_IFINDEX,

	DEV_EVENT_SETUP,
	DEV_EVENT_TEARDOWN,
	DEV_EVENT_UP,
	DEV_EVENT_DOWN,

	DEV_EVENT_LINK_UP,
	DEV_EVENT_LINK_DOWN,

	/* Topology changed (i.e. bridge member added) */
	DEV_EVENT_TOPO_CHANGE,

	__DEV_EVENT_MAX
};

struct device_user {
	struct safe_list list;

	bool claimed;
	bool hotplug;
	bool alias;

	uint8_t ev_idx[__DEV_EVENT_MAX];

	struct device *dev;  /** 引用指向的dev */
	void (*cb)(struct device_user *, enum device_event); /** 事件处理回调函数 */
};
```

```c
/**
 * 设备配置对象中已存在的配置
 */
enum {
	DEV_OPT_MTU		= (1 << 0),
	DEV_OPT_MACADDR		= (1 << 1),
	DEV_OPT_TXQUEUELEN	= (1 << 2),
	DEV_OPT_IPV6		= (1 << 3),
};

/**
 * 设备配置对象
 */
struct device_settings {
	unsigned int flags;
	unsigned int mtu;
	unsigned int txqueuelen;
	uint8_t macaddr[6];
	bool ipv6;
};
```

```c
struct device {
	const struct device_type *type;

	struct avl_node avl;
	struct safe_list users;
	struct safe_list aliases;

	char ifname[IFNAMSIZ + 1];
	int ifindex;

	struct blob_attr *config;
	bool config_pending;
	bool sys_present;
	bool present;
	int active;
	bool link_active;

	bool external;
	bool disabled;
	bool deferred;
	bool hidden;

	bool current_config;   /** 当前配置是否有效 */
	bool default_config;

	/* set interface up or down */
	device_state_cb set_state;

	const struct device_hotplug_ops *hotplug_ops;

	struct device_user parent;

	struct device_settings orig_settings;
	struct device_settings settings;
};

struct device_hotplug_ops {
	int (*prepare)(struct device *dev);
	int (*add)(struct device *main, struct device *member);
	int (*del)(struct device *main, struct device *member);
};
```

## 接口说明
### 初始/销毁

```c
/**
 * 初始化链表dev->users dev->aliases
 */
void device_init_virtual(struct device *dev, const struct device_type *type, const char *name)

/**
 * 以dev->ifname为key值加入全局AVL devices二叉树
 * 清除dev所有相关接口信息
 */
int device_init(struct device *iface, const struct device_type *type, const char *ifname)
```

```c
/**
 * 清除dev所有引用dev->users dev->aliases
 * 把dev从全局AVL devices二叉树中删除
 */
void device_cleanup(struct device *dev)
```

### 创建
```c
/**
 * 根据dev_type和config创建新dev
 */
struct device *device_create(const char *name, const struct device_type *type,
			     struct blob_attr *config)
```

### 引用

```c
/**
 * 增加新user到dev
 */
void device_add_user(struct device_user *dep, struct device *iface)

/**
 * 删除dev user
 */
void device_remove_user(struct device_user *dep)
```

```c
/**
 * 引用加1
 */
int device_claim(struct device_user *dep)

/**
 * 引用减1
 */
void device_release(struct device_user *dep)
```

### 状态
```c
void device_dump_status(struct blob_buf *b, struct device *dev)
```
