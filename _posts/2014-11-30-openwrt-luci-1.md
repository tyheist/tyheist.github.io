---
layout: post
title: "Luci"
date: 2014-11-30
category: openwrt
tags: openwrt luci
---

## Control
代码库路径: feeds/lluci/applications/luci-myapp/luasrc/controller/myapp.lua
设备上路径: /usr/lib/lua/luci/controller/myapp.lua

格式:

```lua
module("luci.controller.myapp", package.seeall)

function index()

end
```

注册URL:
> entry(path, target, title=nil, order=nil)

target分别有:

* actions
使用函数直接输出内容
> call("my_fun")

* views
使用html
> template("mymodule/myview")

* cbi
> cbi("mymodule/mycbi")

例如

```lua
function index()
    entry({"admin", "services", "mymodule", "mycbi"}, 
            cbi("mymodule/mycbi"),
            _("CBI")).leaf = true
            
    entry({"admin", "services", "mymodule", "myview"},
            template("mymodule/myview"),
            _("View")).leaf = true

    entry({"admin", "services", "mymodule", "myfun"},
            call("my_fun"),
            _("FUN")).leaf = true
end
```

## CBI
代码库路径: feeds/luci/applications/luci-myapp/luasrc/model/cbi/myapp.lua
设备上路径: /usr/lib/lua/luci/model/cbi/myapp.lua

> /etc/config/ipsec配置文件如下

```bash
config policy tunnel
    option name 'test'
    option enable '1'
```

创建UCI配置文件ipsec对应的map对象

```lua
m = Map("ipsec", translate("IPSec"))
```

创建UCI type对象

```lua
s = m:section(TypedSection, "policy", translate("Polciy"))
s.template = "cbi/tblsection" -- 使用列表模板
s.anonymous = true -- 不显示section名称
```

创建UCI name对象

```lua
s = m:section(NamedSection, "tunnel", "policy", "translate("Policy"))
```

创建UCI option对象

```lua
name = s:option(DummyValue, "name", translate("Name"))

enable = s:option(Flag, "enable", translate("Enable))
enable.rmempty = false -- 值为空时不删除
```

### CBI类说明

#### class Map(config, title, description)

参数说明:

* config: /etc/config/目录下的UCI文件名
* title: 页面显示名称
* description: 页面显示详细描述

方法说明:

:section(sectionclass, ...)

---

#### class NamedSection(name, type, title, description)

参数说明:

* name: UCI section名字, config type `section`
* type: UCI section类型, config `type` section
* title: 页面显示名称
* description: 页面显示详细描述

对象属性:
.addremove = false
> 此section是否允许删除或创建
> 为true时，页面会显示`删除`和`创建`按钮

.anonymous = true
> 页面不显示此secion名字

方法说明:

:option(optionclass, ...)

---

#### class TypedSection(type, title, description)

参数说明:

* type: UCI section类型, config `type` section
* title: 页面显示名称
* description: 页面显示详细描述

对象属性:

.addremove = false
> 此section是否允许删除或创建
> 为true时，页面会显示`删除`和`创建`按钮

.anonymous = true
> 页面不显示此secion名字

.extedit = luci.dspatcher.build_url("url")
> 设置此section编辑页面URL, 页面显示`编辑`按钮

.template = "cbi/template"
> 设置此section页面模板

方法说明:

:option(optionclass, ...)

---

#### class Value(option, title, description)

页面将创建文件输入框

参数说明:

* option: UCI option名称, option `enable` '1'
* title: 页面显示名称
* description: 页面显示详细描述

属性说明:

.defalut = nil
> 缺省值

.maxlength = nil
> option值最大长度

.rmempty = true
> option值为空时不写入UCI文件

.size = nil
> 页面表单对应位置大小

.optional = false
> 是否为可选，为true可强制页面输入

.datatype = nil
> 指定option值类型，用于输入合法性检查

.template = nil
> 页面模板

.password = false
> 密码输入框

方法说明:

:depends(key, value)
> 当key值等于value时，页面才显示

function o.validate(self, value)
end
> 重构option合法性检查方法，可自己控制option值

function o.formvalue(self, key)
end
> 重构option从表单获取值方法

当表单值为空时返回`-`，在合法性检验时判断如果value等于`-`即表示页面没有输入值

```lua
function o.formvalue(...)
    return Value.formvalue(...) or "-" 
end
function o.validate(self, value)
    if value == "-" then
        return nil, translate("required fields have no value!")
    end 
    return value
end
```

functin o.write(self, section, value)
end
> 重构option写入UCI文件方法

在用户输入的值后追加内容`s`:

```lua
function o.write(self, section, value)
    Value.write(self, section, value .. "s")
end
```

function o.cfgvalue(self, section)
end
> 重构option值输出到页面方法

页面只显示UCI option值开始为数字部分内容:

```lua
function o.cfgvalue(self, section)
    local v = Value.cfgvalue(self, section) 
    if v then
        return string.sub(v, string.find(v, "%d+"))
    else 
        return nil
    end
end
```

---

#### class ListValue(option, title, description)

页面将创建列表框

参数说明:

* option: UCI option名称, option `action` 'drop'
* title: 页面显示名称
* description: 页面显示详细描述

属性说明:
同class Value

方法说明:
同class Value

:value(ucivalue, showkey)
> 设置下拉列表显示与值对应关系

```lua
o = s:option(ListValue, "enable", translate("Enable"))
o:value("1", translate("Enable"))
o:value("0", translate("Disable"))
```

---

#### class Flag(option, title, description)

页面将创建单选框

参数说明:

* option: UCI option名称, option `enable` '0'
* title: 页面显示名称
* description: 页面显示详细描述

属性说明:
同class Value

方法说明:
同class Value

---

#### class Button(option, title, description)

页面将创建按钮

参数说明:

* option: UCI option名称, option `enable` '0'
* title: 页面显示名称
* description: 页面显示详细描述

属性说明:
同class Value

.inputstyle = nil
> 按钮样式, `apply`, `reset`, 

方法说明:
同class Value

## View

代码库路径: feeds/luci/applications/luci-myapp/luasrc/view/myview.htm
设备上路径: /usr/lib/lua/luci/view

定义自己的html模板

原有模板路径: feeds/luci/modules/base/luasrc/view/cbi/目录

## Debug
当设备更新了control文件后，页面不会显示，需把/tmp/目录下`luci-indexcache` `luci-modulecache/` `luci-sessions/`删除，web服务器重新建立索引后新页面才能显示
