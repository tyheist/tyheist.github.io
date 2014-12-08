---
layout: post
title: "procd"
date: 2014-11-18
category: openwrt
tags: openwrt procd
---

## 系统启动顺序
* bootloader加载内核
* 内核开动，同时扫描mtd文件系统分区
* 内核执行/etc/preinit脚本
* /etc/preinit执行/sbin/init二进制程序
* /sbin/init根据/etc/inittab定义执行启动过程
* /etc/inittab首先执行/etc/init.d/rcS，此脚本将顺序启动/etc/rc.d/目录以S开关的脚本

## /sbin/init
### early()
* mount `/proc` `/sys` `/tmp` `/dev` `/dev/pts`目录(early_mount)
* 创建设备节点和/dev/null文件结点(early_dev)
* 设置PATH环境变量(early_env)
* 初始化/dev/console

### cmdline()
* 根据/proc/cmdline内容init_debug=([0-9]+)判断debug级别

### watchdog_init()
* 初始化内核watchdog(/dev/watchdog)

### 加载内核模块
* 创建子进程/sbin/kmodloader加载/etc/modules-boot.d/目录中的内核模块

### preinit()
* 创建子进程执行/etc/preinit脚本，此时PREINIT环境变量被设置为1，主进程同时使用uloop_process_add()把/etc/preinit子进程加入uloop进行监控，当/etc/preinit执行结束时回调plugd_proc_cb()函数把监控/etc/preinit进程对应对象中pid属性设置为0，表示/etc/preinit已执行完成

* 创建子进程执行/sbin/procd -h
/etc/hotplug-preinit.json，主进程同时使用uloop_process_add()把/sbin/procd子进程加入uloop进行监控，当/sbin/procd进程结束时回调spawn_procd()函数

* spawn_procd()函数繁衍后继真正使用的/sbin/procd进程，从/tmp/debuglevel读出debug级别并设置到环境变量DBGLVL中，把watchdog fd设置到环境变量WDTFD中，最后调用execvp()繁衍/sbin/procd进程

## watchdog
如果存在/dev/watchdog设备，设置watchdog timeout等于30秒，如果内核在30秒内没有收到任何数据将重启系统。用户状进程使用uloop定时器设置5秒周期向/dev/wathdog设备写一些数据通知内核，表示此用户进程在正常工作

```c
/**
 * 初始化watchdog
 */
void watchdog_init(int preinit)

/**
 * 设备通知内核/dev/watchdog频率(缺省为5秒)
 * 返回老频率值
 */
int watchdog_frequency(int frequency)

/**
 * 设备内核/dev/watchdog超时时间
 * 当参数timeout<=0时，表示从返回值获取当前超时时间
 */
int watchdog_timeout(int timeout)

/**
 * val为true时停止用户状通知定时器，意味着30秒内系统将重启
 */
void watchdog_set_stopped(bool val)
```

## signal
信息处理，下面为procd对不同信息的处理方法

* SIGBUS、SIGSEGV信号将调用do_reboot() RB_AUTOBOOT重启系统
* SIGHUP、SIGKILL、SIGSTOP信号将被忽略
* SIGTERM信号使用RB_AUTOBOOT事件重启系统
* SIGUSR1、SIGUSR2信号使用RB_POWER_OFF事件关闭系统

## procd
procd有5个状态，分别为`STATE_EARLY`、`STATE_INIT`、`STATE_RUNNING`、`STATE_SHUTDOWN`、`STATE_HALT`，这5个状态将按顺序变化，当前状态保存在全局变量`state`中，可通过`procd_state_next()`函数使用状态发生变化

### STATE_EARLY状态 - init前准备工作
* 初始化watchdog
* 根据"/etc/hotplug.json"规则监听hotplug
* procd_coldplug()函数处理，把/dev挂载到tmpfs中，fork udevtrigger进程产生冷插拔事件，以便让hotplug监听进行处理
* udevstrigger进程处理完成后回调procd_state_next()函数把状态从`STATE_EARLY`转变为`STATE_INIT`

### STATE_INIT状态 - 初始化工作
* 连接ubusd，此时实际上ubusd并不存在，所以procd_connect_ubus函数使用了定时器进行重连，而uloop_run()需在初始化工作完成后才真正运行。当成功连接上ubusd后，将注册service `main_object`对象，`system_object`对象、`watch_event`对象(procd_connect_ubus()函数)，
* 初始化services（服务）和validators（服务验证器）全局AVL tree
* 把ubusd服务加入services管理对象中(service_start_early)
* 根据/etc/inittab内容把cmd、handler对应关系加入全局链表actions中
* 顺序加载`respawn`、`askconsole`、`askfirst`、`sysinit`命令
* sysinit命令把/etc/rc.d/目录下所有启动脚本执行完成后将回调rcdone()函数把状态从`STATE_INITl`转变为`STATE_RUNNING`

### STATE_RUNNING状态 
* 进入`STATE_RUNNING`状态后procd运行`uloop_run()`主循环

## trigger任务队列
### 数据结构

```c
struct trigger {
	struct list_head list;

	char *type;

	int pending;
	int remove;
	int timeout;

	void *id;

	struct blob_attr *rule;
	struct blob_attr *data;
	struct uloop_timeout delay;

	struct json_script_ctx jctx;
};

struct cmd {
	char *name;
	void (*handler)(struct job *job, struct blob_attr *exec, struct blob_attr *env);
};

struct job {
	struct runqueue_process proc;
	struct cmd *cmd;
	struct trigger *trigger;
	struct blob_attr *exec;
	struct blob_attr *env;
};
```

### 接口说明 

```c
/**
 * 初始化trigger任务队列
 */
void trigger_init(void)

/**
 * 把服务和服务对应的规则加入trigger任务队列
 */
void trigger_add(struct blob_attr *rule, void *id)

/**
 * 把服务从trigger任务队列中删除
 */
void trigger_del(void *id)

/**
 * 
 */
void trigger_event(const char *type, struct blob_attr *data)
```

## service
| Name	| Handler |	Blob_msg policy	|
| ----
| set |	service_handle_set | service_set_attrs |
| add |	service_handle_set | service_set_attrs |	
| list | 	service_handle_list | service_attrs |	
| delete |	service_handle_delete | service_del_attrs |
| update_start | service_handle_update | service_attrs |
| update_complete |	service_handle_update |	service_attrs |
| event | service_handle_event | event_policy |
| validate | service_handle_validate | validate_policy	|


## system
| Name | Handler | Blob_msg policy |
| ---
| board	| system_board | 
| info | system_info	|
| upgrade | system_upgrade	|
| watchdog | watchdog_set | watchdog_policy |
| signal | proc_signal | signal_policy |
| nandupgrade| nand_set | nand_policy |


## shell调用接口
> 代码库路径: package/system/procd/files/procd.sh
> 设备上路径: /lib/functions/procd.sh

/etc/init.d/daemon

```bash
#!/bin/sh /etc/rc.common

START=80
STOP=20

USE_PROCD=1

start_service()
{
    procd_open_instance
    procd_set_param command /sbin/daemon
    procd_set_param respawn
    procd_close_instance
}
```















