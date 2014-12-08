---
layout: post
title: "【译】IPSEC.CONF(5) － IPsec配置"
date: 2014-08-23
category: vpn
tags: vpn ipsec openswan
---

# NAME #
ipsec.conf —— IPsec配置

---

# DESCRIPTION #
ipsec.conf指定了Openswan IPsec子系统的大多数配置和控制信息。

include ipsec.*.conf 包含指定的配置文件

---

# CONN SECTIONS #
conn项定义了一个IPsec连接的规范，名字可以随意定义。例如：

```bash
conn snt
    left=10.11.11.1
    leftsubnet=10.0.1.0/24
    leftnexthop=172.16.55.66
    leftsourceip=10.0.1.1
    right=192.168.22.1
    rightsubnet=10.0.2.0/24
    rightnexthop=172.16.88.99
    rightsourceip=10.0.2.1
    keyingtries=%forever
```

---

# CONN PARAMETERS: GENERAL #
**connaddrfamily**
> 连接地址族，可用参数为ipv4（缺省）或者ipv6。
> IPv6在openswan 2.4中的NETKEY支持和openswan 2.6.33中的KLIPS支持


**type**
> 连接类型，参数如下：
> - tunnel（缺省）表示 host-to-host，host-to-subnet，subnet-to-subnet 隧道模式；
> - transport，表示 host-to-host传输模式；
> - passthrough，表示不使用IPsec；
> - drop，表示丢弃数据；
> - reject，表示丢弃数据并返回ICMP诊断包

**left**
> [必选项] 左侧设备公网接口IP地址，其中IP地址的格式请看ipsec_ttoaddr(3)。当前支持IPv4和IPv6。
> 如果其参数为 %defaultroute，同时 config setup 项中的 interfaces 包含 %defaultroute，那么left将自动由本地的缺省路由接口地址填充；leftnexthop也支持。
> %any 表示在协商时填充。
> %opportunistic 表示 left 和 lefnexthop 的参数从 left 侧客户端的DNS数据中获取

**leftsubnet**
> 左侧设备的私有子网，格式为 network/netmask (请看ipsec_ttosubnet(3));当前支持IPv4和IPv6地址范围。
> 支持 vhost: 和 vnet: 这2个速记，语法与 virtual_private 相同
> %priv 表示子网与 virtual_private相同
> %no 表示没有子网

**leftsubnets**
> 指定左侧设备的多个私有子网，格式 { networkA/netmaskA networkB/netmaskB [..] }。leftsubnet 和 leftsubnets 不能同时使用。 例子请看 testing/pluto/multinet-*

**leftprotoport**
> 指定隧道中允许的通过的协议和端口。参数可以是数字或者协议名（请在 /etc/protocols 中查找），例如 leftprotoport=icmp，或 protocol/port，如 tcp/smtp。
> ports可以使用数字或名字表示（请在 /etc/services 中查找）。
> %any 表示所有的协议端口

**leftnexthop**
> 左侧设备连接公网的下一跳网关IP地址；缺省为 %direct。如果这方法没有使用，则leftnexthop为 %defaultroute

**leftsourceip**
> 连接中主机的IP地址

**leftupdown**
> 当连接状态改变时， 回调此处设置的命令（缺省为 ipsec _updown）。 详细请看 ipsec_pluto(8)

**leftfirewall**
> 不再使用此选项

---

# CONN PARAMETERS：AUTOMATIC KEYING #
**auto**
> IPsec启动时自动执行；现在支持的参数有 
> - add （ipsec auto --add）
> - route（ipsec auto --route）
> - start（ipsec auto --up）
> - manual（ipsec manual --up）
> - ignore 表示不自动启动
> 具体请看 config setup

**authby**
> 2个安全网关之间的认证方法；
> - secret 表示共享密钥
> - rsasig 表示RSA数据签名（缺省）
> - secret|rsasig 同时使用

**ike**
> IKE第一阶段（ISAKMP SA）中的加密/认证算法。格式为 "cipher-hash;modpgroup,cipher-hash;modpgroup,..."
> 例如：ike=3des-sha1,aes-sha1, ike=aes, ike=aes128-md5;modp2048, 
> ike=aes128-sha1;dh22, ike=3des-md5;modp1024,aes-sha1;modp1536 or ike=modp1536
> 算法值请查看 ipsec_spi(8)中的 --ike选项。
> IKE组合形式：
> cipher:                              3des or aes
> hash:                                sha1 or md5
> pfsgroupt(DHgroup):                  modp1024 or modp153

**phase2**
> 设置将产生的SA类型。esp用于加密（缺省），ah用于认证

**phase2alg**
> 指定第二阶段中支持的算法。算法之间用逗号分隔

**esp**
> 此选项不再使用，用phase2alg代替

**ah**
> 连接中的AH算法。算法格式请看 ipsec_spi(8)中的 --ah选项

**ikev2**
> IKEv2（RFC4309）设置使用。
never 或 no 表示不使用IKEv2；
propos 或 yes 表示允许使用IKEv2，同时缺省使用IKEv2进行协商；
insist，表示只接受IKEv2协商，IKEv1将被拒绝；
permit（缺省），表示不主动使用IKEv2，但对端使用IKEv2的话也接受

**leftid**
> 左侧参加者的身份确认方法。
可以是IP地址，域名
%fromcert 表示ID从证书的DN获取；%none 表示不使用ID值

**leftrsasigkey**
> 左侧RSA签名认证，格式使用RFC2537 ipsec_ttodata(3)编码。
- %none 表示不指定值； 
- %dnsondemand 表示值从DNS中获取当需要使用到此值时； 
- %dnsonload 表示值从DNS中获取当读取ipsec.conf时；
- %cert 表示信息从 %leftcert 中获取

**leftrsasigkey2**
> 第2个公钥

**leftcert**
> 指定X509证书，如果没有指定全路径，则从 /etc/ipsec.d/certs/ 目录中查找
如果opesnswan编译时指定了 USE_LIBNSS=true，那么openswan将会去NSS数据库中查找RSA key

**leftca**
> 指定CA，如果没有指定，那么将用 leftcert 中的证书认为是CA证书

**leftsendcert**
> openswan发送X509证书到远程主机的选项配置。
- yes|always 表示总是允许发送证书
- ifasked 表示如果远程主机要求证书则进行发送
- no|never 表示从不发送证书。
缺省参数为 ifasked

**leftxauthserver**
> 左侧为XAUH服务端。可以使用PAM认证或 /etc/ipsec.d/passwd中的MD5口令。对端必须配置为rightxauthclient ，做为XAUTH客户端

**leftxauthclient**
> 左侧为XAUT客户端。xauth连接必须进行交互启动，不能使用配置 atuo=start。它必须使用命令行ipsec auto --up conname

**leftxauthusername**
> XAUTH认证中使用的用户名，XAUTH密码在 ipsec.secrets 文件中配置

**leftmodecfgserver**
> 左侧是模式配置服务端。它能下发网络配置到客户端。 参数为 yes 或 no （缺省）

**leftmodecfgclient**
> 左侧是模式配置客户端。它能从服务端接收网络配置。参数为 yes 或 no （缺省）

**modecfgpull**
> 从服务端接收模式配置信息。参数为 yes 或 no （缺省）

**modecfgdns1, modecfgdns2, modecfgwins1, modecfgwins2**
> 指定DNS、WINS的IP地址

**remote_peer_type**
> 设置远程主机类型。参数为 cisco 或 ietf 

**forceencaps**
> 参数为 yes 或 no （缺省为no）
当forceencaps=yes时将强制使用RFC-3948封装（UPD端口4500包封闭ESP）
如果此选项打开，那么 nat_traveral=yes必须打开

**dpddelay**
> 主机探测延迟时间，缺省为30秒。如果此选项被设置，dpdtimeout也应该设置

**dpdtimeout**
> 主机探测超时时间（以秒为单位），缺省为120秒。如果超时，将删除SA 

**dpdaction**
> 当PDP探测到主机死亡时要执行的动作
- hold （缺省）表示eroute将进入 %hold 状态
- clear 表示eroute和SA都要清除
- restart 表示SA将立即从协商
- restart_by_peer 表示所有死亡主机的SA将进行从协商

**pfs**
> 参数为 yes 或 no （缺省为yes）

**aggrmode**
> 使用野蛮模式替换主模式。野蛮模式不安全，容易受到服务拒绝攻击。
参数为 yes 或 no （缺省为no）

**salifetime**
> SA存活时间，参数为数字 + s/m/h/d （缺省为8h，最大24h）
"keylife" "lifetime" 是 "salifetime" 的别名

**rekey**
> 参数为 yes 或 no （缺省为 yes）。表示当密钥到期后是否进行从协商

**rekeymargin**
> 密钥到期前多长时间进行从协商。参数请看 salifetime （缺省9m）

**keyingtries**
> 协商尝试次数。 %forever 表示从不放弃，一直进行协商

**ikelifetime**
> IKE存活时间。参数请看salifetime

**compress**
> 是否进行压缩处理。 参数为 yes 或 no （缺省为 no）

**metric**
> 设置ipsecX 或 mastX 接口的 metric 优先级

**mtu**
> 设置MTU

**failureshunt**
> 当协商失败时执行的动作。缺省为 none；passthrough；drop；reject；具体看选项 type

---

# CONFIG SECTIONS #
**config**部分使用为一名字**setup**，此部分包含了软件启动时所使用到的信息(ipsec_setup(8). 例如：

```bash
config setup
    interfaes="ipsec0=eth1 ipsec1=ppp0"
    klipsdebug=none
    plutodebug=control
    protostack=auto
    manualstart=
```

**config setup**目前可用的选项如下：

**protostack**
> 指定IPsec协议攻栈。参数为 auto/klips/netkey/mast。mast是klips的变种

**interfaces**
> IPsec使用的虚接口和实接口。格式为 "virtual=physical virtual=physical ..."

**listen**
> 监听IP地址

**nat_traversal**
> 是否支持NAT。参数为 yes 或 no （缺省为no）

**disable\_port\_floasting**
> 是否启用NAT-T。 参数为 yes 或 no （缺省为no）

**force_keepalive**
> 是否强制发送NAT-T保活。参数为 yes 或 no （缺省为no）

**keep_alive**
> NAT-T保活包发送间隔时间

**oe**
> 是否启用机会加密（Opportunistic Encryption）。参数为 yes 或 no（缺省为no）
只有KLIPS支持此选项

**nhelpers**
> 设置pluto处理密码运算的进程（线程）
- 0表示所有操作都在主线程
- -1表示根据CPU进行计算（n-1，n是CPU数）
其它值则表示强制的进程（线程）数

**crlcheckinterval**
> CRL检查间隔时间，单位为秒。 如果设置为0表示开关CRL检查

**strictcrlpolicy**
> 是否强制进行CRL检查。参数为 yes 或 no （缺省为no）

**forwardcontrol**
> 此选项不再使用。请使用 /etc/sysctl.conf 文件中的 net.ipv4.ip_forward=0 控制IP转发设置

**rp_filter**
> 此选项不再使用。请使用 /etc/sysctl.conf 文件中的 net.ipv4.conf/[iface]/rp_filter=0 。 此参数在IPsec必须设置为0

**syslog**
> syslog(2)中的显示名。缺省为 daemon.error

**klipsdebug**
> KLIPS日志输出设置。none表示不输出；all表示全部输出。具体参数请看 ipsec_klipsdebug(8)

**plutodebug**
> pluto日志输出设置。none表示不输出；all表示全部输出。具体参数请看 ipsec_pluto(8)

**uniqueids**
> 唯一ID。参数为 yes 或 no （缺省为yes）

**plutorestartoncrash**
> 当pluto崩溃时重启，并生成core文件。参数为 yes 或 no（缺省为yes）

**plutopts**
> 设置pluto的额外参数。具体请看ipsec_pluto(8)

**plutostderrlog**
> 不使用syslog，把日志输出重定向到指定的文件中

**pluto**
> 是否启动pluto。参数为 yes 或 no（缺省为yes）

**plutowait**
> 在处理下一个协商时，pluto是否等待当前协商完成。参数为 yes 或 no（缺省为no）

**prepluto**
> 配置Pluto启动前执行的脚本

**postpluto**
> 配置Pluto启动后执行的脚本

**dumpdir**
> 设置core dump文件路径

**fragicmp**
> 包被分片时是否发送ICMP消息。参数为 yes 或 no （缺省为yes）。此选项只对KLIPS起作用

**hidetos**
> 隧道中数据包的TOS设置为0。参数为 yes 或 no（缺省为yes）。此选项只对KLIPS起作用

**overridemtu**
> 设置ipsecX接口的MTU。此选项只对KLIPS起作用


---

# IMPLICIT CONNS #
系统自动定义了一些conns部分于用默认的策略组。如果conn中定义了auto=ignore，那么默认定义将被忽略

下面是自动提供的定义

```bash
conn clear
    type=passthrough
    authby=never
    left=%defaultroute
    right=%group
    auto=route

conn clear-or-private
    type=passthrough
    left=%defaultroute
    leftid=%myid
    right=%opportunisticgroup
    failureshunt=passthrough
    keyingtries=3
    ikelifetime=1h
    salifetime=1h
    rekey=no
    auto=route

conn private-or-clear
    type=tunnel
    left=%defaultroute
    leftid=%myid
    right=%opportunisticgroup
    failureshunt=passthrough
    keyingtries=3
    ikelifetime=1h
    salifetime=1h
    rekey=no
    auto=route

conn private
    type=tunnel
    left=%defaultroute
    leftid=%myid
    right=%opportunisticgroup
    failureshunt=drop
    keyingtries=3
    ikelifetime=1h
    salifetime=1h
    rekey=no
    auto=route

conn block
    type=reject
    authby=never
    left=%defaultroute
    right=%group
    auto=route

# default policy
conn packetdefault
    type=tunnel
    left=%defaultroute
    leftid=%myid
    left=0.0.0.0/0
    right=%opportunistic
    failureshunt=passthrough
    keyingtries=3
    ikelifetime=1h
    salifetime=1h
    rekey=no
    auto=route
```
---

# POLICY GROUP FILES #
配置文件在 /etc/ipsec.d/policies/ 目录下，包括

```bash
/etc/ipsec.d/policies/block
/etc/ipsec.d/policies/clear
/etc/ipsec.d/policies/clear-or-private
/etc/ipsec.d/policies/private
/etc/ipsec.d/policies/private-or-clear
```

