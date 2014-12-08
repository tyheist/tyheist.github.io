---
layout: post
title: "netifd [8] - iprule"
date: 2014-11-26
category: openwrt
tags: openwrt netifd
---

## 数据结构
```c
enum iprule_flags {
	/* address family for rule */
	IPRULE_INET4		= (0 << 0),
	IPRULE_INET6		= (1 << 0),
	IPRULE_FAMILY		= IPRULE_INET4 | IPRULE_INET6,

	/* rule specifies input device */
	IPRULE_IN			= (1 << 2),

	/* rule specifies output device */
	IPRULE_OUT			= (1 << 3),

	/* rule specifies src */
	IPRULE_SRC			= (1 << 4),

	/* rule specifies dest */
	IPRULE_DEST			= (1 << 5),

	/* rule specifies priority */
	IPRULE_PRIORITY		= (1 << 6),

	/* rule specifies diffserv/tos */
	IPRULE_TOS			= (1 << 7),

	/* rule specifies fwmark */
	IPRULE_FWMARK		= (1 << 8),

	/* rule specifies fwmask */
	IPRULE_FWMASK		= (1 << 9),

	/* rule performs table lookup */
	IPRULE_LOOKUP		= (1 << 10),

	/* rule performs routing action */
	IPRULE_ACTION		= (1 << 11),

	/* rule is a goto */
	IPRULE_GOTO			= (1 << 12),
};

struct iprule {
	struct vlist_node node;
	unsigned int order;

	/* everything below is used as avl tree key */
	enum iprule_flags flags;

	bool invert;

	char in_dev[IFNAMSIZ + 1];   /** 进站网络设备名称 */
	char out_dev[IFNAMSIZ + 1];  /** 出站网络设备名称 */

	unsigned int src_mask;       /** 源地址掩码 */
	union if_addr src_addr;      /** 源地址     */

	unsigned int dest_mask;      /** 目的地址掩码 */
	union if_addr dest_addr;     /** 目的地址     */

	unsigned int priority;       /** 优先级 */
	unsigned int tos;

	unsigned int fwmark;         /** iptables mark */
	unsigned int fwmask;         /** iptables mark mask */

	unsigned int lookup;         /** 查询路由表ID */
	unsigned int action;         /** 动作 */
	unsigned int gotoid;
};
```

## 接口说明
```c
/** 初始化iprule模块 */
static void __init iprule_init_list(void)
```

```c
/**
 * 添加iprule到全局链表中
 *
 * @param attr configure of iprule
 * @param v6 true - is ipv6, false - is ipv4
 */
void iprule_add(struct blob_attr *attr, bool v6)

/**
 * 调用底层接口更新iprule
 * 此函数在调用iprule_add()将自动被执行
 */
static void iprule_update_rule(struct vlist_tree *tree,
                   struct vlist_node *node_new, struct vlist_node *node_old)
```
