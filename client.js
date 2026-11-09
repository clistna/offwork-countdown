window.__ModuleLoader__.load({
  id: '@local/offwork-countdown',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'offwork-countdown';

    const EN = {
      before: 'Until off work',
      off: 'Off work 🎉',
      weekend: 'Weekend 🎉',
    };
    const ZH = {
      before: '距下班还有',
      off: '已下班 🎉',
      weekend: '周末休息 🎉',
    };

    const OFF_HOUR = 17;
    const OFF_MINUTE = 30;

    function pad2(n) {
      return String(n).padStart(2, '0');
    }

    function formatRemaining(ms) {
      const s = Math.floor(Math.max(0, ms) / 1000);
      return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
    }

    const clockIcon = h(
      'svg',
      {
        width: 16,
        height: 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      h('circle', { cx: 12, cy: 12, r: 9 }),
      h('path', { d: 'M12 7v5l3.5 2' }),
    );

    function Badge({ t, locale }) {
      const [, setTick] = React.useState(0);
      const [, setRev] = React.useState(() => locale.getSnapshot().revision);

      React.useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(id);
      }, []);

      React.useEffect(() => {
        return locale.subscribe(() => setRev((n) => n + 1));
      }, [locale]);

      function label(key) {
        const v = t(key);
        if (v !== key) return v;
        const active = String(locale.getSnapshot().active || '').toLowerCase();
        return active.startsWith('zh') ? ZH[key] : EN[key];
      }

      const now = new Date();
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;

      let labelText;
      let timeText = null;
      if (isWeekend) {
        labelText = label('weekend');
      } else {
        const target = new Date(now);
        target.setHours(OFF_HOUR, OFF_MINUTE, 0, 0);
        const diff = target.getTime() - now.getTime();
        if (diff <= 0) {
          labelText = label('off');
        } else {
          labelText = label('before');
          timeText = formatRemaining(diff);
        }
      }

      return h(
        'div',
        { style: { display: 'flex', justifyContent: 'center', width: '100%', padding: '2px 0' } },
        h(
          'div',
          {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'var(--dsw-alias-bg-layer-1)',
              border: '1px solid var(--dsw-alias-border-l1)',
              color: 'var(--dsw-alias-label-secondary)',
              fontSize: '13px',
              lineHeight: '20px',
            },
          },
          h('span', { style: { display: 'inline-flex', color: 'var(--dsw-alias-brand-primary)' } }, clockIcon),
          h('span', null, labelText),
          timeText
            ? h(
                'span',
                {
                  style: {
                    color: 'var(--dsw-alias-brand-primary)',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.02em',
                  },
                },
                timeText,
              )
            : null,
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposers = [
          ctx.locale.register(NS, 'en', EN),
          ctx.locale.register(NS, 'zh', ZH),
          ctx.locale.register(NS, 'zh-CN', ZH),
          ctx.locale.register(NS, 'zh-Hans', ZH),
        ];
        const t = ctx.locale.bind(NS);

        disposers.push(
          ctx.slots.inject('conversation.composer.dock', () =>
            ctx.slots.register(
              { name: 'conversation.composer.dock', id: 'offwork-countdown', order: 5 },
              () => h(Badge, { t, locale: ctx.locale }),
            ),
          ),
        );

        return () => {
          for (const d of disposers) d();
        };
      },
    };
  },
});
