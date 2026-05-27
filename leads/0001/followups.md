# HiCash / 同盾 SDK 接入 - Follow-ups

## FUP-001

- **Status**: ready_to_send
- **Target**: 需求 owner
- **Purpose**: 获取接入所需上下文，判断是否可以进入执行 Plan。
- **Expected Reply**: SDK 文档、AppKey / 环境、端范围、验收标准、deadline。

### Message

```text
可以推进 HiCash App 接入同盾 SDK。我先确认几个接入必需信息，避免后面卡在联调或验收：

1. 这次要接 iOS、Android，还是两端都接？
2. 同盾 SDK 文档、AppKey / AppId、测试环境现在有了吗？
3. 验收标准是什么？是同盾后台能看到设备数据，还是业务链路要拿到风控结果？
4. 是否涉及服务端事件上报、回调或业务拦截？
5. 这件事的上线 / 验收时间是什么？

拿到这些后，我可以把它转成具体接入 checklist。
```

## If No Reply

### FUP-002

- **Trigger**: FUP-001 发出后 24 小时无回复
- **Status**: scheduled

```text
我先按最小接入路径理解：App 端完成同盾 SDK 初始化、配置测试环境，并让同盾后台能看到设备数据。

但现在还缺两个最关键的信息：
1. iOS / Android 哪些端要接？
2. 同盾 SDK 文档和 AppKey 是否已经准备好？

你先确认这两点，我就能继续拆接入任务。
```
