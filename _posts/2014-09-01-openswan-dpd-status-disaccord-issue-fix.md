---
layout: post
title: "openswan DPD可能引起状态不一致修改"
date: 2014-09-01
category: vpn
tags: vpn ipsec openswan
---

**环境**
> 都开启了DPD

server端DPD探测到client不在线，删除自己的`ISAKMP SA`和`IPsec SA`，发送删除`ISAKMP SA`和`IPsec SA`两个通知报文给client端，此时如果client端只收到删除`ISAKMP SA`的报文，client端把`ISAKMP SA`删除了，但`IPsec SA`还存在，这就出现在状态不一致问题，server端状态为断开，client端状态为连接，实际上隧道已不能互通。同时DPD无法工作（因为`ISAKMP SA`不存在）

理论上这种情况很难出现，因为两端DPD都开启，当server探测到client不在线时，client也应该探测到server不在线了。在真实网络中，特别是中国的ISP环境下，client收到server DPD报文后已做出回应，但server就是收不到，这样client是不可能探测到server不在线的

这种情况我觉得也跟DPD探测机制有关，因为DPD定义只要本端收到对端发送的R_U_THERE报文或R_U_ACK报文都认为对端是在线的

修改dpd.c加入`BEGIN MODIFY`到`END MODIFY`之间的代码，当DPD发现`ISAKMP SA`不存时进行重协商，从而保证隧道连续可用

```c
void p2_dpd_outI1(struct state *p2st)
{
    struct state *st;
    time_t delay = p2st->st_connection->dpd_delay;
    time_t timeout = p2st->st_connection->dpd_timeout;

    /* find the related Phase 1 state */
    st = find_phase1_state(p2st->st_connection, ISAKMP_SA_ESTABLISHED_STATES);

    if (st == NULL)
    {
/** BEGIN MODIFY **/
        /*loglog(RC_LOG_SERIOUS, "DPD: could not find newest phase 1 state");*/
#define DELETE_SA_DELAY  EVENT_RETRANSMIT_DELAY_0
        if (p2st->st_event != NULL &&
            p2st->st_event->ev_type == EVENT_SA_REPLACE &&
            p2st->st_event->ev_time <= DELETE_SA_DELAY + now()) {
            loglog(RC_LOG_SERIOUS, "DPD: could not find newest phase 1 state: "
                    "already replacing IPSEC State #%lu in %d seconds"
                    , p2st->st_serialno, (int)(p2st->st_event->ev_time - now()));
        } else {
            loglog(RC_LOG_SERIOUS, "DPD: could not find newest phase 1 state: "
                    "replace IPSEC State #%lu in %d seconds"
                    , p2st->st_serialno, DELETE_SA_DELAY);
            p2st->st_margin = DELETE_SA_DELAY;
            delete_event(p2st);
            event_schedule(EVENT_SA_REPLACE, DELETE_SA_DELAY, p2st);
        }
/** END MODIFY **/
        return;
    }

    dpd_outI(st, p2st, TRUE, delay, timeout);
}
```
