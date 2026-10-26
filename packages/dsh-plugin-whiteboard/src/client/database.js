/**
 * 白板正式离线数据源，由 Codex 或其他 Agent 直接维护。
 * Twig 是一组 VisitNode 与内部 Edge 构成的单向单线链，无分叉、无环、无跨 Twig 连线。
 * TWIG-NNN / VISIT-NNN 只表示稳定身份；节点 Id 在整个白板内唯一。
 * 每条 Twig 的 currentNodeId 指定唯一的完整展示节点；Current 只由数据指定，不提供 UI 切换。
 * 编号、数组顺序与坐标不表达推进顺序；推进关系仅由 Edge 的 source → target 定义。
 * 箭头仅表达推进：前置工作 → 实施 → 达成目标；不表达拆分或归属。
 * 所有计划按行从左向右推进，最右为目标；卡片三条短要点，箭头无文字。
 * Lean 诊断规划与首次证明闭环独立：未执行诊断，不预设补学依赖。
 * 销售案例按首访 → 样品 → 报价 → 季度回访模拟推进；客户不同，不表示真实业务关联或硬依赖。
 * 白板开发链止于节点会话绑定数据结构，不保留空白末端。
 */
/** @type {import('./types').Twig[]} */
export const twigs = [
  // Lean 诊断规划
  {
    "id": "TWIG-001",
    "currentNodeId": "VISIT-001",
    "nodes": [
      {
        "id": "VISIT-001",
        "type": "visit",
        "position": {
          "x": 0,
          "y": 0
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 诊断 · 最低能力"
          },
          "body": [
            "以 GlimpseOfLean 的 Introduction / Shorter 为真实证明锚点。",
            "标准：读目标、懂假设、用基本 tactic、改 Mathlib 证明。",
            "产出能力清单与版本约束；中文课程 v4.22.0，中文文档仅伴读。"
          ],
          "footer": {
            "text": "2026-10-25 · 待规划",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-002",
        "type": "visit",
        "position": {
          "x": 480,
          "y": 0
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 诊断 · 短时任务"
          },
          "body": [
            "设计读目标、解释假设、补全或修改证明的短时任务。",
            "明确时限、可用帮助与通过信号；区分能力不足和环境阻塞。",
            "本机无工具链；在线编辑编译待核实。仅设计，不执行诊断。"
          ],
          "footer": {
            "text": "2026-10-25 · 待规划",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-003",
        "type": "visit",
        "position": {
          "x": 960,
          "y": 0
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 诊断 · 制定行动规则"
          },
          "body": [
            "通过后进入 Mathematics in Lean 等数学形式化学习。",
            "未通过则按原因补 NNG、TPIL 或 Mathlib，再诊断。",
            "产出分支决策表；实际下一步由后续诊断决定。"
          ],
          "footer": {
            "text": "2026-10-25 · 待规划",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-004",
        "type": "visit",
        "position": {
          "x": 1440,
          "y": 0
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean · 明确数学形式化起点"
          },
          "body": [
            "具备可验证的最低能力标准与短时诊断方案。",
            "能区分学习不足、环境阻塞和版本问题。",
            "明确下一项 Do / To Do；本阶段不学习、不安装。"
          ],
          "footer": {
            "text": "2026-10-25 · 待达成",
            "tag": "目标"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "VISIT-001->VISIT-002",
        "source": "VISIT-001",
        "target": "VISIT-002",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-002->VISIT-003",
        "source": "VISIT-002",
        "target": "VISIT-003",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-003->VISIT-004",
        "source": "VISIT-003",
        "target": "VISIT-004",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      }
    ]
  },
  // Lean 首次证明闭环
  {
    "id": "TWIG-002",
    "currentNodeId": "VISIT-005",
    "nodes": [
      {
        "id": "VISIT-005",
        "type": "visit",
        "position": {
          "x": 0,
          "y": 440
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 入门 · 本地环境"
          },
          "body": [
            "为 macOS 首次证明闭环配置 Lean 4、VS Code 与 Lake。",
            "创建匹配版本的 Mathlib 项目，检查并构建通过。",
            "诊断规划可先用在线环境，不以本地安装为前置。"
          ],
          "footer": {
            "text": "2026-10-25 · 待实施",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-006",
        "type": "visit",
        "position": {
          "x": 480,
          "y": 440
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 入门 · 首次证明"
          },
          "body": [
            "在已运行的 Lean 项目中完成 Hello World 级证明。",
            "给定 h : P，用 exact h 证明 P，理解目标与假设。",
            "验收：能解释并修改证明，检查通过，无 sorry。"
          ],
          "footer": {
            "text": "2026-10-25 · 待实施",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-007",
        "type": "visit",
        "position": {
          "x": 960,
          "y": 440
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean 入门 · 集合证明"
          },
          "body": [
            "独立证明：A ⊆ B 且 B ⊆ C，则 A ⊆ C。",
            "允许查文档，不照抄完整答案，独立完成证明。",
            "验收：检查通过、无 sorry、能解释；不代表全部能力达标。"
          ],
          "footer": {
            "text": "2026-10-25 · 待实施",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-008",
        "type": "visit",
        "position": {
          "x": 1440,
          "y": 440
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "Lean · 达成首次证明闭环"
          },
          "body": [
            "在 macOS 上运行 Lean，完成首次定理证明。",
            "独立完成简单集合证明，无 sorry，能解释步骤。",
            "达到入门闭环；不等同于通过全部数学形式化诊断。"
          ],
          "footer": {
            "text": "2026-10-25 · 待达成",
            "tag": "目标"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "VISIT-005->VISIT-006",
        "source": "VISIT-005",
        "target": "VISIT-006",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-006->VISIT-007",
        "source": "VISIT-006",
        "target": "VISIT-007",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-007->VISIT-008",
        "source": "VISIT-007",
        "target": "VISIT-008",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      }
    ]
  },
  // 沪深 A 股采集
  {
    "id": "TWIG-003",
    "currentNodeId": "VISIT-009",
    "nodes": [
      {
        "id": "VISIT-009",
        "type": "visit",
        "position": {
          "x": 0,
          "y": 880
        },
        "data": {
          "workspaceId": "0aa55063-d523-485c-b26d-c8b650a55c6e",
          "header": {
            "title": "沪深 A 股 · 查找旧代码"
          },
          "body": [
            "定位旧系统采集代码，记录仓库、入口与依赖。",
            "梳理数据源、字段、市场、更新与存储方式。",
            "产出代码与能力清单，标记运行条件和待核实项。"
          ],
          "footer": {
            "text": "2026-10-24 · 待细化",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-010",
        "type": "visit",
        "position": {
          "x": 480,
          "y": 880
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "沪深 A 股 · 复用方案"
          },
          "body": [
            "评估可复用、需改造与新增部分，核实数据源。",
            "限定沪深 A 股，明确字段、历史范围、频率与保存方式。",
            "确定 Amuro 外的目标项目，产出改造任务与验收标准。"
          ],
          "footer": {
            "text": "2026-10-24 · 待前序完成",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-011",
        "type": "visit",
        "position": {
          "x": 960,
          "y": 880
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "沪深 A 股 · 实施验证"
          },
          "body": [
            "在目标项目完成采集到保存的最小闭环。",
            "验证市场覆盖、字段与准确性，检查重跑和失败处理。",
            "交付运行入口、说明与验证结果；Amuro 仅管理计划。"
          ],
          "footer": {
            "text": "2026-10-24 · 待前序完成",
            "tag": "计划"
          }
        }
      },
      {
        "id": "VISIT-012",
        "type": "visit",
        "position": {
          "x": 1440,
          "y": 880
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "沪深 A 股 · 数据采集可运行"
          },
          "body": [
            "具备覆盖上海、深圳 A 股的数据采集能力。",
            "按约定字段、频率和保存方式运行并通过验收。",
            "实现位于 Amuro 之外；白板仅管理计划。"
          ],
          "footer": {
            "text": "2026-10-25 · 待达成",
            "tag": "目标"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "VISIT-009->VISIT-010",
        "source": "VISIT-009",
        "target": "VISIT-010",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-010->VISIT-011",
        "source": "VISIT-010",
        "target": "VISIT-011",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-011->VISIT-012",
        "source": "VISIT-011",
        "target": "VISIT-012",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      }
    ]
  },
  // 销售模拟
  {
    "id": "TWIG-004",
    "currentNodeId": "VISIT-014",
    "nodes": [
      {
        "id": "VISIT-013",
        "type": "visit",
        "position": {
          "x": 1440,
          "y": 1320
        },
        "data": {
          "workspaceId": "4fc7bb68-0e91-4590-bae6-4638ea7e7f6e",
          "header": {
            "title": "华东渠道 · 季度回访"
          },
          "body": [
            "核对订单减少原因、交付周期、库存与售后响应。",
            "客户希望提前获得可承诺的发货日期。",
            "每周同步订单，销售预测需求，运营评估库存，月底复盘。"
          ],
          "footer": {
            "text": "2026-10-20 · 已完成",
            "tag": "拜访"
          }
        }
      },
      {
        "id": "VISIT-014",
        "type": "visit",
        "position": {
          "x": 0,
          "y": 1320
        },
        "data": {
          "workspaceId": "4fc7bb68-0e91-4590-bae6-4638ea7e7f6e",
          "header": {
            "title": "明州制造 · 新客户首访"
          },
          "body": [
            "交流产品性能、适用场景与供应商替换条件。",
            "客户关注样品周期、批量价格与账期，拟先小批量试用。",
            "技术给选型建议，销售补报价，下周确认试单数量与交期。"
          ],
          "footer": {
            "text": "2026-10-22 · 已完成",
            "tag": "拜访"
          }
        }
      },
      {
        "id": "VISIT-015",
        "type": "visit",
        "position": {
          "x": 480,
          "y": 1320
        },
        "data": {
          "workspaceId": "4fc7bb68-0e91-4590-bae6-4638ea7e7f6e",
          "header": {
            "title": "样品签收 · 异常排查"
          },
          "body": [
            "样品显示送达，仓库三天未登记，采购未收到入库通知。",
            "核对运单、联系人与卸货位置，索取签收凭证。",
            "代收则补录并安排测试；无法定位则补寄并完善提醒。"
          ],
          "footer": {
            "text": "2026-10-23 · 待处理",
            "tag": "问题"
          }
        }
      },
      {
        "id": "VISIT-016",
        "type": "visit",
        "position": {
          "x": 960,
          "y": 1320
        },
        "data": {
          "workspaceId": "4fc7bb68-0e91-4590-bae6-4638ea7e7f6e",
          "header": {
            "title": "客户报价 · 统一折扣"
          },
          "body": [
            "销售与财务发出不同折扣报价，客户提出疑问。",
            "核对审批、有效期与数量，统一依据并发送修订版。",
            "更新价格台账、停用旧文件，增加发送前复核。"
          ],
          "footer": {
            "text": "2026-10-23 · 待处理",
            "tag": "问题"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "VISIT-014->VISIT-015",
        "source": "VISIT-014",
        "target": "VISIT-015",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-015->VISIT-016",
        "source": "VISIT-015",
        "target": "VISIT-016",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-016->VISIT-013",
        "source": "VISIT-016",
        "target": "VISIT-013",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      }
    ]
  },
  // 白板聊天功能开发
  {
    "id": "TWIG-005",
    "currentNodeId": "VISIT-021",
    "nodes": [
      {
        "id": "VISIT-017",
        "type": "visit",
        "position": {
          "x": 1040,
          "y": 1800
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "完善 Dialog 内容与交互机制"
          },
          "body": [
            "优先验证点击 IconSend 后在 White Board 右侧栏打开官方嵌入式 Chat，白板主界面保持可见。",
            "复用官方 conversation.content、sidebar.chat.conversation 与 Session 绑定机制；每次卡片唤起使用独立新 Session，不复用固定 HBR 会话。",
            "保留现有 Dialog 跳转固定 HBR 会话入口；确认右侧栏打开、关闭、Session 生命周期及并存交互后再定验收。"
          ],
          "footer": {
            "text": "2026-10-25 · Next",
            "tag": "待讨论"
          }
        }
      },
      {
        "id": "VISIT-018",
        "type": "visit",
        "position": {
          "x": 2000,
          "y": 1800
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "设计节点会话绑定数据结构"
          },
          "body": [
            "在 Dialog 内容讨论之后安排实施。",
            "讨论节点 sessionId 数据结构与会话绑定机制。",
            "此顺序反映当前实现优先级，不表示两项工作存在必然的逻辑依赖。"
          ],
          "footer": {
            "text": "2026-10-25 · Next",
            "tag": "待讨论"
          }
        }
      },
      {
        "id": "VISIT-019",
        "type": "visit",
        "position": {
          "x": 0,
          "y": 1990
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "增加聊天图标并打开 Dialog"
          },
          "body": [
            "在每张卡片右下角增加聊天图标按钮，点击即可打开最简 Dialog，暂不提供会话跳转。",
            "Dialog 仅展示简短提示和关闭入口，支持正常打开与关闭，先交付一个可操作的界面增量。",
            "验收时确认图标可见、点击不会拖动卡片，弹窗关闭后能够再次打开，不改变现有白板操作。"
          ],
          "footer": {
            "text": "2026-10-25 · Done",
            "tag": "已完成"
          }
        }
      },
      {
        "id": "VISIT-020",
        "type": "visit",
        "position": {
          "x": 520,
          "y": 1990
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "通过 Dialog 跳转 Chat Session"
          },
          "body": [
            "在已能打开的 Dialog 中增加 Submit 按钮，点击后关闭弹窗并跳转到指定的既有会话。",
            "所有卡片共用代码中写死的会话标识，统一跳转至 HBR 项目已打开的会话，暂不修改节点数据结构。",
            "跳转时将写死的 Prompt 预填为输入框草稿；若用户已有草稿则保留原文，由用户确认发送。"
          ],
          "footer": {
            "text": "2026-10-25 · Next",
            "tag": "待实现"
          }
        }
      },
      {
        "id": "VISIT-021",
        "type": "visit",
        "position": {
          "x": 1520,
          "y": 1800
        },
        "data": {
          "workspaceId": "f614d480-fa36-4656-a181-21b2efb5af95",
          "header": {
            "title": "绑定节点工作区并直达 Chat 抽屉"
          },
          "body": [
            "为节点增加可选的 workspaceId 字段，存在时在对应工作区创建会话，沿用已验收的右侧抽屉。",
            "缺少 workspaceId 时直接使用写死的 HBR 工作区标识，不反查、不自动选择其他工作区。",
            "点击图标直接打开右侧 Chat 抽屉，移除弹窗和原会话外跳入口，保留现有抽屉与会话生命周期。"
          ],
          "footer": {
            "text": "2026-10-26 · 待实施",
            "tag": "计划"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "VISIT-020->VISIT-017",
        "source": "VISIT-020",
        "target": "VISIT-017",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-019->VISIT-020",
        "source": "VISIT-019",
        "target": "VISIT-020",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-017->VISIT-021",
        "source": "VISIT-017",
        "target": "VISIT-021",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      },
      {
        "id": "VISIT-021->VISIT-018",
        "source": "VISIT-021",
        "target": "VISIT-018",
        "type": "smoothstep",
        "markerEnd": {
          "type": "arrowclosed",
          "color": "var(--dsw-alias-label-tertiary)"
        }
      }
    ]
  }
]
