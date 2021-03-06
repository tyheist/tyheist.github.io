---
layout: post
title: "libubox [4] - uloop runqueue ustream"
date: 2014-11-13
category: openwrt
tags: openwrt libubox
---

## 事件处理循环(uloop.c/h)
### 接口说明
#### 主框架

```c
/**
 * 初始化事件循环
 */
int uloop_init(void)

/**
 * 事件循环主处理入口
 */
void uloop_run(void)

/**
 * 销毁事件循环
 */
void uloop_done(void)
```

#### 描述符事件

```c
/**
 * 注册一个新描述符到事件处理循环
 */
int uloop_fd_add(struct uloop_fd *sock, unsigned int flags)

/** 
 * 从事件处理循环中销毁指定描述符
 */
int uloop_fd_delete(struct uloop_fd *sock)
```

#### 定时器事件

```c
/**
 * 注册一个新定时器
 */
int uloop_timeout_add(struct uloop_timeout *timeout)

/**
 * 设置定时器超时时间(毫秒)，并添加
 */
int uloop_timeout_set(struct uloop_timeout *timeout, int msecs)

/**
 * 销毁指定定时器
 */
int uloop_timeout_cancel(struct uloop_timeout *timeout)

/**
 * 获取定时器还剩多长时间超时
 */
int uloop_timeout_remaining(struct uloop_timeout *timeout)
```

#### 进程事件

```c
/**
 * 注册新进程到事件处理循环
 */
int uloop_process_add(struct uloop_process *p)

/**
 * 从事件处理循环中销毁指定进程
 */
int uloop_process_delete(struct uloop_process *p)
```

### 数据结构
#### 描述符

```c
struct uloop_fd {
	uloop_fd_handler cb;	/** 文件描述符，调用者初始化 */
	int fd;					/** 文件描述符，调用者初始化 */
	bool eof; 						
	bool error;						
	bool registered;		/** 是否已注册到uloop中 */		
	uint8_t flags;						
};
```

#### 定时器

```c
struct uloop_timeout {
	struct list_head list;				
	bool pending;				
	uloop_timeout_handler cb; /** 文件描述符， 调用者初始化 */
	struct timeval time;	  /** 文件描述符， 调用者初始化 */
};
```

#### 进程

```c
struct uloop_process {
	struct list_head list;				
	bool pending;					
	uloop_process_handler cb;		/** 文件描述符， 调用者初始化 */
	pid_t pid;						/** 文件描述符， 调用者初始化 */
};
```

### 事件回调函数
#### 描述符

```c
typedef void (*uloop_fd_handler)(struct uloop_fd *u, unsigned int events)
```

#### 定时器

```c
typedef void (*uloop_timeout_handler)(struct uloop_timeout *t)
```

#### 进程

```c
typedef void (*uloop_process_handler)(struct uloop_process *c, int ret)
```

### 事件标志

```c
#define ULOOP_READ		    (1 << 0)
#define ULOOP_WRITE		    (1 << 1)
#define ULOOP_EDGE_TRIGGER	(1 << 2)
#define ULOOP_BLOCKING		(1 << 3)
#define ULOOP_EVENT_MASK	(ULOOP_READ | ULOOP_WRITE)
```

---

## 任务队列(runqueue.c/h)
任务队列是通过uloop定时器实现，把定时器超时时间设置为1，通过uloop事件循环来处理定时器就会处理任务队列中的task。进程任务在任务队列基本上实现，加入子进程退出监控

### 数据结构

```c
struct runqueue {
	struct safe_list tasks_active;		/** 活动任务队列 */
	struct safe_list tasks_inactive; 	/** 不活动任务队列 */
	struct uloop_timeout timeout;

	int running_tasks; 		/** 当前活动任务数目 */
	int max_running_tasks;  /** 允许最大活动任务数目 */
	bool stopped;			/** 是否停止任务队列 */
	bool empty; 			/** 任务队列(包括活动和不活动)是否为空 */

	/* called when the runqueue is emptied */
	void (*empty_cb)(struct runqueue *q);
};

struct runqueue_task_type {
	const char *name;

	/*
	 * called when a task is requested to run
	 *
	 * The task is removed from the list before this callback is run. It
	 * can re-arm itself using runqueue_task_add.
	 */
	void (*run)(struct runqueue *q, struct runqueue_task *t);

	/*
	 * called to request cancelling a task
	 *
	 * int type is used as an optional hint for the method to be used when
	 * cancelling the task, e.g. a signal number for processes. Calls
	 * runqueue_task_complete when done.
	 */
	void (*cancel)(struct runqueue *q, struct runqueue_task *t, int type);

	/*
	 * called to kill a task. must not make any calls to runqueue_task_complete,
	 * it has already been removed from the list.
	 */
	void (*kill)(struct runqueue *q, struct runqueue_task *t);
};

struct runqueue_task {
	struct safe_list list;
	const struct runqueue_task_type *type;
	struct runqueue *q;

	void (*complete)(struct runqueue *q, struct runqueue_task *t);

	struct uloop_timeout timeout;
	int run_timeout; 	/** >0表示规定此任务执行只有run_timeout毫秒 */
	int cancel_timeout; /** >0表示规则任务延取消操作执行只有run_timeout毫秒*/
	int cancel_type;

	bool queued;		/** 此任务是否已加入任务队列中 */
	bool running;		/** 此任务是否活动，即已在活动队列中 */
	bool cancelled;     /** 此任务是否已被取消 */
};

struct runqueue_process {
	struct runqueue_task task;
	struct uloop_process proc;
};
```

### 接口说明
#### 任务队列

```c
/**
 * 初始化任务队列
 */
void runqueue_init(struct runqueue *q)

/** 
 * 取消所有任务队列
 */
void runqueue_cancel(struct runqueue *q);

/** 
 * 取消活动中的任务
 */
void runqueue_cancel_active(struct runqueue *q);

/** 
 * 取消不活动的任务 
 */
void runqueue_cancel_pending(struct runqueue *q);

/**
 * 杀死所有任务
 */
void runqueue_kill(struct runqueue *q);

/** 
 * 停止所有任务
 */
void runqueue_stop(struct runqueue *q);

/**
 * 重新开始任务
 */
void runqueue_resume(struct runqueue *q);
```

#### 任务操作

```c
/**
 * 添加新任务到队列尾
 *
 * @running true-加入活动队列；false-加入不活动队列
 */
void runqueue_task_add(struct runqueue *q, struct runqueue_task *t, bool running);

/**
 * 添加新任务到队列头
 *
 * @running true-加入活动队列；false-加入不活动队列
 */
void runqueue_task_add_first(struct runqueue *q, struct runqueue_task *t, 
bool running);

/**
 * 完全任务
 */
void runqueue_task_complete(struct runqueue_task *t);

/**
 * 取消任务
 */
void runqueue_task_cancel(struct runqueue_task *t, int type);

/**
 * 杀死任务
 */
void runqueue_task_kill(struct runqueue_task *t);
```

#### 进程任务

```c
void runqueue_process_add(struct runqueue *q, struct runqueue_process *p, 
pid_t pid);

/**
 * to be used only from runqueue_process callbacks 
 */
void runqueue_process_cancel_cb(struct runqueue *q, struct runqueue_task *t, 
int type);
void runqueue_process_kill_cb(struct runqueue *q, struct runqueue_task *t);
```

---

## 流缓冲管理(ustream.c/h/ustream-fd.c)
### 数据结构

```c
struct ustream_buf {
	struct ustream_buf *next;

	char *data;		/** 指向上次操作buff开始地址 */
	char *tail;		/** 指向未使用buff开始地址 */
	char *end;		/** 指向buf结束地址 */

	char head[];	/** 指向buf开始地址 */
};

struct ustream_buf_list {
	struct ustream_buf *head;       /** 指向第1块ustream_buf */
	struct ustream_buf *data_tail;  /** 指向未使用的ustream_buf */
	struct ustream_buf *tail;       /** 指向最后的ustream_buf */

	int (*alloc)(struct ustream *s, struct ustream_buf_list *l);

	int data_bytes;	   /** 已用存储空间大小 */

	int min_buffers;   /** 可存储最小的ustream_buf块个数 */
	int max_buffers;   /** 可存储最大的ustream_buf块个数 */
	int buffer_len;	   /** 每块ustream_buf块存储空间大小 */

	int buffers;       /** ustream_buf块个数 */
};

struct ustream {
	struct ustream_buf_list r, w;
	struct uloop_timeout state_change;
	struct ustream *next;

	/*
	 * notify_read: (optional)
	 * called by the ustream core to notify that new data is available
	 * for reading.
	 * must not free the ustream from this callback
	 */
	void (*notify_read)(struct ustream *s, int bytes_new);

	/*
	 * notify_write: (optional)
	 * called by the ustream core to notify that some buffered data has
	 * been written to the stream.
	 * must not free the ustream from this callback
	 */
	void (*notify_write)(struct ustream *s, int bytes);

	/*
	 * notify_state: (optional)
	 * called by the ustream implementation to notify that the read
	 * side of the stream is closed (eof is set) or there was a write
	 * error (write_error is set).
	 * will be called again after the write buffer has been emptied when
	 * the read side has hit EOF.
	 */
	void (*notify_state)(struct ustream *s);

	/*
	 * write:
	 * must be defined by ustream implementation, accepts new write data.
	 * 'more' is used to indicate that a subsequent call will provide more
	 * data (useful for aggregating writes)
	 * returns the number of bytes accepted, or -1 if no more writes can
	 * be accepted (link error)
	 */
	int (*write)(struct ustream *s, const char *buf, int len, bool more);

	/*
	 * free: (optional)
	 * defined by ustream implementation, tears down the ustream and frees data
	 */
	void (*free)(struct ustream *s);

	/*
	 * set_read_blocked: (optional)
	 * defined by ustream implementation, called when the read_blocked flag
	 * changes
	 */
	void (*set_read_blocked)(struct ustream *s);

	/*
	 * poll: (optional)
	 * defined by the upstream implementation, called to request polling for
	 * available data.
	 * returns true if data was fetched.
	 */
	bool (*poll)(struct ustream *s);

	/*
	 * ustream user should set this if the input stream is expected
	 * to contain string data. the core will keep all data 0-terminated.
	 */
	bool string_data;     /** 此ustream是否为字符串，true-是；false-否 */
	bool write_error;	  /** 写出错，true-是；false-否 */
	bool eof, eof_write_done;

	enum read_blocked_reason read_blocked;
};

struct ustream_fd {
	struct ustream stream;
	struct uloop_fd fd;
};
```

### 存储结构
![ustream存储结构][1]

### 接口说明
#### 初始/销毁

```c
/**
 * ustream_fd_init: create a file descriptor ustream (uses uloop) 
 */
void ustream_fd_init(struct ustream_fd *s, int fd)

/**
 * ustream_init_defaults: fill default callbacks and options 
 */
void ustream_init_defaults(struct ustream *s)

/**
 * ustream_free: free all buffers and data associated with a ustream 
 */
void ustream_free(struct ustream *s)
```

#### 写入read buffer

```c
/*
 * ustream_reserve: allocate rx buffer space
 * 		分配len大小的read buffer可用内存空间，与ustream_fill_read()配合使用
 *
 * len: hint for how much space is needed (not guaranteed to be met)
 * maxlen: pointer to where the actual buffer size is going to be stored
 */
char *ustream_reserve(struct ustream *s, int len, int *maxlen)

/**
 * ustream_fill_read: mark rx buffer space as filled 
 * 		设置被ustream_reseve()分配read buffer后写入的数据大小，
 *  	回调notify_read()接口，表示有数据可读
 */
void ustream_fill_read(struct ustream *s, int len)
```

#### 读出read buffer
一般在notify_read()回调接口使用

```c
/* 
 * ustream_get_read_buf: get a pointer to the next read buffer data 
 * 		获取新一次写入的内容，与ustream_consume()配置使用
 */
char *ustream_get_read_buf(struct ustream *s, int *buflen)

/**
 * ustream_consume: remove data from the head of the read buffer 
 */
void ustream_consume(struct ustream *s, int len)
```

#### 操作write buffer
尽最大能力调用write()回调用接口写入，如果超出能力将把未写入的数据存储在write buffer中

```c
/* 
 * ustream_write: add data to the write buffer 
 */
int ustream_write(struct ustream *s, const char *buf, int len, bool more)
int ustream_printf(struct ustream *s, const char *format, ...)
int ustream_vprintf(struct ustream *s, const char *format, va_list arg)
```

把在write buffer中的数据写入实际地方，调用write()回调接口和notify_write()回调接口。一般在描述符的poll操作中调用，表示当描述符变为可写时立即把上一次未写入的内容进行写入操作。

```c
/*
 * ustream_write_pending: attempt to write more data from write buffers
 * returns true if all write buffers have been emptied.
 */
bool ustream_write_pending(struct ustream *s)
```

---

## 例子
### 进程任务队列
初始化:

```c
static struct runqueue q;

static void
q_empty(struct runnqueue *q)
{
}

static void
task_init(void)
{
    runqueue_init(&q);
    q.empty_cb = q_empty;
    q.max_running_tasks = 1;  /** 每次只能执行一个任务 */
}
```

定义任务:

```c
struct task {
    struct runqueue_process proc;
    char arg[128];
};

static void
task_run(struct runqueue *q, struct runqueue_task *t)
{
    struct task *tk = container_of(t, struct task, proc.task);
    pid_t pid;

    pid = fork();
    if (pid < 0)
        return;
    if (pid) {
        /** 
         * 因为此task正在运行，实际上只是把此task子进程加入到
         * 进程监听uloop中，当此task子进程运行完成时回调自定义接口，
         * 并执行一个任务循环 「runqueue_start_next」
         */
        runqueue_process_add(q, &tk->proc, pid);
        return;
    }
    /** 子进程使用sleep命令代替 */
    execlp("sleep", "sleep", tk->arg, NULL);
    exit(1);
}

struct const struct runqueue_task_type task_type = {
    .run = task_run,                      /** 需要实现 */
    .cancel = runqueue_process_cancel_cb, /** 自带接口 */
    .kill = runqueue_process_kill_cb,     /** 自带接口 */
};
```

添加任务:

```c
static void
task_complete(struct runqueue *q, struct runqueue_task *t)
{
    struct task *tk = container_of(t, struct task, proc.task);
    free(tk);
}

void
task_add(char *arg)
{
    struct task *tk;

    tk = calloc(1, sizeof(struct task));
    tk->proc.task.type = &task_type;            /** 指定任务类型 */
    tk->proc.task.complete = task_complete;     /** 任务执行完成后hook接口 */
    tk->proc.task.run_timeout = timeout;        /** 任务执行超时时间 */

    strcpy(tk->arg, arg);

    /** 加入到任务队列中 */
    runqueue_task_add(&q, &tk->proc.task, false);
}
```

  [1]: /assets/img/res/ustream.jpeg
