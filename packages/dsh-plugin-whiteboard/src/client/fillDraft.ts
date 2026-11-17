import { createContext, useContext } from 'react'

/**
 * 卡片"填入对话框"能力，由 ConversationView 经宿主 session 作用域的 inputActions 提供。
 * null 表示宿主未注入 inputActions（理论上 conversation.view 必有；防御性降级）。
 */
export const FillDraftContext = createContext<((text: string) => void) | null>(null)

export function useFillDraft() {
  return useContext(FillDraftContext)
}

/** 宿主 InputActions 契约中本插件用到的最小子集（见 dsh-client-ui-conversation InputActions）。 */
export interface InputActionsLike {
  /** 整段替换草稿；不会提交。 */
  setDraft(text: string): void
}

/** 宿主 input hook 的最小签名：selector 读取 InputState.draft。 */
export type UseInputLike = <T>(selector: (input: { draft: string }) => T) => T
