/** Official Conversation in the drawer, using the fixed Hero layout. */
export function WhiteBoardConversation({ renderFactorySlot }: any) {
  return renderFactorySlot('conversation.content', {
    variant: 'embedded',
    phase: 'hero',
    hero: true,
  }, { slots: { views: _Official_ConversationSession_OnlyChatView_Adapter } })
}

const _Official_ConversationSession_OnlyChatView_Adapter = ({ renderSlot }: any) => {
  return renderSlot('conversation.session', { view: 'chat' })
}
