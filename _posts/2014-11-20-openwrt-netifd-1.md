---
layout: post
title: "netifd [1] - system"
date: 2014-11-20
category: openwrt
tags: openwrt netifd
---

## system
提供底层操作网络设备API，通过`ioctl`、`rtnl`与内核通信，依懒libnl库

### init

```c
int system_init(void)
```

* 创建ioctl socket `sock_ioctl`
* 创建rtnl socket `sock_rtnl`
* 创建`NETLINK_ROUTE`协议类型rtnl socket，回调函数`cb_rtnl_event`
* 创建`NETLINK_KOBJECT_UEVENT`协议类型rtnl socket，回调函数`handle_hotplug_event`

### bridge
#### addbr

```c
/**
 * 创建bridge接口
 */
int system_bridge_addbr(struct device *bridge, struct bridge_config *cfg)
```

* 根据输入参数cfg->stp设置bridge的STP开关
* 根据输入参数cfg->forward_delay设置bridge的forward_delay
* 根据输入参数cfg->igmp_snoop设置bridge的igmp snoop功能
* 根据输入参数cfg->priority设置bridge的优先级
* 根据输入参数cfg->flags设置bridge标志`BRCTL_SET_AGEING_TIME`、`BRIDGE_SET_HELLO_TIME`、`BRCTL_SET_BRIDGE_MAX_AGE`

#### delbr

```c
/**
 * 删除bridge接口
 */
int system_bridge_delbr(struct device *bridge)
```

#### addif

```c
/**
 * 把接口dev绑到bridge接口上
 */
int system_bridge_addif(struct device *bridge, struct device *dev)
```

* 判断接口已绑到bridge，如果已绑则退出
* 上述判断是通过`/sys/devices/virtual/net/*/brif/%s/bridge`中的内容判断，此目录可能不存在，请注意

#### delif

```c
/**
 * 把接口dev从bridge接口上解绑
 */
int system_bridge_delif(struct device *bridge, struct device *dev)
```

### macvlan

```c
/**
 * 创建macvlan接口
 */
int system_macvlan_add(struct device *macvlan, struct device *dev, struct macvlan_config *cfg)
```

```c
/**
 * 删除macvlan接口
 */
int system_macvlan_del(struct device *macvlan)
```

### vlan
```c
/**
 * 创建vlan接口
 */
int system_vlan_add(struct device *dev, int id)
```

```c
/**
 * 删除vlan接口
 */
int system_vlan_del(struct device *dev)
```

### vlandev
```c
/**
 * 创建vlan接口，可支持802.1ad
 */
int system_vlandev_add(struct device *vlandev, struct device *dev, struct vlandev_config *cfg)
```

```c
/**
 * 删除vlan接口
 */
int system_vlandev_del(struct device *vlandev)
```

### if
```c
/**
 * 清除dev接口状态，与dev相关的route/rule/address
 */
void system_if_clear_state(struct device *dev)
```

```c
/**
 * 保存老配置，设置接口MTU/TXQUEUELEN/MAC/IPv6开关，up接口
 */
int system_if_up(struct device *dev)
```

```c
/**
 * down接口，还原旧配置
 */
int system_if_down(struct device *dev)
```

```c
/**
 * 检查dev状态
 */
int system_if_check(struct device *dev)
```

```c
/**
 * 返回dev信息link-advertising/link-supported/speed
 */
int system_if_dump_info(struct device *dev, struct blob_buf *b)
```

```c
/**
 * 返回dev状态，读取`/sys/class/net/%s/statistics`目录
 */
int system_if_dump_stats(struct device *dev, struct blob_buf *b)
```

```c
/**
 * 返回dev的父dev
 */
struct device *system_if_get_parent(struct device *dev)
```

```c
/**
 * 根据参数设置接口MTU/TXQUEUELEN/MAC/IPv6开关
 */
void system_if_apply_settings(struct device *dev, struct device_settings *s,
			      unsigned int apply_mask)
```

```c
/**
 * 设置dev ipv4或ipv6地址
 */
int system_add_address(struct device *dev, struct device_addr *addr)
```

```c
/**
 * 删除dev ipv4或ipv6地址
 */
int system_del_address(struct device *dev, struct device_addr *addr)
```

```c
/**
 * 更新接口ipv6的MTU
 */
int system_update_ipv6_mtu(struct device *dev, int mtu)
```

### route
```c
/**
 * 添加路由
 */
int system_add_route(struct device *dev, struct device_route *route)
```

```c
/**
 * 删除路由
 */
int system_del_route(struct device *dev, struct device_route *route)
```

```c
/**
 * 刷新路由表
 */
int system_flush_routes(void)
```

```c
/**
 * 由路由表名解析路由表ID
 */
bool system_resolve_rt_table(const char *name, unsigned int *id)
```

### iprule
```c
/**
 * 添加策略路由表
 */
int system_add_iprule(struct iprule *rule)
```

```c
/**
 * 删除策略路由表
 */
int system_del_iprule(struct iprule *rule)
```

```c
/**
 * 刷新策略路由表
 */
int system_flush_iprules(void)
```

```c
/**
 * 根据action名称解析对应ID
 */
bool system_resolve_iprule_action(const char *action, unsigned int *id)
```

### tunnel
```c
/**
 * 添加ip tunnel
 */
int system_add_ip_tunnel(const char *name, struct blob_attr *attr)
```

```c
/**
 * 删除ip tunnel
 */
int system_del_ip_tunnel(const char *name)
```
