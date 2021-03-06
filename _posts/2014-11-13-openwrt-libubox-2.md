---
layout: post
title: "libubox [2] - avl vlist kvlist"
date: 2014-11-13
category: openwrt
tags: openwrt libubox
---

## 平衡二叉树(avl.c/h)
### 数据结构

```c
/**
 * This element is a member of a avl-tree. It must be contained in all
 * larger structs that should be put into a tree.
 */
struct avl_node {
  /**
   * Linked list node for supporting easy iteration and multiple
   * elments with the same key.
   *
   * this must be the first element of an avl_node to
   * make casting for lists easier
   */
  struct list_head list;

  /**
   * Pointer to parent node in tree, NULL if root node
   */
  struct avl_node *parent;

  /**
   * Pointer to left child
   */
  struct avl_node *left;

  /**
   * Pointer to right child
   */
  struct avl_node *right;

  /**
   * pointer to key of node
   */
  const void *key;

  /**
   * balance state of AVL tree (0,-1,+1)
   */
  signed char balance;

  /**
   * true if first of a series of nodes with same key
   */
  bool leader;
};

/**
 * This struct is the central management part of an avl tree.
 * One of them is necessary for each avl_tree.
 */
struct avl_tree {
  /**
   * Head of linked list node for supporting easy iteration
   * and multiple elments with the same key.
   */
  struct list_head list_head;

  /**
   * pointer to the root node of the avl tree, NULL if tree is empty
   */
  struct avl_node *root;

  /**
   * number of nodes in the avl tree
   */
  unsigned int count;

  /**
   * true if multiple nodes with the same key are
   * allowed in the tree, false otherwise
   */
  bool allow_dups;

  /**
   * pointer to the tree comparator
   *
   * First two parameters are keys to compare,
   * third parameter is a copy of cmp_ptr
   */
  avl_tree_comp comp;

  /**
   * custom pointer delivered to the tree comparator
   */
  void *cmp_ptr;
};
```

### 初始化

```c
#define AVL_TREE(_name, _comp, _allow_dups, _cmp_ptr)

/**
 * Initialize a new avl_tree struct
 * @param tree pointer to avl-tree
 * @param comp pointer to comparator for the tree
 * @param allow_dups true if the tree allows multiple elements with the same
 * @param ptr custom parameter for comparator
 */
void avl_init(struct avl_tree *tree, avl_tree_comp comp, 
              bool allow_dups, void *ptr)
```

### 基本操作
#### 加入

```c
/**
 * Inserts an avl_node into a tree
 * @param tree pointer to tree
 * @param new pointer to node
 * @return 0 if node was inserted successfully, -1 if it was not inserted
 *   because of a key collision
 */
int avl_insert(struct avl_tree *tree, struct avl_node *new)
```

#### 删除

```c
/**
 * Inserts an avl_node into a tree
 * @param tree pointer to tree
 * @param new pointer to node
 * @return 0 if node was inserted successfully, -1 if it was not inserted
 *   because of a key collision
 */
int avl_insert(struct avl_tree *tree, struct avl_node *new)
```

#### 查找

```c
/**
 * Finds a node in an avl-tree with a certain key
 * @param tree pointer to avl-tree
 * @param key pointer to key
 * @return pointer to avl-node with key, NULL if no node with
 *    this key exists.
 */
struct avl_node * avl_find(const struct avl_tree *tree, const void *key)

/**
 * Finds the first node in an avl-tree with a key greater or equal
 * than the specified key
 * @param tree pointer to avl-tree
 * @param key pointer to specified key
 * @return pointer to avl-node, NULL if no node with
 *    key greater or equal specified key exists.
 */
struct avl_node * avl_find_greaterequal(const struct avl_tree *tree, 
                                         const void *key)

/**
 * Finds the last node in an avl-tree with a key less or equal
 * than the specified key
 *
 * @param tree pointer to avl-tree
 * @param key pointer to specified key
 * @return pointer to avl-node, NULL if no node with
 *         key less or equal specified key exists.
 */
struct avl_node * avl_find_lessequal(const struct avl_tree *tree, const void *key)

/**
 * @param tree pointer to avl-tree
 * @param key pointer to key
 * @param element pointer to a node element(don't need to be initialized)
 * @param node_element name of the avl_node element inside the larger struct
 * return pointer to tree element with the specified key,
 *        NULL if no element was found
 */
#define avl_find_element(tree, key, element, node_element)

/**
 * @param tree pointer to avl-tree
 * @param key pointer to specified key
 * @param element pointer to a node element (don't need to be initialized)
 * @param node_element name of the avl_node element inside the larger struct
 * return pointer to last tree element with less or equal key than specified key,
 *        NULL if no element was found
 */
#define avl_find_le_element(tree, key, element, node_element)

/**
 * @param tree pointer to avl-tree
 * @param key pointer to specified key
 * @param element pointer to a node element (don't need to be initialized)
 * @param node_element name of the avl_node element inside the larger struct
 * return pointer to first tree element with greater or equal key than 
 *        specified key, NULL if no element was found
 */
#define avl_find_ge_element(tree, key, element, node_element)
```

#### 获取节点元素

```c
/**
 * This function must not be called for an empty tree
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node element (don't need to be initialized)
 * @param node_member name of the avl_node element inside the larger struct
 * @return pointer to the first element of the avl_tree
 *         (automatically converted to type 'element')
 */
#define avl_first_element(tree, element, node_member)

/**
 * @param tree pointer to tree
 * @param element pointer to a node struct that contains the avl_node
 *        (don't need to be initialized)
 * @param node_member name of the avl_node element inside the
 *        larger struct
 * @return pointer to the last element of the avl_tree
 *         (automatically converted to type 'element')
 */
#define avl_last_element(tree, element, node_member)

/**
 * This function must not be called for the last element of an avl tree
 *
 * @param element pointer to a node of the tree
 * @param node_member name of the avl_node element inside the larger struct
 * @return pointer to the node after 'element'
 *         (automatically converted to type 'element')
 */
#define avl_next_element(element, node_member)

/**
 * This function must not be called for the first element of
 * an avl tree
 *
 * @param element pointer to a node of the tree
 * @param node_member name of the avl_node element inside the larger struct
 * @return pointer to the node before 'element'
 *         (automatically converted to type 'element')
 */
#define avl_prev_element(element, node_member)
```

### 状态判断

```c
/**
 * @param tree pointer to avl-tree
 * @param node pointer to node of the tree
 * @return true if node is the first one of the tree, false otherwise
 */
static inline bool avl_is_first(struct avl_tree *tree, struct avl_node *node)

/**
 * @param tree pointer to avl-tree
 * @param node pointer to node of the tree
 * @return true if node is the last one of the tree, false otherwise
 */
static inline bool avl_is_last(struct avl_tree *tree, struct avl_node *node)

/**
 * @param tree pointer to avl-tree
 * @return true if the tree is empty, false otherwise
 */
static inline bool avl_is_empty(struct avl_tree *tree) 
```

### 遍历

```c
/**
 * Loop over all elements of an avl_tree, used similar to a for() command.
 * This loop should not be used if elements are removed from the tree during
 * the loop.
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node of the tree, this element will
 *        contain the current node of the tree during the loop
 * @param node_member name of the avl_node element inside the
 *        larger struct
 */
#define avl_for_each_element(tree, element, node_member)

/**
 * Loop over all elements of an avl_tree backwards, used similar to a for() command.
 * This loop should not be used if elements are removed from the tree during
 * the loop.
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node of the tree, this element will
 *        contain the current node of the tree during the loop
 * @param node_member name of the avl_node element inside the
 *        larger struct
 */
#define avl_for_each_element_reverse(tree, element, node_member)

/**
 * Loop over all elements of an avl_tree, used similar to a for() command.
 * This loop can be used if the current element might be removed from
 * the tree during the loop. Other elements should not be removed during
 * the loop.
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node of the tree, this element will
 *        contain the current node of the tree during the loop
 * @param node_member name of the avl_node element inside the
 *        larger struct
 * @param ptr pointer to a tree element which is used to store
 *        the next node during the loop
 */
#define avl_for_each_element_safe(tree, element, node_member, ptr)

/**
 * Loop over all elements of an avl_tree backwards, used similar to a for() command.
 * This loop can be used if the current element might be removed from
 * the tree during the loop. Other elements should not be removed during
 * the loop.
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node of the tree, this element will
 *        contain the current node of the tree during the loop
 * @param node_member name of the avl_node element inside the
 *        larger struct
 * @param ptr pointer to a tree element which is used to store
 *        the next node during the loop
 */
#define avl_for_each_element_reverse_safe(tree, element, node_member, ptr)

/**
 * A special loop that removes all elements of the tree and cleans up the tree
 * root. The loop body is responsible to free the node elements of the tree.
 *
 * This loop is much faster than a normal one for clearing the tree because it
 * does not rebalance the tree after each removal. Do NOT use a break command
 * inside.
 * You can free the memory of the elements within the loop.
 * Do NOT call avl_delete() on the elements within the loop,
 *
 * @param tree pointer to avl-tree
 * @param element pointer to a node of the tree, this element will
 *        contain the current node of the tree during the loop
 * @param node_member name of the avl_node element inside the
 *        larger struct
 * @param ptr pointer to a tree element which is used to store
 *        the next node during the loop
 */
#define avl_remove_all_elements(tree, element, node_member, ptr)
```

### 比较回调函数
查找操作时被调用，此函数在初始化由调用者设置


```c
/**
 * Prototype for avl comparators
 * @param k1 first key
 * @param k2 second key
 * @param ptr custom data for tree comparator
 * @return +1 if k1>k2, -1 if k1<k2, 0 if k1==k2
 */
typedef int (*avl_tree_comp) (const void *k1, const void *k2, void *ptr)
```

---

## Vlist(vlist.c/h)
### 数据结构

```c
struct vlist_tree {
	struct avl_tree avl;

	vlist_update_cb update;     /** 初始化时调用者设置 */
	bool keep_old;				/** true-加入相同节点时不删除旧节点，false-删除 */
	bool no_delete;				/** true-加入相同节点时不删除旧节点，
                                 *       删除节点时不做删除操作
                                 *  false-加入相同节点时删除旧节点
                                 *        删除节点时做删除操作
                                 */
	int version;
};

struct vlist_node {
	struct avl_node avl;
	int version;
};
```

### 初始化

```c
void vlist_init(struct vlist_tree *tree, avl_tree_comp cmp, vlist_update_cb update)
```

### 基本操作
#### 加入

```c
void vlist_add(struct vlist_tree *tree, struct vlist_node *node, const void *key)
```

#### 删除

```c
void vlist_delete(struct vlist_tree *tree, struct vlist_node *node)
```

#### 清除

```c
static inline void vlist_update(struct vlist_tree *tree)
void vlist_flush(struct vlist_tree *tree)
void vlist_flush_all(struct vlist_tree *tree)
```

#### 查找

```c
#define vlist_find(tree, name, element, node_member)
```

### 遍历

```c
#define vlist_for_each_element(tree, element, node_member)
```

### 更新回调函数
增加和删除节点被回调


```c
typedef void (*vlist_update_cb)(struct vlist_tree *tree,
								struct vlist_node *node_new,
				struct vlist_node *node_old);
```

----

## Key/Value存储(kvlist.c/h)
### 数据结构

```c
struct kvlist {
	struct avl_tree avl;
	int (*get_len)(struct kvlist *kv, const void *data);
};

struct kvlist_node {
	struct avl_node avl;
	char data[0] __attribute__((aligned(4)));
};
```

### 初始/销毁

```c
void kvlist_init(struct kvlist *kv, int (*get_len)(struct kvlist *kv, const void *data))

void kvlist_free(struct kvlist *kv)
```

### 基本操作
#### 加入

```c
void kvlist_set(struct kvlist *kv, const char *name, const void *data)
```

#### 删除

```c
bool kvlist_delete(struct kvlist *kv, const char *name)
```

#### 获取

```c
void *kvlist_get(struct kvlist *kv, const char *name)
```

### 遍历

```c
#define kvlist_for_each(kv, name, value)
```

### 回调函数
加入操作时被回调，初始化时由调用者设置，用于计算data的内存空间大小

```c
int (*get_len)(struct kvlist *kv, const void *data)
```

## 例子
### vlist使用
定义对象:

```c
struct obj {
    struct vlist_node node;

    char key[8];
    char attr1[8];
    char attr2[8];
};
```

初始化vlist

```c
static struct vlist_tree hdr_obj;

static void
obj_list_init(void)
{
    vlist_init(&hdr_obj, avl_strcmp, obj_update_cb);
    hdr_obj.keep_old = true;
    hdr_obj.no_delete = true;
}
```

定义节点更新回调接口:

```c
static void
obj_update_cb(struct vlist_tree *tree, struct vlist_node *new, struct vlist_node *old)
{
    struct obj *old_obj = container_of(old, struct obj, node);
    struct obj *new_obj = container_of(new, struct obj, node);

    if (old && new) { /** update */
        obj_change_cb(new_obj, old_obj);
    } else if (old) { /** delete */
        obj_delete_cb(old);
    } else if (new) { /** addnew */
        /** do nothing */
    }
}
```

```c
static void
obj_change_cb(struct obj *new, struct obj *old)
{
    bool reload = false;
    
#define OBJ_ATTR_CMP(field) \
    if (strcmp(new->##field, old->##field)) { \
        reload = true; \
    }
    
    OBJ_ATTR_CMP(key);
    OBJ_ATTR_CMP(arg1);
    OBJ_ATTR_CMP(arg1);
#undef OBJ_ATTR_CMP

    if (reload) {
        /** 
         * do something
         * update old obj attrs by new obj
         */
    }

    /** 
     * TODO:
     * must be free new obj, because 「hdr_obj」init
     * .keep_old = true
     */
    free(new);
}
```

```c
static void
obj_delete_cb(struct obj *old)
{
    /**
     * must be unbind from avl tree by yourself,
     * because 「hdr_obj」 init .no_delete = true
     */
    avl_delete(&hdr_obj.avl, &old->node.avl);

    free(old);
}
```

插入新obj:

```c
struct obj *
obj_insert(struct obj *obj)
{
    vlist_add(&hdr_obj, &obj->node, obj->key);

    /**
     * 必须重新调用「vlist_find」查找获取obj指针
     * 因为调用「vlist_add」后obj指针可能发生改变
     */
    obj = vlist_find(&hdr_obj, obj->key, obj, node);
    if (!obj) {
        goto error;
    }
    return obj;

error:
    return NULL;
}
```

删除obj:

> 方法1:
> 使用「vlist_update」和「vlist_flush」接口

```c
void
obj_remove_1(void)
{
    vlist_update(&hdr_obj);
    
    /** 
     * do something with vlist nodes
     */

    /*
     * 删除上面没有被操作过节点
     */
    vlist_flush(&hdr_obj);
}
```

> 方法2:
> 使用「vlist_delete」接口

```c
void
obj_remove_2(const char *key)
{
    struct obj *o = vlist_find(&hdr_obj, key, o, node);

    vlist_delete(&hdr_obj, &o->node);

    free(o);
}
```

