---
layout: post
title: "netifd [11] - wireless"
date: 2014-11-28
category: openwrt
tags: openwrt netifd
---

## 数据结构
```c
/** 无线驱动对象 */
struct wireless_driver {
	struct avl_node node;

	const char *name;
	const char *script;

	struct {
		char *buf;
		struct uci_blob_param_list *config;
	} device, interface;
};

/** 无线device对象 */
struct wireless_device {
	struct vlist_node node;

	struct wireless_driver *drv; /** wireless drive object */
	struct vlist_tree interfaces;
	char *name;

	struct netifd_process script_task;
	struct uloop_timeout timeout;
	struct uloop_timeout poll;

	struct list_head script_proc;
	struct uloop_fd script_proc_fd;
	struct uloop_timeout script_check;

	struct ubus_request_data *kill_request;

	struct blob_attr *config;
	struct blob_attr *data;

	bool config_autostart;
	bool autostart;
	bool disabled;

	enum interface_state state;
	enum interface_config_state config_state;
	bool cancel;
	int retry;

	int vif_idx;
};

/** 无线interface对象 */
struct wireless_interface {
	struct vlist_node node;
	const char *section;
	char *name;

	struct wireless_device *wdev;

	struct blob_attr *config;
	struct blob_attr *data;

	const char *ifname;
	struct blob_attr *network;
};

struct wireless_process {
	struct list_head list;

	const char *exe;
	int pid;

	bool required;
};
```

## 接口说明
```c
/** 
 * 初始化无线模块 
 */
void wireless_init(void)

/**
 * 启用所有处于挂起的wireless device对象
 */
void wireless_start_pending(void)
```

```c
/** 
 * 创建wireless device对象
 */
void wireless_device_create(struct wireless_driver *drv, const char *name, struct blob_attr *data)

/**
 * 创建wireless interface对象
 */
void wireless_interface_create(struct wireless_device *wdev, struct blob_attr *data, const char *section)
```

```c
/**
 * 启用wireless device
 */
void wireless_device_set_up(struct wireless_device *wdev)

/**
 * 停用wireless device
 */
void wireless_device_set_down(struct wireless_device *wdev)
```

```c
/**
 * 获取wireless device状态信息
 */
void wireless_device_status(struct wireless_device *wdev, struct blob_buf *b)

/**
 * 获取wireless device有效信息
 */
void wireless_device_get_validate(struct wireless_device *wdev, struct blob_buf *b)
```

```c
/**
 * wireless device消息处理
 */
int wireless_device_notify(struct wireless_device *wdev, struct blob_attr *data,
			   struct ubus_request_data *req)
```