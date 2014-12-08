---
layout: post
title: "netifd [3] - simple/bridge/vlan/macvlan/tunnel"
date: 2014-11-20
category: openwrt
tags: openwrt netifd
---

## simple device
### 属性定义

```c
/** 普通device配置列表 */
static const struct blobmsg_policy dev_attrs[__DEV_ATTR_MAX] = {
	[DEV_ATTR_TYPE] = { .name = "type", .type = BLOBMSG_TYPE_STRING },
	[DEV_ATTR_IFNAME] = { .name = "ifname", .type = BLOBMSG_TYPE_ARRAY },
	[DEV_ATTR_MTU] = { .name = "mtu", .type = BLOBMSG_TYPE_INT32 },
	[DEV_ATTR_MACADDR] = { .name = "macaddr", .type = BLOBMSG_TYPE_STRING },
	[DEV_ATTR_TXQUEUELEN] = { .name = "txqueuelen", .type = BLOBMSG_TYPE_INT32 },
	[DEV_ATTR_ENABLED] = { .name = "enabled", .type = BLOBMSG_TYPE_BOOL },
	[DEV_ATTR_IPV6] = { .name = "ipv6", .type = BLOBMSG_TYPE_BOOL },
};

const struct uci_blob_param_list device_attr_list = {
	.n_params = __DEV_ATTR_MAX,
	.params = dev_attrs,
};

const struct device_type simple_device_type = {
	.name = "Network device",
	.config_params = &device_attr_list,

	.create = simple_device_create,
	.check_state = system_if_check,
	.free = simple_device_free,
};
```

### 接口说明

```c
/**
 * 创建普通device对象
 *
 * @param name ifname
 * @param attr config for simple device
 */
static struct device *simple_device_create(const char *name, struct blob_attr *attr)
```

```c
/**
 * 销毁普通device对象
 */
static void simple_device_free(struct device *dev)
```

---

## bridge device
### 数据结构

```c
struct bridge_state {
	struct device dev;  /** 继承struct device对象 */
	device_state_cb set_state;

	struct blob_attr *config_data;
	struct bridge_config config;
	struct blob_attr *ifnames; /** 桥成员名字列表 */
	bool active;
	bool force_active;

	struct bridge_member *primary_port;
	struct vlist_tree members; /** 桥成员列表 */
	int n_present;
};

struct bridge_member {
	struct vlist_node node;
	struct bridge_state *bst;
	struct device_user dev;
	bool present;
	char name[];
};

enum bridge_opt {
	/* stp and forward delay always set */
	BRIDGE_OPT_AGEING_TIME = (1 << 0),
	BRIDGE_OPT_HELLO_TIME  = (1 << 1),
	BRIDGE_OPT_MAX_AGE     = (1 << 2),
};

/**
 * 桥配置对象
 */
struct bridge_config {
	enum bridge_opt flags;
	bool stp;
	bool igmp_snoop;
	unsigned short priority;
	int forward_delay;
	bool bridge_empty;

	int ageing_time;
	int hello_time;
	int max_age;
};
```

### 属性定义

```c
enum {
	BRIDGE_ATTR_IFNAME,
	BRIDGE_ATTR_STP,
	BRIDGE_ATTR_FORWARD_DELAY,
	BRIDGE_ATTR_PRIORITY,
	BRIDGE_ATTR_IGMP_SNOOP,
	BRIDGE_ATTR_AGEING_TIME,
	BRIDGE_ATTR_HELLO_TIME,
	BRIDGE_ATTR_MAX_AGE,
	BRIDGE_ATTR_BRIDGE_EMPTY,
	__BRIDGE_ATTR_MAX
};

/** 桥属性列表定义 */
static const struct blobmsg_policy bridge_attrs[__BRIDGE_ATTR_MAX] = {
	[BRIDGE_ATTR_IFNAME] = { "ifname", BLOBMSG_TYPE_ARRAY },
	[BRIDGE_ATTR_STP] = { "stp", BLOBMSG_TYPE_BOOL },
	[BRIDGE_ATTR_FORWARD_DELAY] = { "forward_delay", BLOBMSG_TYPE_INT32 },
	[BRIDGE_ATTR_PRIORITY] = { "priority", BLOBMSG_TYPE_INT32 },
	[BRIDGE_ATTR_AGEING_TIME] = { "ageing_time", BLOBMSG_TYPE_INT32 },
	[BRIDGE_ATTR_HELLO_TIME] = { "hello_time", BLOBMSG_TYPE_INT32 },
	[BRIDGE_ATTR_MAX_AGE] = { "max_age", BLOBMSG_TYPE_INT32 },
	[BRIDGE_ATTR_IGMP_SNOOP] = { "igmp_snooping", BLOBMSG_TYPE_BOOL },
	[BRIDGE_ATTR_BRIDGE_EMPTY] = { "bridge_empty", BLOBMSG_TYPE_BOOL },
};

static const struct uci_blob_param_info bridge_attr_info[__BRIDGE_ATTR_MAX] = {
	[BRIDGE_ATTR_IFNAME] = { .type = BLOBMSG_TYPE_STRING },
};

static const struct uci_blob_param_list bridge_attr_list = {
	.n_params = __BRIDGE_ATTR_MAX,
	.params = bridge_attrs,
	.info = bridge_attr_info,

	.n_next = 1,
	.next = { &device_attr_list },
};

/** 桥device对象私有操作接口定义 */
const struct device_type bridge_device_type = {
	.name = "Bridge",
	.config_params = &bridge_attr_list,

	.create = bridge_create,
	.config_init = bridge_config_init,
	.reload = bridge_reload,
	.free = bridge_free,
	.dump_info = bridge_dump_info,
};

static const struct device_hotplug_ops bridge_ops = {
	.prepare = bridge_hotplug_prepare,
	.add = bridge_hotplug_add,
	.del = bridge_hotplug_del
};
```

### 接口说明

```c
/**
 * 创建桥device对象
 *
 * @param name ifname
 * @param attr config for bridge
 * @return device object
 */
static struct device * bridge_create(const char *name, struct blob_attr *attr)
```

```c
/**
 * 重新加载配置
 *
 * @param dev bridge device object
 * @param attr config for bridge
 * @return device change type enum
 */
enum dev_change_type bridge_reload(struct device *dev, struct blob_attr *attr)
```

```c
/**
 * 初始化桥对象 
 *
 * @param dev bridge device object
 */
static void bridge_config_init(struct device *dev)
```

```c
/**
 * 销毁桥对象
 *
 * @param dev bridge device object
 */
static void bridge_free(struct device *dev)
```

```c
/**
 * 打印桥对象信息
 *
 * @param dev bridge device object
 * @param b bridge dump info buffer
 */
static void bridge_dump_info(struct device *dev, struct blob_buf *b)
```

```c
/**
 * 调用底层接口创建设置桥网络接口和桥成员网络接口
 *
 * @param bst bridge state object
 */
static int bridge_set_up(struct bridge_state *bst)
```

```c
/**
 * 调用底层接口删除桥网络接口和桥成员网络接口
 *
 * @param bst bridge state object
 */
static int bridge_set_down(struct bridge_state *bst)
```

```c
/**
 * hotplug预备处理
 *
 * @param dev bridge device object
 */
static int bridge_hotplug_prepare(struct device *dev)
```

```c
/**
 * hotplug添加新成员到桥接口
 *
 * @param dev bridge device object
 * @param member bridge member device objetc
 */
static int bridge_hotplug_add(struct device *dev, struct device *member)
```

```c
/**
 * hotplug从桥接口中删除成员
 *
 * @param dev bridge device object
 * @param member bridge member device object
 */
static int bridge_hotplug_del(struct device *dev, struct device *member)
```

```c
/**
 * 事件处理函数
 */
static void bridge_member_cb(struct device_user *dev, enum device_event ev)
```

---

## vlan device
### 数据结构

```c
enum vlan_proto {
	VLAN_PROTO_8021Q = 0x8100,
	VLAN_PROTO_8021AD = 0x88A8
};

struct vlandev_config {
	enum vlan_proto proto;
	uint16_t vid;
};

struct vlandev_device {
	struct device dev;
	struct device_user parent;

	device_state_cb set_state;

	struct blob_attr *config_data;
	struct blob_attr *ifname;
	struct vlandev_config config;
};
```

### 属性定义

```c
enum {
	VLANDEV_ATTR_TYPE,
	VLANDEV_ATTR_IFNAME,
	VLANDEV_ATTR_VID,
	__VLANDEV_ATTR_MAX
};

/** vlan device配置列表 */
static const struct blobmsg_policy vlandev_attrs[__VLANDEV_ATTR_MAX] = {
	[VLANDEV_ATTR_TYPE] = { "type", BLOBMSG_TYPE_STRING },
	[VLANDEV_ATTR_IFNAME] = { "ifname", BLOBMSG_TYPE_STRING },
	[VLANDEV_ATTR_VID] = { "vid", BLOBMSG_TYPE_INT32 },
};

static const struct uci_blob_param_list vlandev_attr_list = {
	.n_params = __VLANDEV_ATTR_MAX,
	.params = vlandev_attrs,

	.n_next = 1,
	.next = { &device_attr_list },
};

const struct device_type vlandev_device_type = {
	.name = "VLANDEV",
	.config_params = &vlandev_attr_list,

	.create = vlandev_create,
	.config_init = vlandev_config_init,
	.reload = vlandev_reload,
	.free = vlandev_free,
	.dump_info = vlandev_dump_info,
};
```

### 接口说明

```c
/**
 * 创建vlan device
 *
 * @param name vlan device name
 * @param attr configure of vlan device
 * @return vlan device object
 */
static struct device * vlandev_create(const char *name, struct blob_attr *attr)
```

```c
/**
 * 销毁vlan device
 *
 * @param dev vlan device object
 */
static void vlandev_free(struct device *dev)
```

```c
/**
 * 初始化vlan deivce
 */
static void vlandev_config_init(struct device *dev)
```

```c
/**
 * 加载vlan device配置
 *
 * @param dev vlan device object
 * @param attr configure of vlan device
 * @return device change type enum
 */
static enum dev_change_type vlandev_reload(struct device *dev, struct blob_attr *attr)
```

```c
/**
 * 打印vlan device信息
 *
 * @param dev vlan device object
 * @param b buffer of dump vlan device info
 */
static void vlandev_dump_info(struct device *dev, struct blob_buf *b)
```

```c
/**
 * vlan device事件处理
 */
static void vlandev_base_cb(struct device_user *dev, enum device_event ev)
```

```c
/**
 * 调用底层接口创建设置vlan网络设备
 */
static int vlandev_set_up(struct vlandev_device *mvdev)
```

```c
/**
 * 调用底层接口删除vlan网络设备
 */
static int vlandev_set_down(struct vlandev_device *mvdev)
```

---

## macvlan device
### 数据结构

```c
enum macvlan_opt {
	MACVLAN_OPT_MACADDR = (1 << 0),
};

struct macvlan_config {
	const char *mode;

	enum macvlan_opt flags;
	unsigned char macaddr[6];
};

struct macvlan_device {
	struct device dev;
	struct device_user parent;

	device_state_cb set_state;

	struct blob_attr *config_data;
	struct blob_attr *ifname;
	struct macvlan_config config;
};
```

### 属性定义

```c
enum {
	MACVLAN_ATTR_IFNAME,
	MACVLAN_ATTR_MACADDR,
	MACVLAN_ATTR_MODE,
	__MACVLAN_ATTR_MAX
};

/** macvlan device配置列表 */
static const struct blobmsg_policy macvlan_attrs[__MACVLAN_ATTR_MAX] = {
	[MACVLAN_ATTR_IFNAME]  = { "ifname", BLOBMSG_TYPE_STRING },
	[MACVLAN_ATTR_MACADDR] = { "macaddr", BLOBMSG_TYPE_STRING },
	[MACVLAN_ATTR_MODE] = { "mode", BLOBMSG_TYPE_STRING },
};

static const struct uci_blob_param_list macvlan_attr_list = {
	.n_params = __MACVLAN_ATTR_MAX,
	.params = macvlan_attrs,

	.n_next = 1,
	.next = { &device_attr_list },
};

/** macvlan device私有操作接口 */
const struct device_type macvlan_device_type = {
	.name = "MAC VLAN",
	.config_params = &macvlan_attr_list,

	.create = macvlan_create,
	.config_init = macvlan_config_init,
	.reload = macvlan_reload,
	.free = macvlan_free,
	.dump_info = macvlan_dump_info,
};
```

### 接口说明

```c
/**
 * 创建macvlan device对象
 *
 * @param name device name
 * @param attr configure of macvlan device
 * @return macvlan device object
 */
static struct device * macvlan_create(const char *name, struct blob_attr *attr)
```

```c
/**
 * 销毁macvlan device对象
 */
static void macvlan_free(struct device *dev)
```

```c
/**
 * 初始化macvlan配置
 */
static void macvlan_config_init(struct device *dev)
```

```c
/**
 * 加载macvlan device配置
 *
 * @param dev macvlan device object
 * @param attr configure of macvlan device
 * @return device change type enum
 */
static enum dev_change_type macvlan_reload(struct device *dev, struct blob_attr *attr)
```

```c
/**
 * 打印macvlan device信息
 *
 * @param dev macvlan device object
 * @param b buffer of dump macvlan device info
 */
static void macvlan_dump_info(struct device *dev, struct blob_buf *b)
```

```c
/**
 * macvlan device事件处理
 */
static void macvlan_base_cb(struct device_user *dev, enum device_event ev)
```

```c
/**
 * 调用底层接口创建设置macvlan网络设备
 */
static int macvlan_set_up(struct macvlan_device *mvdev)
```

```c
/**
 * 调用底层接口删除macvlan网络设备
 */
static int macvlan_set_down(struct macvlan_device *mvdev)
```

## tunnel device
### 数据结构

```c
struct tunnel {
	struct device dev;
	device_state_cb set_state;
};
```

### 属性定义

```c
/** tunnel device 配置列表 */
static const struct blobmsg_policy tunnel_attrs[__TUNNEL_ATTR_MAX] = {
	[TUNNEL_ATTR_TYPE] = { .name = "mode", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_LOCAL] = { .name = "local", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_REMOTE] = { .name = "remote", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_MTU] = { .name = "mtu", .type = BLOBMSG_TYPE_INT32 },
	[TUNNEL_ATTR_DF] = { .name = "df", .type = BLOBMSG_TYPE_BOOL },
	[TUNNEL_ATTR_TTL] = { .name = "ttl", .type = BLOBMSG_TYPE_INT32 },
	[TUNNEL_ATTR_6RD_PREFIX] = {.name =  "6rd-prefix", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_6RD_RELAY_PREFIX] = { .name = "6rd-relay-prefix", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_LINK] = { .name = "link", .type = BLOBMSG_TYPE_STRING },
	[TUNNEL_ATTR_FMRS] = { .name = "fmrs", .type = BLOBMSG_TYPE_ARRAY },
};

const struct uci_blob_param_list tunnel_attr_list = {
	.n_params = __TUNNEL_ATTR_MAX,
	.params = tunnel_attrs,
};

/** tunnel device 私有操作接口定义 */
const struct device_type tunnel_device_type = {
	.name = "IP tunnel",
	.config_params = &tunnel_attr_list,
	.reload = tunnel_reload,
	.create = tunnel_create,
	.free = tunnel_free,
};
```

### 接口说明

```c
/**
 * 创建tunnel device object
 *
 * @param name tunnel device name
 * @param attr configure of tunnel device
 * @return tunnel device object
 */
static struct device * tunnel_create(const char *name, struct blob_attr *attr)
```

```c
/**
 * 删除tunnel device object
 */
static void tunnel_free(struct device *dev)
```

```c
/**
 * 加载tunnel device配置
 *
 * @param dev tunnel device object
 * @param attr configure of tunnel device
 * @return device change type enum
 */
static enum dev_change_type tunnel_reload(struct device *dev, struct blob_attr *attr)
```

```c
/**
 * 调用底层接口创建/删除tunnel网络设备
 *
 * @param dev tunnel device object
 * @param up true-add false-delete
 */
static int tunnel_set_state(struct device *dev, bool up)
```
