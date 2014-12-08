---
layout: post
title: "【转】mount --bind 的妙用"
date: 2014-08-23
category: tools
tags: tools
---

**[原文链接][1]**

在固件开发过程中常常遇到这样的情况：为测试某个新功能，必需修改某个系统文件。而这个文件在只读文件系统上（总不能为一个小小的测试就重刷固件吧），或者是虽然文件可写，但是自己对这个改动没有把握，不愿意直接修改。这时候mount --bind就是你的好帮手

## case 1 ##

假设我们要改的文件是/etc/hosts，可按下面的步骤操作
把新的hosts文件放在/tmp下。当然也可放在硬盘或U盘上

```bash
mount --bind /tmp/hosts /etc/hosts
```

测试完成了执行 umount /etc/hosts 断开绑定

## case 2 ##

如果我需要在/etc下面增加一个exports文件怎么办？原来没有这个文件，不能直接bind
绑定整个/etc目录，绑定前先复制/etc

```bash
cp -a /etc /tmp
mount --bind /tmp/etc /etc
```

此时的/etc目录是可写的，所做修改不会应用到原来的/etc目录，可以放心测试



  [1]: http://www.cnitblog.com/gouzhuang/archive/2010/04/21/mount_bind.html
