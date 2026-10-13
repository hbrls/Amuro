window.__ModuleLoader__.load({
  id: 'dsh-plugin-amuro',
  factory: (require) => {
    const React = require('react');
    // TODO: swap IconPlayOutlineRegular for an Amuro-themed icon once available.
    const { IconPlayOutlineRegular } = require('@deepseek-ai/dsh-client-ui-primitives');

    const h = React.createElement;

    /** Sidebar 面板图标，照 sidebar.panellist 契约转发官方图标。 */
    const Icon = ({ size }) => h(IconPlayOutlineRegular, { size });

    /** main keyed slot 页面。 */
    function AmuroPage() {
      return h('div', {
        style: {
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--dsw-alias-label-primary, inherit)',
        },
      }, 'Hello Amuro');
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'plugin-amuro',
          order: 1,
          label: 'Amuro',
        }, Icon));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'plugin-amuro',
        }, () => h(AmuroPage)));
      },
    };
  },
});
