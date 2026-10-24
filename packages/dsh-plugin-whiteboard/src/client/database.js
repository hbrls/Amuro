/**
 * Mock database for the whiteboard.
 * Keep this JavaScript module as the eventual replacement point for persisted data.
 */
/** @type {import('./VisitNode').VisitNodeType[]} */
export const nodes = [
  {
    id: 'v1',
    type: 'visit',
    position: { x: 0, y: 0 },
    data: {
      header: { title: '华东渠道季度回访交付周期优化方案沟通记录' },
      body: [
        '本次回访重点了解华东渠道客户近期订单减少原因，并核对交付周期、库存储备及售后响应情况。',
        '客户表示，旺季排产波动影响了采购计划，希望提前获得可承诺的发货日期。',
        '双方约定每周同步重点订单进度，由销售整理需求预测，运营评估安全库存，月底再次复盘交付表现，并确认下一季度的合作安排与责任分工。',
      ],
      footer: { text: '2026-10-20 · 已完成', tag: '拜访' },
    },
  },
  {
    id: 'v2',
    type: 'visit',
    position: { x: 0, y: 460 },
    data: {
      header: { title: '明州制造新客户首访及产品采购合作意向跟进' },
      body: [
        '首次拜访明州制造采购团队，围绕主要产品性能、适用场景及现有供应商替换条件展开交流。',
        '客户重点关注样品测试周期、批量采购价格和账期政策，希望先完成小批量试用再讨论年度框架合作。',
        '现场已收集设备参数与验收标准，后续由技术提供选型建议，销售补充报价，在下周安排线上答疑，确认试单数量与交期。',
      ],
      footer: { text: '2026-10-22 · 已完成', tag: '拜访' },
    },
  },
  {
    id: 'v3',
    type: 'visit',
    position: { x: 440, y: 230 },
    data: {
      header: { title: '客户样品签收异常排查仓库收货流程改进方案' },
      body: [
        '物流系统显示样品已送达客户园区，但仓库连续三天未完成签收登记，采购负责人也未收到入库通知。',
        '需要先核对运单、收货联系人与卸货位置，再请承运方提供签收凭证及照片。',
        '若确认由其他部门代收，应协调仓库补录记录并安排样品测试；若仍无法定位，则启动补寄流程，同时完善异常提醒，避免影响试用计划。',
      ],
      footer: { text: '2026-10-23 · 待处理', tag: '问题' },
    },
  },
  {
    id: 'v4',
    type: 'visit',
    position: { x: 440, y: 690 },
    data: {
      header: { title: '客户报价折扣口径统一销售财务协同处理记录' },
      body: [
        '销售与财务向同一客户发送了两版折扣不同的报价单，客户对采购价格和优惠适用条件提出疑问。',
        '需要核对审批记录、报价有效期及订单数量，明确统一的折扣依据，由销售负责人出具修订版本并说明差异原因。',
        '财务同步更新价格台账，暂停使用旧版文件，后续增加发送前复核环节，确保合同、订单与开票金额一致。',
      ],
      footer: { text: '2026-10-23 · 待处理', tag: '问题' },
    },
  },
]

/**
 * Mock 关系：将明州制造首访的样品试用、正式报价分别关联到两张问题卡。
 * 问题卡未指定客户，此处仅作 mock 归属假设，不表示真实业务事实。
 * 华东回访聚焦交付周期，缺少与这两项问题的直接关联，保持独立。
 * 拜访在左、后续问题在右，使用圆角折线与终点实心箭头。
 * @type {import('@xyflow/react').Edge[]}
 */
export const edges = [
  {
    id: 'v2-v3',
    source: 'v2',
    target: 'v3',
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed', color: 'var(--dsw-alias-label-tertiary)' },
  },
  {
    id: 'v2-v4',
    source: 'v2',
    target: 'v4',
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed', color: 'var(--dsw-alias-label-tertiary)' },
  },
]
