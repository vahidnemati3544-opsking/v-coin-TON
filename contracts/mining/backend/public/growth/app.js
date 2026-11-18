'use strict';

(() => {
  const canvas = document.getElementById('growth-chart');
  const stage = document.getElementById('chart-stage');
  const emptyState = document.getElementById('empty-state');
  const tooltip = document.getElementById('chart-tooltip');
  const connectionLabel = document.getElementById('connection-label');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const resetButton = document.getElementById('reset-view');
  const ctx = canvas.getContext('2d');

  const state = { candles: [], status: 'idle', scale: 1, offset: 0, dragX: null, plot: null, hitBoxes: [] };
  const green = '#24c98a';
  const muted = '#71808d';
  let refreshBusy = false;

  function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'زمان ثبت نشده';
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function setStatus(status) {
    state.status = status || 'idle';
    statusPill.className = 'status-pill';
    const labels = {
      idle: ['status-idle', 'در انتظار آغاز رسمی'],
      active: ['status-active', 'شاخص فعال است'],
      paused: ['status-paused', 'شاخص موقتاً متوقف است'],
      completed: ['status-completed', 'این دوره به پایان رسیده است']
    };
    const selected = labels[state.status] || ['status-error', 'وضعیت نامشخص'];
    statusPill.classList.add(selected[0]);
    statusText.textContent = selected[1];
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const left = 22, right = 22, top = 24, bottom = 30;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    state.plot = { left, right, top, bottom, width: plotWidth, height: plotHeight };

    ctx.strokeStyle = '#27313a';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    for (let i = 0; i < 5; i += 1) {
      const y = top + (plotHeight * i / 4);
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = muted;
    ctx.font = '10px Tahoma, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('قدیمی‌تر', left, height - 9);
    ctx.textAlign = 'right';
    ctx.fillText('جدیدتر', width - right, height - 9);

    const candles = state.candles;
    state.hitBoxes = [];
    if (!candles.length) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const slot = Math.max(9, Math.min(28, plotWidth / Math.max(8, Math.min(candles.length, 44))));
    const bodyWidth = Math.max(4, Math.min(11, slot * 0.48));
    const visibleCount = Math.max(1, Math.ceil(plotWidth / (slot * state.scale)) + 2);
    const maxOffset = Math.max(0, candles.length - visibleCount);
    state.offset = Math.min(state.offset, maxOffset);
    const start = Math.max(0, candles.length - visibleCount - state.offset);
    const end = Math.min(candles.length, start + visibleCount);
    const visible = candles.slice(start, end);
    const values = visible.flatMap(c => [Number(c.open_usd), Number(c.close_usd), Number(c.high_usd), Number(c.low_usd)]).filter(Number.isFinite);
    if (!values.length) return;
    let min = Math.min(...values), max = Math.max(...values);
    if (max === min) { max += 0.00004; min -= 0.00004; }
    const pad = (max - min) * 0.14;
    min -= pad; max += pad;
    const yFor = value => top + ((max - value) / (max - min)) * plotHeight;

    visible.forEach((candle, index) => {
      const globalIndex = start + index;
      const x = left + (index + 0.5) * slot * state.scale;
      if (x > width - right + slot || x < left - slot) return;
      const open = Number(candle.open_usd);
      const close = Number(candle.close_usd);
      const high = Number(candle.high_usd);
      const low = Number(candle.low_usd);
      if (![open, close, high, low].every(Number.isFinite)) return;
      const yOpen = yFor(open), yClose = yFor(close);
      const yHigh = yFor(high), yLow = yFor(low);
      const color = close >= open ? green : '#df6871';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, yHigh); ctx.lineTo(x, yLow); ctx.stroke();
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(3, Math.abs(yOpen - yClose));
      ctx.fillStyle = color;
      ctx.shadowColor = color + '44';
      ctx.shadowBlur = 7;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      ctx.shadowBlur = 0;
      state.hitBoxes.push({ x, y: Math.min(yHigh, yLow), w: Math.max(15, slot * state.scale), h: Math.max(18, Math.abs(yLow - yHigh)), candle, index: globalIndex });
    });
  }

  function showTooltip(clientX, clientY, candle) {
    tooltip.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = 'کندل رشد V COIN';
    const from = document.createElement('div');
    from.textContent = 'آغاز دوره: ' + dateLabel(candle.period_start);
    const to = document.createElement('div');
    to.textContent = 'پایان دوره: ' + dateLabel(candle.period_end);
    tooltip.append(title, from, to);
    tooltip.hidden = false;
    const rect = stage.getBoundingClientRect();
    const x = Math.min(Math.max(8, clientX - rect.left + 12), rect.width - 205);
    const y = Math.min(Math.max(8, clientY - rect.top + 12), rect.height - 90);
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function findCandle(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return state.hitBoxes.find(box => Math.abs(x - box.x) <= box.w / 2 && y >= box.y - 8 && y <= box.y + box.h + 8);
  }

  async function refresh() {
    if (refreshBusy) return;
    refreshBusy = true;
    try {
      const [currentResponse, candlesResponse] = await Promise.all([
        fetch('/api/v1/price-reference/current', { cache: 'no-store' }),
        fetch('/api/v1/price-reference/candles?limit=500', { cache: 'no-store' })
      ]);
      if (!currentResponse.ok || !candlesResponse.ok) throw new Error('API_UNAVAILABLE');
      const current = await currentResponse.json();
      const history = await candlesResponse.json();
      if (current.price_type !== 'modelled_reference_not_market_price' || history.price_type !== 'modelled_reference_not_market_price') {
        throw new Error('UNEXPECTED_PRICE_SOURCE');
      }
      state.candles = Array.isArray(history.candles) ? history.candles : [];
      setStatus(current.status);
      connectionLabel.textContent = 'اتصال برقرار';
      connectionLabel.style.color = green;
      draw();
    } catch (error) {
      connectionLabel.textContent = 'اتصال برقرار نیست';
      connectionLabel.style.color = '#df858b';
      if (!state.candles.length) {
        emptyState.hidden = false;
        emptyState.querySelector('strong').textContent = 'داده نمودار هنوز در دسترس نیست';
        emptyState.querySelector('span:last-child').textContent = 'پس از آماده‌سازی پایگاه داده و اتصال سرویس، تاریخچه رسمی در این بخش نمایش داده می‌شود.';
      }
    } finally {
      refreshBusy = false;
    }
  }

  canvas.addEventListener('pointermove', event => {
    if (state.dragX !== null) {
      const dx = event.clientX - state.dragX;
      state.offset = Math.max(0, state.offset + Math.round(dx / 12));
      state.dragX = event.clientX;
      draw();
      return;
    }
    const hit = findCandle(event);
    if (hit) showTooltip(event.clientX, event.clientY, hit.candle);
    else tooltip.hidden = true;
  });
  canvas.addEventListener('pointerdown', event => {
    state.dragX = event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointerup', () => { state.dragX = null; });
  canvas.addEventListener('pointercancel', () => { state.dragX = null; });
  canvas.addEventListener('pointerleave', () => { if (state.dragX === null) tooltip.hidden = true; });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    state.scale = Math.max(0.65, Math.min(3.5, state.scale * (event.deltaY < 0 ? 1.12 : 0.89)));
    draw();
  }, { passive: false });
  resetButton.addEventListener('click', () => { state.scale = 1; state.offset = 0; draw(); });
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  refresh();
  window.setInterval(refresh, 15000);
})();