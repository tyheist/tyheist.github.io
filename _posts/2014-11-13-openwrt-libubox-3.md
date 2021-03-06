---
layout: post
title: "libubox [3] - BLOB BLOGMSG"
date: 2014-11-13
category: openwrt
tags: openwrt libubox
---

## BLOB二进制对象(blob.c/h)
### 数据结构

```c
struct blob_attr {
	uint32_t id_len;	/** 高1位为extend标志，高7位存储id，
                         *  低24位存储data的内存大小 */
	char data[];
} __packed;

struct blob_attr_info {
	unsigned int type;
	unsigned int minlen;
	unsigned int maxlen;
	bool (*validate)(const struct blob_attr_info *, struct blob_attr *);
};

struct blob_buf {
	struct blob_attr *head;
	bool (*grow)(struct blob_buf *buf, int minlen);
	int buflen;
	void *buf;
};
```

### 存储结构
![blob_buff内存结构][1]

### 接口说明
#### 获取BLOB属性信息

```c
/**
 * 返回指向BLOB属性数据区指针
 */
static inline void * blob_data(const struct blob_attr *attr)

/**
 * 返回BLOB属性ID
 */
static inline unsigned int blob_id(const struct blob_attr *attr)

/**
 * 判断BLOB属性扩展标志是否为真
 */
static inline bool blob_is_extended(const struct blob_attr *attr)

/**
 * 返回BLOB属性有效存储空间大小
 */
static inline unsigned int blob_len(const struct blob_attr *attr)

/*
 * 返回BLOB属性完全存储空间大小(包括头部)
 */
static inline unsigned int blob_raw_len(const struct blob_attr *attr)

/*
 * 返回BLOB属性填补后存储空间大小(包括头部)
 */
static inline unsigned int blob_pad_len(const struct blob_attr *attr)
```

#### 获取BLOB数据信息

```c
static inline uint8_t blob_get_u8(const struct blob_attr *attr)

static inline uint16_t blob_get_u16(const struct blob_attr *attr)

static inline uint32_t blob_get_u32(const struct blob_attr *attr)

static inline uint64_t blob_get_u64(const struct blob_attr *attr)

static inline int8_t blob_get_int8(const struct blob_attr *attr)

static inline int16_t blob_get_int16(const struct blob_attr *attr)

static inline int32_t blob_get_int32(const struct blob_attr *attr)

static inline int64_t blob_get_int64(const struct blob_attr *attr)

static inline const char * blob_get_string(const struct blob_attr *attr)
```

#### 设置BLOB数据信息

```c
static inline struct blob_attr *
blob_put_string(struct blob_buf *buf, int id, const char *str)

static inline struct blob_attr *
blob_put_u8(struct blob_buf *buf, int id, uint8_t val)

static inline struct blob_attr *
blob_put_u16(struct blob_buf *buf, int id, uint16_t val)

static inline struct blob_attr *
blob_put_u32(struct blob_buf *buf, int id, uint32_t val)

static inline struct blob_attr *
blob_put_u64(struct blob_buf *buf, int id, uint64_t val)

#define blob_put_int8	blob_put_u8
#define blob_put_int16	blob_put_u16
#define blob_put_int32	blob_put_u32
#define blob_put_int64	blob_put_u64

struct blob_attr *
blob_put(struct blob_buf *buf, int id, const void *ptr, unsigned int len)

/**
 * ptr - 指向struct blob_attr
 */
struct blob_attr *
blob_put_raw(struct blob_buf *buf, const void *ptr, unsigned int len)
```

#### 遍历

```c
#define __blob_for_each_attr(pos, attr, rem)
#define blob_for_each_attr(pos, attr, rem)
```

#### 复制

```c
struct blob_attr * blob_memdup(struct blob_attr *attr)
```

#### 数据类型判断

```c
enum {
	BLOB_ATTR_UNSPEC,
	BLOB_ATTR_NESTED,  /** 嵌套 */
	BLOB_ATTR_BINARY,
	BLOB_ATTR_STRING,
	BLOB_ATTR_INT8,
	BLOB_ATTR_INT16,
	BLOB_ATTR_INT32,
	BLOB_ATTR_INT64,
	BLOB_ATTR_LAST
};
bool blob_check_type(const void *ptr, unsigned int len, int type)
```

#### 嵌套操作

```c
void * blob_nest_start(struct blob_buf *buf, int id)
Void blob_nest_end(struct blob_buf *buf, void *cookie)
```

#### 判断

```c
bool blob_attr_equal(const struct blob_attr *a1, const struct blob_attr *a2)
```

#### 初始/销毁

```c
/**
 * 初始化BLOB buffer
 */
int blob_buf_init(struct blob_buf *buf, int id)

/**
 * 销毁BLOB buffer
 */
void blob_buf_free(struct blob_buf *buf)
```

#### 解析BLOB

```c
/**
 * 从attr串中根据info策略过滤，得到的结果存储在data属性数组中
 *
 * @param  attr 输入BLOB属性串
 * @param  data 输出BLOB属性数组
 * @param  info 属性过滤策略
 * @param  max data数组大小
 */
int blob_parse(struct blob_attr *attr, struct blob_attr **data, 
               const struct blob_attr_info *info, int max)
```

---

## BLOB消息对象(blobmsg.c/h)
### 数据结构

```c
struct blobmsg_hdr {
	uint16_t namelen;
	uint8_t name[];
} __packed;

struct blobmsg_policy {
	const char *name;
	enum blobmsg_type type;
};
```

### 存储结构
![blobmsg内存结构][2]

### 消息类型

```c
enum blobmsg_type {
	BLOBMSG_TYPE_UNSPEC,
	BLOBMSG_TYPE_ARRAY,
	BLOBMSG_TYPE_TABLE,
	BLOBMSG_TYPE_STRING,
	BLOBMSG_TYPE_INT64,
	BLOBMSG_TYPE_INT32,
	BLOBMSG_TYPE_INT16,
	BLOBMSG_TYPE_INT8,
	__BLOBMSG_TYPE_LAST,
	BLOBMSG_TYPE_LAST = __BLOBMSG_TYPE_LAST - 1,
	BLOBMSG_TYPE_BOOL = BLOBMSG_TYPE_INT8,
};
```

### 接口说明
#### 基本操作

```c
/**
 * 根据BLOB消息名字长度计算出blobmsg头部大小
 */
static inline int blobmsg_hdrlen(unsigned int namelen)

/**
 * 获取BLOB消息名字
 */
static inline const char *blobmsg_name(const struct blob_attr *attr)

/**
 * 获取BLOB消息类型
 */
static inline int blobmsg_type(const struct blob_attr *attr)

/**
 * 获取BLOB消息数据内容
 */
static inline void *blobmsg_data(const struct blob_attr *attr)

/**
 * 获取BLOB消息数据内容大小
 */
static inline int blobmsg_data_len(const struct blob_attr *attr)
static inline int blobmsg_len(const struct blob_attr *attr)
```

#### 数据类型判断

```c
/**
 * 判断BLOBMSG属性类型是否合法
 */
bool blobmsg_check_attr(const struct blob_attr *attr, bool name)
```

#### 设置

```c
int blobmsg_add_field(struct blob_buf *buf, int type, const char *name,
                      const void *data, unsigned int len)

static inline int
blobmsg_add_u8(struct blob_buf *buf, const char *name, uint8_t val)

static inline int
blobmsg_add_u16(struct blob_buf *buf, const char *name, uint16_t val)

static inline int
blobmsg_add_u32(struct blob_buf *buf, const char *name, uint32_t val)

static inline int
blobmsg_add_u64(struct blob_buf *buf, const char *name, uint64_t val)

static inline int
blobmsg_add_string(struct blob_buf *buf, const char *name, const char *string)

static inline int
blobmsg_add_blob(struct blob_buf *buf, struct blob_attr *attr)

/**
 * 格式化设备BLOGMSG
 */
void blobmsg_printf(struct blob_buf *buf, const char *name, const char *format, ...)
```

#### 获取

```c
static inline uint8_t blobmsg_get_u8(struct blob_attr *attr)
static inline bool blobmsg_get_bool(struct blob_attr *attr)
static inline uint16_t blobmsg_get_u16(struct blob_attr *attr)
static inline uint32_t blobmsg_get_u32(struct blob_attr *attr)
static inline uint64_t blobmsg_get_u64(struct blob_attr *attr)
static inline char *blobmsg_get_string(struct blob_attr *attr)
```

#### 创建

```c
/**
 * 创建BLOBMSG，返回数据区开始地址
 */
void *blobmsg_alloc_string_buffer(struct blob_buf *buf, const char *name, 
unsigned int maxlen)

/**
 * 扩大BLOGMSG，返回数据区开始地址
 */
void *blobmsg_realloc_string_buffer(struct blob_buf *buf, unsigned int maxlen)

void blobmsg_add_string_buffer(struct blob_buf *buf)
```

#### 遍历

```c
#define blobmsg_for_each_attr(pos, attr, rem)
```

#### 嵌套

```c
static inline void * blobmsg_open_array(struct blob_buf *buf, const char *name)
static inline void blobmsg_close_array(struct blob_buf *buf, void *cookie)

static inline void *blobmsg_open_table(struct blob_buf *buf, const char *name)
static inline void blobmsg_close_table(struct blob_buf *buf, void *cookie)
```

#### 解析BLOGMSG

```c
/**
 * 从data BLOGMSG串中根据policy策略过滤，得到的结果存储在tb BLOGATTR数组中
 *
 * @param  policy 过滤策略
 * @param  policy_len 策略个数
 * @param  tb 返回属性数据
 * @param  len data属性个数
 */
int blobmsg_parse(const struct blobmsg_policy *policy, int policy_len,
                  struct blob_attr **tb, void *data, unsigned int len)
```

## 例子
### 把UCI转化为BLOB
UCI配置文件:
/etc/config/test

```bash
config policy test
    option name 'test'
    option enable '1'
    option dns '1.1.1.1 2.2.2.2'
```

定义参数列表:

```c
enum {
    POLICY_ATTR_NAME,       /** name */
    POLICY_ATTR_ENABLE,     /** enable */
    POLICY_ATTR_DNS,        /** dns */
    __POLICY_ATTR_MAX
};

static const struct blobmsg_policy policy_attrs[__POLICY_ATTR_MAX] = {
    [POLICY_ATTR_NAME] = { .name = "name", .type = BLOBMSG_TYPE_STRING },
    [POLICY_ATTR_ENABLE] = { .name = "enable", .type = BLOBMSG_TYPE_BOOL },
    [POLICY_ATTR_DNS] = { .name = "dns", .type = BLOBMSG_TYPE_ARRAY },
};

/** 定义BLOBMSG_TYPE_ARRAY类型参数的实际数据类型 */
static const struct uci_blob_param_info policy_attr_info[__POLICY_ATTR_MAX] = {
    [POLICY_ATTR_DNS] = { .type = BLOBMSG_TYPE_STRING },
};

static const struct uci_blob_param_list policy_attr_list = {
    .n_params = __POLICY_ATTR_MAX,
    .params = policy_attrs,
    .info = policy_attr_info,
};
```

转化为BLOB:

```c
static struct uci_context *g_uci_ctx;
static struct blob_buf *b;

void
transform(const char *config)
{
    struct uci_context *ctx = g_uci_ctx;
    struct uci_package *p = NULL;
    
    if (!ctx) {
        ctx = uci_alloc_context();
        g_uci_ctx = ctx;
        uci_set_confdir(ctx, NULL);
    } else {
        p = uci_lookup_package(ctx, config);
        if (p)
            uci_unload(ctx, p);
    }
    
    if (uci_load(ctx, config, &p))
        return;    
    
    struct uci_element *e;
    struct blob_attr *config = NULL;
    uci_foreach_element(&p->sectons, e) {
        struct uci_section *s = uci_to_section(e);
        
        blob_buf_init(&b, 0);
        uci_to_blob(&b, s, &policy_attr_list);
        config = blob_memdup(b.head);
        
        /**
         * do something with `config` 
         * free(config), when not use it
         */
    }
}
```

使用转化后的blob_attr

```c
void
foo(blob_attr *confg)
{
    struct blob_attr *tb[__POLICY_ATTR_MAX];
    
    blobmsg_parse(policy_attrs, __POLICY_ATTR_MAX, tb,
            blob_data(config), blob_len(config));
            
    /**
     * do something with *tb[] 
     */
}
```


  [1]: /assets/img/res/blob.jpeg
  [2]: /assets/img/res/blobmsg.jpeg

