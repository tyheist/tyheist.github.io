---
layout: post
title: "openswan不同应用情景配置方法"
date: 2014-08-23
category: vpn
tags: vpn ipsec openswan
---

# 场景1 #
192.168.28.213<192.168.28.213>[+S=C]...192.168.28.214[+S=C]===162.168.1.0/24

```bash
conn test
    left=192.168.28.213
    right=%any          
    rightsubnet=vhost:%no,%priv
    auto=add                  
    authby=secret
    ike=3des-md5!
    ikelifetime=3600s
    type=transport
    esp=3des-md5!
    keylife=28800s    
    pfs=no
```

```bash
conn ipsec_1
    left=192.168.28.214
    leftsubnet=162.168.1.0/24
    right=192.168.28.213
    auto=add
    authby=secret
    leftid=192.168.28.214
    rightid=192.168.28.213
    ike=3des-md5
    ikelifetime=3600s
    type=transport
    esp=3des-md5
    keylife=28800s
    pfs=no
```

# 场景2 #
192.168.28.213<192.168.28.213>[+S=C]...192.168.28.214[+S=C]

```bash
conn test
    left=192.168.28.213
    right=%any          
    rightsubnet=vhost:%no,%priv
    auto=add                  
    authby=secret
    ike=3des-md5!
    ikelifetime=3600s
    type=transport
    esp=3des-md5!
    keylife=28800s    
    pfs=no 
```

```bash
conn ipsec_1
    left=192.168.28.214
    right=192.168.28.213
    auto=add
    authby=secret
    leftid=192.168.28.214
    rightid=192.168.28.213
    ike=3des-md5
    ikelifetime=3600s
    type=transport
    esp=3des-md5
    keylife=28800s
    pfs=no
```

# 场景3 #
**网络拓扑**

```
192.165.1.1/24      192.168.252.8   192.168.252.5    / vlan1 192.166.1.1/24                                                                   
               /------\                   /------\  /
               |  S   |===================|  C   |-X
               \------/                   \------/  \
                                                     \ vlan2 192.167.1.0/24
```

**S端配置**

```bash
conn lantolan2
    left=192.168.252.8
    leftsubnet=192.165.1.0/24
    right=%any
    rightsubnet=vhost:%no,%priv
    auto=add
    authby=secret
    leftid=192.168.252.8
    rightid=192.168.252.5
    ike=des-md5-modp1024!
    ikelifetime=3600s
    type=tunnel
    esp=des-md5!
    keylife=28800s
    pfs=no
```

**C端配置**

```bash
conn lantolan1
    left=192.168.252.5
    leftsubnet=192.166.1.0/24
    right=192.168.252.8
    rightsubnet=192.165.1.0/24
    auto=add
    authby=secret
    leftid=192.168.252.5
    rightid=192.168.252.8
    ike=des-md5-modp1024!
    ikelifetime=3600s
    type=tunnel
    esp=des-md5!
    keylife=28800s
    pfs=no

conn test
    left=192.168.252.5
    leftsubnet=192.167.1.0/24
    right=192.168.252.8
    rightsubnet=192.165.1.0/24
    auto=add
    authby=secret
    leftid=192.168.252.5
    rightid=192.168.252.8
    ike=des-md5-modp1024!
    ikelifetime=3600s
    type=tunnel
    esp=des-md5!
    keylife=28800s
    pfs=no
```

# 场景4 #
**网络拓扑 (注意网络拓扑)**

```
10.61.2.1/24
    PC1
      \          10.61.2.254/8                              10.61.48.254/24
       \_________________                         
                         \ /-------\                    /--------\        10.61.48.1/24
                          |   S     |===================|   C    |---------PC3
        _________________/ \-------/                    \--------/
       /       
      /          10.61.1.254/8
    PC2
10.61.1.1/24
```

**注意：**
PC1和PC2的IP地址，如果PC1和PC2的IP地址为10.61.0.0/8这个网段就不能互通了，因为PC会建立一条这个网段到本地的一条路由

**S端配置**

```bash
conn ss
    left=192.168.28.213
    leftsubnet=10.61.0.0/16
    right=192.168.28.214
    rightsubnet=10.61.48.0/24
    auto=add
    authby=secret
    leftid=192.168.28.213
    rightid=192.168.28.214
    ike=3des-md5!
    ikelifetime=3600s
    type=tunnel
    esp=3des-md5!
    keylife=28800s
    pfs=no
```

**C端配置**

```bash
conn s1200
    left=192.168.28.214
    leftsubnet=10.61.48.0/24
    right=192.168.28.213
    rightsubnet=10.61.0.0/16
    auto=add
    authby=secret
    leftid=192.168.28.214
    rightid=192.168.28.213
    ike=3des-md5
    ikelifetime=3600s
    type=tunnel
    esp=3des-md5
    keylife=28800s
    pfs=no
```
