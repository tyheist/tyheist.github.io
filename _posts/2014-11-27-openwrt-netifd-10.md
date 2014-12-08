---
layout: post
title: "netifd [10] - ubus"
date: 2014-11-27
category: openwrt
tags: openwrt netifd
---

## 属性定义
```c
enum {
	HR_TARGET,
	HR_V6,
	HR_INTERFACE,
	__HR_MAX
};

static const struct blobmsg_policy route_policy[__HR_MAX] = {
	[HR_TARGET] = { .name = "target", .type = BLOBMSG_TYPE_STRING },
	[HR_V6] = { .name = "v6", .type = BLOBMSG_TYPE_BOOL },
	[HR_INTERFACE] = { .name = "interface", .type = BLOBMSG_TYPE_STRING },
};

enum {
	DI_NAME,
	__DI_MAX
};

static const struct blobmsg_policy dynamic_policy[__DI_MAX] = {
	[DI_NAME] = { .name = "name", .type = BLOBMSG_TYPE_STRING },
};

/** netifd全局ubus接口定义 */
static struct ubus_method main_object_methods[] = {
	{ .name = "restart", .handler = netifd_handle_restart },
	{ .name = "reload", .handler = netifd_handle_reload },
	UBUS_METHOD("add_host_route", netifd_add_host_route, route_policy),
	{ .name = "get_proto_handlers", .handler = netifd_get_proto_handlers },
	UBUS_METHOD("add_dynamic", netifd_add_dynamic, dynamic_policy),
};

/** netifd全局ubus对象类型定义 */
static struct ubus_object_type main_object_type =
	UBUS_OBJECT_TYPE("netifd", main_object_methods);

/** netifd全局ubus对象定义 */
static struct ubus_object main_object = {
	.name = "network",
	.type = &main_object_type,
	.methods = main_object_methods,
	.n_methods = ARRAY_SIZE(main_object_methods),
};
```

```c
enum {
	DEV_NAME,
	__DEV_MAX,
};

static const struct blobmsg_policy dev_policy[__DEV_MAX] = {
	[DEV_NAME] = { .name = "name", .type = BLOBMSG_TYPE_STRING },
};

enum {
	ALIAS_ATTR_ALIAS,
	ALIAS_ATTR_DEV,
	__ALIAS_ATTR_MAX,
};

static const struct blobmsg_policy alias_attrs[__ALIAS_ATTR_MAX] = {
	[ALIAS_ATTR_ALIAS] = { "alias", BLOBMSG_TYPE_ARRAY },
	[ALIAS_ATTR_DEV] = { "device", BLOBMSG_TYPE_STRING },
};

enum {
	DEV_STATE_NAME,
	DEV_STATE_DEFER,
	__DEV_STATE_MAX,
};

static const struct blobmsg_policy dev_state_policy[__DEV_STATE_MAX] = {
	[DEV_STATE_NAME] = { .name = "name", .type = BLOBMSG_TYPE_STRING },
	[DEV_STATE_DEFER] = { .name = "defer", .type = BLOBMSG_TYPE_BOOL },
};

static const struct blobmsg_policy iface_policy = {
	.name = "interface",
	.type = BLOBMSG_TYPE_STRING,
};
```

```c
static struct ubus_method dev_object_methods[] = {
	UBUS_METHOD("status", netifd_dev_status, dev_policy),
	UBUS_METHOD("set_alias", netifd_handle_alias, alias_attrs),
	UBUS_METHOD("set_state", netifd_handle_set_state, dev_state_policy),
};

static struct ubus_object_type dev_object_type =
	UBUS_OBJECT_TYPE("device", dev_object_methods);

static struct ubus_object dev_object = {
	.name = "network.device",
	.type = &dev_object_type,
	.methods = dev_object_methods,
	.n_methods = ARRAY_SIZE(dev_object_methods),
};
```

```c
static struct ubus_method iface_object_methods[] = {
	{ .name = "up", .handler = netifd_handle_up },
	{ .name = "down", .handler = netifd_handle_down },
	{ .name = "status", .handler = netifd_handle_status },
	{ .name = "prepare", .handler = netifd_handle_iface_prepare },
	{ .name = "dump", .handler = netifd_handle_dump },
	UBUS_METHOD("add_device", netifd_iface_handle_device, dev_policy ),
	UBUS_METHOD("remove_device", netifd_iface_handle_device, dev_policy ),
	{ .name = "notify_proto", .handler = netifd_iface_notify_proto },
	{ .name = "remove", .handler = netifd_iface_remove },
	{ .name = "set_data", .handler = netifd_handle_set_data },
};

static struct ubus_object_type iface_object_type =
	UBUS_OBJECT_TYPE("netifd_iface", iface_object_methods);

static struct ubus_object iface_object = {
	.name = "network.interface",
	.type = &iface_object_type,
	.n_methods = ARRAY_SIZE(iface_object_methods),
};
```

```c
static struct ubus_method wireless_object_methods[] = {
	{ .name = "up", .handler = netifd_handle_wdev_up },
	{ .name = "down", .handler = netifd_handle_wdev_down },
	{ .name = "status", .handler = netifd_handle_wdev_status },
	{ .name = "notify", .handler = netifd_handle_wdev_notify },
	{ .name = "get_validate", .handler = netifd_handle_wdev_get_validate },
};

static struct ubus_object_type wireless_object_type =
	UBUS_OBJECT_TYPE("netifd_iface", wireless_object_methods);

static struct ubus_object wireless_object = {
	.name = "network.wireless",
	.type = &wireless_object_type,
	.methods = wireless_object_methods,
	.n_methods = ARRAY_SIZE(wireless_object_methods),
};
```

## 接口说明
### main
```c
/**
 * 连接ubusd，添加main_object/dev_object/wireless_object
 */
int netifd_ubus_init(const char *path)
```

```c
/**
 * 重启netifd进程
 * 命令：network restart
 */
static int netifd_handle_restart(struct ubus_context *ctx, struct ubus_object *obj,
		      struct ubus_request_data *req, const char *method,
		      struct blob_attr *msg)

/**
 * 重新加载所有UCI配置
 * 命令：network reload
 */
static int netifd_handle_reload(struct ubus_context *ctx, struct ubus_object *obj,
		     struct ubus_request_data *req, const char *method,
		     struct blob_attr *msg)

/**
 * 添加主机路由
 * 命令：network add_host_route
 */
static int netifd_add_host_route(struct ubus_context *ctx, struct ubus_object *obj,
		      struct ubus_request_data *req, const char *method,
		      struct blob_attr *msg)		     

/**
 * 获取所有proto类型handler的参数列表
 * 命令：network get_proto_handlers
 */
static int
netifd_get_proto_handlers(struct ubus_context *ctx, struct ubus_object *obj,
			  struct ubus_request_data *req, const char *method,
			  struct blob_attr *msg)

/**
 * 添加动态interface
 * 命令：network add_dynamic
 */
static int netifd_add_dynamic(struct ubus_context *ctx, struct ubus_object *obj,
		      struct ubus_request_data *req, const char *method,
		      struct blob_attr *msg)
```		      

### device
```c
/**
 * 获取device信息
 * 命令：network.device status
 */
static int netifd_dev_status(struct ubus_context *ctx, struct ubus_object *obj,
		  struct ubus_request_data *req, const char *method,
		  struct blob_attr *msg)

/**
 * 设置别名device
 * 命令：network.device set_alias
 */
static int netifd_handle_alias(struct ubus_context *ctx, struct ubus_object *obj,
		    struct ubus_request_data *req, const char *method,
		    struct blob_attr *msg)

/**
 * 设置device state
 * 命令：network.device set_state
 */
static int netifd_handle_set_state(struct ubus_context *ctx, struct ubus_object *obj,
			struct ubus_request_data *req, const char *method,
			struct blob_attr *msg)
```

### interface
```c
/**
 * up interface object
 * 命令：network.interface.{name} up
 */
static int netifd_handle_up(struct ubus_context *ctx, struct ubus_object *obj,
		 struct ubus_request_data *req, const char *method,
		 struct blob_attr *msg)

/**
 * down interface object
 * 命令：network.interface.{name} down
 */
static int netifd_handle_down(struct ubus_context *ctx, struct ubus_object *obj,
		   struct ubus_request_data *req, const char *method,
		   struct blob_attr *msg)

/**
 * 获取interface信息
 * 命令：network.interface.{name} status
 */
static int netifd_handle_status(struct ubus_context *ctx, struct ubus_object *obj,
		     struct ubus_request_data *req, const char *method,
		     struct blob_attr *msg)

/**
 * interface预处理
 * 命令：network.interface.{name} prepare
 */
static int netifd_handle_iface_prepare(struct ubus_context *ctx, struct ubus_object *obj,
			    struct ubus_request_data *req, const char *method,
			    struct blob_attr *msg)

/**
 * 获取所有interface信息
 * 命令：network.interface dump
 */
static int netifd_handle_dump(struct ubus_context *ctx, struct ubus_object *obj,
		     struct ubus_request_data *req, const char *method,
		     struct blob_attr *msg)

/**
 * interface添加/删除device
 * 命令：network.interface.{name} add_device
 *       network.interface.{name} remove_device
 */
static int netifd_iface_handle_device(struct ubus_context *ctx, struct ubus_object *obj,
			   struct ubus_request_data *req, const char *method,
			   struct blob_attr *msg)

/**
 * interface proto通知 
 * 命令：network.interface.{name} notify_proto
 /
static int netifd_iface_notify_proto(struct ubus_context *ctx, struct ubus_object *obj,
			  struct ubus_request_data *req, const char *method,
			  struct blob_attr *msg)

/**
 * 删除interface对象
 * 命令：network.interface.{name} remove
 */
static int netifd_iface_remove(struct ubus_context *ctx, struct ubus_object *obj,
		    struct ubus_request_data *req, const char *method,
		    struct blob_attr *msg)

/**
 * interface添加私有数据
 * 命令：network.interface.{name} set_data
 */
static int netifd_handle_set_data(struct ubus_context *ctx, struct ubus_object *obj,
		       struct ubus_request_data *req, const char *method,
		       struct blob_attr *msg)
```

### wireless
```c
/**
 * wireless device up
 * 命令：network.wireless.{name} up
 */
static int netifd_handle_wdev_up(struct ubus_context *ctx, struct ubus_object *obj,
		      struct ubus_request_data *req, const char *method,
		      struct blob_attr *msg)

/**
 * wireless device down
 * 命令：network.wireless.{name} down
 */
static int netifd_handle_wdev_down(struct ubus_context *ctx, struct ubus_object *obj,
			struct ubus_request_data *req, const char *method,
			struct blob_attr *msg)

/**
 * 获取wireless device信息
 * 命令：network.wireless status
 */
static int netifd_handle_wdev_status(struct ubus_context *ctx, struct ubus_object *obj,
			  struct ubus_request_data *req, const char *method,
			  struct blob_attr *msg)

/**
 * wireless device消息通知
 * 命令：network.wireless notify
 */
static int netifd_handle_wdev_notify(struct ubus_context *ctx, struct ubus_object *obj,
			  struct ubus_request_data *req, const char *method,
			  struct blob_attr *msg)

/**
 * 获取生效wireless device信息
 * 命令：network.wireless get_validate
 */
static int netifd_handle_wdev_get_validate(struct ubus_context *ctx, struct ubus_object *obj,
			  struct ubus_request_data *req, const char *method,
			  struct blob_attr *msg)
```