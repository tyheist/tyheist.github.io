---
layout: post
title: "raspberrypi vnc server configure"
date: 2014-08-22
category: tools
tags: tools
---

# 安装tightvncserver #
```bash
sudo aptitude install tightvncserver 
```

# 安装xfronts-base #
这一步非必须，使用google coder for raspberry pi image时由于没有安装xfonts-base而引起tightvncserver无法正常启动

```bash
sudo aptitude install xfonts-base 
```

# 设置系统boot时自动启动tightvncserver #
添加**/etc/init.d/tightvncserver**，内容如下：

```bash
#!/bin/sh

### BEGIN INIT INFO
# Provides:             tightvncserver
# Required-Start:       $remote_fs $syslog $network
# Required-Stop:        $remote_fs $syslog $network
# Default-Start:        2 3 4 5
# Default-Stop:         0 1 6
# Short-Description:    Starts VNC Server on system start
### END INIT INFO

VNCUSER='pi'

case "$1" in
    start)
        su $VNCUSER -c '/usr/bin/tightvncserver :1 -geometry 1152x864 -depth 24'
        echo "Starting TightVNC Server for $VNCUSER"
    ;;
    stop)
        pkill Xtightvnc
        echo "TightVNC Server stopped"
    ;;
    *)
        echo "Usage: /etc/init.d/tightvncserver {start|stop}"
        exit 1
    ;;
esac

exit 0
```

加入系统启动项

```bash
sudo chmod +x /etc/init.d/tightvncserver
sudo update-rc.d tightvncserver defaults
```
