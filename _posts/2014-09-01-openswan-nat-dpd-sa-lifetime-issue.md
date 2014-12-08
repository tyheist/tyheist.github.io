---
layout: post
title: "openswan在NAT环境且开启DPD时双方SA生存周期不同可能存在问题"
date: 2014-09-01
category: vpn
tags: vpn ipsec openswan
---

* ipsec SA存在第1阶段SA`ISAKMP SA`生存周期和第2阶段`IPsec SA`生存周期
> `ISAKMP SA`生存周期以两端中配置时间最小为准
> `IPsec SA`生存周期两端各自以本端配置时间为准

* ipsec DPD是一种探测对端是否存活的机制
> 每一个`IPsec SA`对应一个DPD，即每一条隧道对应一个DPD
> 如果`ISAKMP SA`不存，DPD将无法工作，因为DPD发包时需使用`ISAKMP SA`进行加解密
 
* ipsec NAT穿越是ipsec两端之间存在NAT设备时对隧道报文进行封装的机制
> 一般使用4500 UDP端口进行封包

如果上面描述同时使用，且ipsec两端生存周期配置不同，则可能引起问题

例如：
> 双端链路之间存在NAT设备
> client端`ISAKMP SA`生存周期配置为`3600s`，`IPsec SA`生存周期配置为`28800s`
> server端`ISAKMP SA`生存周期配置为`28800s`，`IPsec SA`生存周期配置为`3600s`

当server端`ISAKMP SA`到期时，server将删除自己的`ISAKMP SA`和通知client端删除`ISAKMP SA`，同时server端进行重协商，但由于client端在NAT内部，且server发出起的第一个协商报文端口为500，所以重协商报文无法到达client端。此时双方`ISAKMP SA`都不存在，意味着`DPD已不工作`了，双方`IPsec SA`还存在，隧道还能互通

当server端`IPsec SA`到期时，server将删除自己的`IPsec SA`和通知client端删除`IPsec SA`，`但正巧这个通知报文在网络中被丢弃`，那么client端没有删除`IPsec SA`，还认为隧道是可用的，同时DPD也不工作了，这就出现了两端状态不一致问题。此时server端隧道状态为断开，而client端隧道状态为连接，但实际上双端之间隧道已不能互通了。DPD又不能工作，只能等client端`IPsec SA`生存周期到期才能重协商恢复隧道正常

虽然这种情况出现机率相当小，但还是有可能出现的，所以在配置`ISAKMP SA`生存周期和`IPsec SA`生存周期还是保持两端相同为好

如果两端生存周期相同，那么即使出现了上面的情况，由于两端`IPsec SA`生存周期一样，当server端到期时，client端基本上也快到期了，所以即使`client端没有收到server端删除IPsec SA报文`，client端`IPsec SA`也很快到期再进行重协商，恢复隧道正常

另，一般都把`ISAKMP SA`生存周期时间设置得比`IPsec SA`生存周期大
