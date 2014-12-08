---
layout: post
title: "netifd [9] - config"
date: 2014-11-26
category: openwrt
tags: openwrt netifd
---

## 接口说明
```c
/**
 * 根据UCI配置文件初始化device/interface/route/rule/wireless
 * 启动配置
 */
void config_init_all(void)
```

```c
/**
 * 调用UCI接口打指定UCI配置文件
 *
 * @param config configure file name
 * @return uci package object
 */
static struct uci_package *config_init_package(const char *config)
```

```c
/**
 * 根据network uci配置文件中'device'会话，创建对应device对象
 */
static void config_init_devices(void)

/**
 * 根据network uci配置文件中'interface'会话，创建对应interface对象
 */
static void config_init_interfaces(void)

/**
 * 根据network uci配置文件中'route'会话，创建对应route对象
 */
static void config_init_routes()

/**
 * 根据network uci配置文件中'rule'会话，创建对象iprule对象
 */
static void config_init_rules(void)

/**
 * 根据wireless uci配置文件，他都对象wireless对象
 */
static void config_init_wireless(void)
```
