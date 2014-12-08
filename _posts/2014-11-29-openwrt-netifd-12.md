---
layout: post
title: "netifd [12] - main"
date: 2014-11-29
category: openwrt
tags: openwrt netifd
---

## 流程
* 分析输入参数 
* 初始化信号处理回调接口 netifd_setup_signals()
* 初始化ubus netifd_ubus_init()
* 初始shell proto proto_shell_init()
* 初始化wireless wireless_init()
* 初始化system底层rtnl/ioctl system_init()
* 初始化配置 config_init_all()
* 启动主循环 uloop_run()


## 全局初始化
```c
/*
 * 初始化全局别名对象avl tree
 */
static void __init alias_init(void)

/**
 * 初始化全局device对象avl tree
static void __init dev_init(void)

/**
 * 初始化全局interface对象avl tree
 */
static void __init interface_init_list(void)

/**
 * 初始化全局iprule对象链表
 */
static void __init iprule_init_list(void)

/**
 * 加载static proto类型
 */
static void __init static_proto_init(void)
```