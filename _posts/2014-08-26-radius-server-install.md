---
layout: post
title: "radius server简单安装配置方法"
date: 2014-08-26
category: tools
tags: tools
---

# 安装 #

```bash
sudo aptitude install freeradius
```

---

# 添加测试用户 #
用户名为`test`，密码为`111111`

```bash
sudo echo "test Cleartext-Password := \"111111\"" >> /etc/freeradius/users
```
---

# 添加client网段 #

```bash
vim /etc/freeradius/clients.conf
```

加入下面内容，表示只接受`192.168.26.0`这个网段的client进行radius认证，
其中共享密钥为`testing123`

```bash
client 192.168.26.0/24 {
        secret = testing123
        shortname = test-radius
}
```

---

# 重启radius服务

```bash
sudo service freeradius restart
```
---

# 测试
在192.168.26.0/24网段的PC，或直接用本机

```bash
radtest test 111111 <radius-server-addr> 0 testing123
```

如在本地执行

```bash
radtest test 111111 192.168.26.214 0 testing123
```

认证成功输出结果

```bash
Sending Access-Request of id 74 to 192.168.26.214 port 1812
	User-Name = "test"
	User-Password = "111111"
	NAS-IP-Address = 127.0.1.1
	NAS-Port = 0
rad_recv: Access-Accept packet from host 192.168.26.214 port 1812, id=74, length=20
```

如在本地执行

```bash
radtest test 222222 192.168.26.214 0 testing123
```

认证失败输出结果


```bash
Sending Access-Request of id 233 to 192.168.26.214 port 1812
	User-Name = "test"
	User-Password = "222222"
	NAS-IP-Address = 127.0.1.1
	NAS-Port = 0
rad_recv: Access-Reject packet from host 192.168.26.214 port 1812, id=233, length=20
```
 
