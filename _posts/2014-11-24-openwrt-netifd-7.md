---
layout: post
title: "netifd [7] - proto none/static/shell"
date: 2014-11-24
category: openwrt
tags: openwrt netifd
---

## none
### 属性定义
```c
static const struct proto_handler no_proto = {
	.name = "none",
	.flags = PROTO_FLAG_IMMEDIATE,
	.attach = default_proto_attach,
};
```

### 接口说明
```c
/**
 * 默认proto类型绑定接口
 */
static struct interface_proto_state * default_proto_attach(const struct proto_handler *h,
		     struct interface *iface, struct blob_attr *attr)

/**
 * do nothing
 */
static int no_proto_handler(struct interface_proto_state *proto,
		 enum interface_proto_cmd cmd, bool force)		     

/**
 * do nothing
 */
static void default_proto_free(struct interface_proto_state *proto)		 
```		     

## static
### 数据结构
```c
/** 静态proto类型对象，继承struct interface_prot_state对象 */
struct static_proto_state {
	struct interface_proto_state proto;

	struct blob_attr *config;
};
```

### 属性定义
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

static struct proto_handler static_proto = {
	.name = "static",
	.flags = PROTO_FLAG_IMMEDIATE,
	.config_params = &proto_ip_attr,
	.attach = static_attach,
};
```

### 接口说明
```c
/**
 * 初始把静态proto类型处理对象加入到全局proto链表
 */
static void __init static_proto_init(void)
```

```c
/**
 * 绑定静态proto类型处理对象到interface对象
 *
 * @param h proto handler object
 * @param iface interface object
 * @param attr configure of static ip proto
 * @return interface proto state object
 */
static struct interface_proto_state * static_attach(const struct proto_handler *h, struct interface *iface,
	      struct blob_attr *attr)

/**
 * 销毁静态proto state对象
 */
static void static_free(struct interface_proto_state *proto)

/**
 * 静态proto处理接口
 */
static int static_handler(struct interface_proto_state *proto,
	       enum interface_proto_cmd cmd, bool force)

/**
 * 设置静态proto配置
 */
static bool static_proto_setup(struct static_proto_state *state)
```

## shell
### 数据结构
```c
enum proto_shell_sm {
	S_IDLE,
	S_SETUP,
	S_SETUP_ABORT,
	S_TEARDOWN,
};

/** shell hanlder对象，继承struct proto_handler对象 */
struct proto_shell_handler {
	struct list_head list;
	struct proto_handler proto;
	char *config_buf;
	char *script_name;
	bool init_available;

	struct uci_blob_param_list config;
};

struct proto_shell_dependency {
	struct list_head list;

	char *interface;
	struct proto_shell_state *proto;
	struct interface_user dep;

	union if_addr host;
	bool v6;
};

/** shell proto类型对象，继承struct interface_prot_state对象 */
struct proto_shell_state {
	struct interface_proto_state proto;
	struct proto_shell_handler *handler;
	struct blob_attr *config;

	struct uloop_timeout teardown_timeout;

	struct netifd_process script_task;
	struct netifd_process proto_task;

	enum proto_shell_sm sm;
	bool proto_task_killed;

	int last_error;

	struct list_head deps;
};
```

### 属性定义
```c
enum {
	NOTIFY_ACTION,
	NOTIFY_ERROR,
	NOTIFY_COMMAND,
	NOTIFY_ENV,
	NOTIFY_SIGNAL,
	NOTIFY_AVAILABLE,
	NOTIFY_LINK_UP,
	NOTIFY_IFNAME,
	NOTIFY_ADDR_EXT,
	NOTIFY_ROUTES,
	NOTIFY_ROUTES6,
	NOTIFY_TUNNEL,
	NOTIFY_DATA,
	NOTIFY_KEEP,
	NOTIFY_HOST,
	NOTIFY_DNS,
	NOTIFY_DNS_SEARCH,
	__NOTIFY_LAST
};

static const struct blobmsg_policy notify_attr[__NOTIFY_LAST] = {
	[NOTIFY_ACTION] = { .name = "action", .type = BLOBMSG_TYPE_INT32 },
	[NOTIFY_ERROR] = { .name = "error", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_COMMAND] = { .name = "command", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_ENV] = { .name = "env", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_SIGNAL] = { .name = "signal", .type = BLOBMSG_TYPE_INT32 },
	[NOTIFY_AVAILABLE] = { .name = "available", .type = BLOBMSG_TYPE_BOOL },
	[NOTIFY_LINK_UP] = { .name = "link-up", .type = BLOBMSG_TYPE_BOOL },
	[NOTIFY_IFNAME] = { .name = "ifname", .type = BLOBMSG_TYPE_STRING },
	[NOTIFY_ADDR_EXT] = { .name = "address-external", .type = BLOBMSG_TYPE_BOOL },
	[NOTIFY_ROUTES] = { .name = "routes", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_ROUTES6] = { .name = "routes6", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_TUNNEL] = { .name = "tunnel", .type = BLOBMSG_TYPE_TABLE },
	[NOTIFY_DATA] = { .name = "data", .type = BLOBMSG_TYPE_TABLE },
	[NOTIFY_KEEP] = { .name = "keep", .type = BLOBMSG_TYPE_BOOL },
	[NOTIFY_HOST] = { .name = "host", .type = BLOBMSG_TYPE_STRING },
	[NOTIFY_DNS] = { .name = "dns", .type = BLOBMSG_TYPE_ARRAY },
	[NOTIFY_DNS_SEARCH] = { .name = "dns_search", .type = BLOBMSG_TYPE_ARRAY },
};
```

### 接口说明
```c
/**
 * 根据/lib/netifd/proto/目录中shell脚本定义初始化对应的handler
 */
void proto_shell_init(void)

/**
 * 根据每个shell脚本定义创建handler，并添加到全局链表中
 *
 * @param script shell script name
 * @param name proto name
 * @parm obj json object of shell script definition
 */
static void proto_shell_add_handler(const char *script, const char *name, json_object *obj)

/**
 * 生成shell state对象并进行初始化
 *
 * @param h proto handler object
 * @param iface interface object
 * @param attr configure of shell proto
 * @return interface state object
 */
static struct interface_proto_state * proto_shell_attach(const struct proto_handler *h, 
                struct interface *iface, struct blob_attr *attr)
```

```c
/**
 * 销毁shell proto state对象
 */
static void proto_shell_free(struct interface_proto_state *proto)

/**
 * shell proto消息处理
 *
 * @param proto proto state object
 * @param attr configure of notify
 * @return 0 - success, 非0 - failed
 */
static int proto_shell_notify(struct interface_proto_state *proto, struct blob_attr *attr)

/**
 * 根据事件类型调用对应shell proto脚本命令
 *
 * @param proto proto state object
 * @param cmd proto command
 * @return  0 - success, 非0 - failed
 */
static int proto_shell_handler(struct interface_proto_state *proto,
		    enum interface_proto_cmd cmd, bool force)

/**
 * shell脚本子进程执行完成后回调函数
 */
static void proto_shell_script_cb(struct netifd_process *p, int ret)
```