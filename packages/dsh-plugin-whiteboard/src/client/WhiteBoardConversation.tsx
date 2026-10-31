/** Official Conversation in the drawer, using the fixed Hero layout. */
export function WhiteBoardConversation({ renderFactorySlot }: any) {
  return renderFactorySlot('conversation.content', {
    variant: 'embedded',
    phase: 'hero',
    hero: true,
  })
}
