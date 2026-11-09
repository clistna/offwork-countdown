window.__ModuleLoader__.load({
  id: '@local/offwork-countdown',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'offwork-countdown';
    const STORAGE_KEY = 'offwork-countdown:pos';

    const EDGE = 8;
    // The app's title bar (session title + window controls) paints above the
    // floating layer, so keep the pill below it or it cannot be grabbed.
    const MIN_TOP = 64;

    const EN = {
      before: 'Until off work',
      off: 'Off work 🎉',
      weekend: 'Weekend 🎉',
      drag: 'Drag to move',
    };
    const ZH = {
      before: '距下班还有',
      off: '已下班 🎉',
      weekend: '周末休息 🎉',
      drag: '拖动可移动',
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

    function loadPos() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
        }
      } catch (e) {}
      return null;
    }

    function defaultPos() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      return { x: Math.max(EDGE, w - 190), y: Math.max(MIN_TOP, 80) };
    }

    function Badge({ t, locale }) {
      const [, setTick] = React.useState(0);
      const [, setRev] = React.useState(() => locale.getSnapshot().revision);
      const [pos, setPos] = React.useState(() => loadPos() || defaultPos());
      const [dragging, setDragging] = React.useState(false);
      const dragRef = React.useRef(null);
      const posRef = React.useRef(pos);
      const pillRef = React.useRef(null);
      const sizeRef = React.useRef({
        w: typeof window !== 'undefined' ? window.innerWidth : 1200,
        h: typeof window !== 'undefined' ? window.innerHeight : 800,
      });

      React.useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(id);
      }, []);

      React.useEffect(() => {
        return locale.subscribe(() => setRev((n) => n + 1));
      }, [locale]);

      React.useEffect(() => {
        posRef.current = pos;
      }, [pos]);

      // Zoom and window resizes change the CSS-pixel viewport without moving
      // the stored pixel position, so rescale it to the new viewport and keep
      // it on screen.
      React.useEffect(() => {
        function onResize() {
          const nw = window.innerWidth;
          const nh = window.innerHeight;
          if (!nw || !nh) return;
          const ow = sizeRef.current.w;
          const oh = sizeRef.current.h;
          const p = posRef.current;
          let rect = null;
          try {
            rect = pillRef.current ? pillRef.current.getBoundingClientRect() : null;
          } catch (e) {}
          const pw = rect && rect.width ? rect.width : 140;
          const ph = rect && rect.height ? rect.height : 28;
          const maxX = Math.max(EDGE, nw - pw - EDGE);
          const maxY = Math.max(MIN_TOP, nh - ph - EDGE);
          const ratioX = ow > 0 ? p.x / ow : 0;
          const ratioY = oh > 0 ? p.y / oh : 0;
          const nx = Math.min(Math.max(EDGE, ratioX * nw), maxX);
          const ny = Math.min(Math.max(MIN_TOP, ratioY * nh), maxY);
          sizeRef.current = { w: nw, h: nh };
          posRef.current = { x: nx, y: ny };
          setPos({ x: nx, y: ny });
          save({ x: nx, y: ny });
        }

        onResize();

        window.addEventListener('resize', onResize);
        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(onResize);
          try {
            ro.observe(document.documentElement);
          } catch (e) {}
        }
        const vv = window.visualViewport;
        if (vv) vv.addEventListener('resize', onResize);
        return () => {
          window.removeEventListener('resize', onResize);
          if (ro) ro.disconnect();
          if (vv) vv.removeEventListener('resize', onResize);
        };
      }, []);

      function label(key) {
        const v = t(key);
        if (v !== key) return v;
        const active = String(locale.getSnapshot().active || '').toLowerCase();
        return active.startsWith('zh') ? ZH[key] : EN[key];
      }

      function save(p) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        } catch (e) {}
      }

      function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: posRef.current.x,
          origY: posRef.current.y,
          width: rect.width,
          height: rect.height,
        };
        setDragging(true);
        e.preventDefault();

        const move = (ev) => {
          const d = dragRef.current;
          if (!d) return;
          ev.preventDefault();
          const maxX = Math.max(EDGE, window.innerWidth - d.width - EDGE);
          const maxY = Math.max(MIN_TOP, window.innerHeight - d.height - EDGE);
          const nx = Math.min(Math.max(EDGE, d.origX + (ev.clientX - d.startX)), maxX);
          const ny = Math.min(Math.max(MIN_TOP, d.origY + (ev.clientY - d.startY)), maxY);
          posRef.current = { x: nx, y: ny };
          setPos({ x: nx, y: ny });
        };

        const up = () => {
          dragRef.current = null;
          setDragging(false);
          save(posRef.current);
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          window.removeEventListener('blur', up);
        };

        window.addEventListener('pointermove', move, { passive: false });
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        window.addEventListener('blur', up);
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

      const full = timeText ? labelText + ' ' + timeText : labelText;

      return h(
        'div',
        {
          ref: pillRef,
          title: full + ' · ' + label('drag'),
          onPointerDown: onPointerDown,
          style: {
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: 'var(--dsw-alias-bg-overlay)',
            border: '1px solid var(--dsw-alias-border-l1)',
            color: 'var(--dsw-alias-label-secondary)',
            fontSize: '12px',
            lineHeight: '18px',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            pointerEvents: 'auto',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 2147483647,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            WebkitAppRegion: 'no-drag',
          },
        },
        h('span', { style: { display: 'inline-flex' } }, clockIcon),
        timeText
          ? h(
              'span',
              {
                style: {
                  color: 'var(--dsw-alias-brand-primary)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                },
              },
              timeText,
            )
          : h('span', null, labelText),
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
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              { name: 'shell.overlay', id: 'offwork-countdown', order: 500 },
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
