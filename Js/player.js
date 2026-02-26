// ═══════════════════════════════════════════
// PEDAL OR DIE — player.js  (Phase 2)
// Survival stats with consequences, critical
// warnings, visual bar colour changes
// ═══════════════════════════════════════════

const Player = {

  _tickTimer: null,

  // ── Start survival tick ───────────────────
  startTick() {
    // DayNight drives time now — player tick just checks criticals
    this._tickTimer = setInterval(() => this._criticalCheck(), 15000);
  },

  stopTick() { clearInterval(this._tickTimer); },

  // ── Critical stat check ───────────────────
  _criticalCheck() {
    if (this._tickPaused) return;
    if (!State.data) return;
    const p = State.data.player;

    if (p.hunger <= 10) {
      Utils.toast('☠ STARVING! Find food immediately!', 'bad', 5000);
      // Starving costs energy faster
      p.energy = Utils.clamp(p.energy - 5, 0, 100);
    } else if (p.hunger <= 25) {
      Utils.toast('🍖 Very hungry. Eat something soon.', 'warn');
    }

    if (p.thirst <= 10) {
      Utils.toast('☠ DEHYDRATED! Drink water now!', 'bad', 5000);
      p.energy = Utils.clamp(p.energy - 8, 0, 100);
    } else if (p.thirst <= 25) {
      Utils.toast('💧 Very thirsty. Drink soon.', 'warn');
    }

    if (p.energy <= 10) {
      Utils.toast('😴 Exhausted! You need to rest.', 'warn');
    }

    // Update bar colours to reflect urgency
    this._updateBarColours();
    HUD.update();
  },

  // ── Update HUD bar colours ─────────────────
  _updateBarColours() {
    if (!State.data) return;
    const p = State.data.player;

    this._tintBar('hud-hunger', p.hunger,
      { critical: '#e53935', low: '#ff6d00', ok: '#ff8f00' });
    this._tintBar('hud-thirst', p.thirst,
      { critical: '#1565c0', low: '#1976d2', ok: '#29b6f6' });
    this._tintBar('hud-energy', p.energy,
      { critical: '#e53935', low: '#f9a825', ok: '#ffd600' });
  },

  _tintBar(id, value, colors) {
    const fill = document.getElementById(id);
    if (!fill) return;
    if (value <= 15)      fill.style.background = colors.critical;
    else if (value <= 35) fill.style.background = colors.low;
    else                  fill.style.background = colors.ok;
    // Flash on critical
    fill.classList.toggle('survival-critical', value <= 10);
  },

  // ── Eat food ─────────────────────────────
  eat(amount = 35) {
    if (!State.hasResource('food', 1)) {
      Utils.toast('🥫 No food in store!', 'bad');
      return false;
    }
    State.consumeResource('food', 1);
    const before = State.data.player.hunger;
    State.data.player.hunger = Utils.clamp(before + amount, 0, 100);
    Utils.toast(`🍖 Ate food. Hunger +${amount}`, 'good');
    this._updateBarColours();
    HUD.update();
    return true;
  },

  // ── Drink water ───────────────────────────
  drink(amount = 40) {
    if (!State.hasResource('water', 1)) {
      Utils.toast('💧 No water!', 'bad');
      return false;
    }
    State.consumeResource('water', 1);
    State.data.player.thirst = Utils.clamp(State.data.player.thirst + amount, 0, 100);
    Utils.toast(`💧 Drank water. Thirst +${amount}`, 'good');
    this._updateBarColours();
    HUD.update();
    return true;
  },

  // ── Sleep ────────────────────────────────
  sleep(hours = 8) {
    Audio.sfxSleep();
    const energyGain = hours === 8 ? 80 : 25;
    State.data.player.energy = Utils.clamp(State.data.player.energy + energyGain, 0, 100);

    // Slower drain while sleeping
    State.data.player.hunger = Utils.clamp(State.data.player.hunger - hours * 1.5, 0, 100);
    State.data.player.thirst = Utils.clamp(State.data.player.thirst - hours * 2, 0, 100);

    // Skip time to morning
    DayNight.skipToMorning();

    Utils.toast(
      `😴 Slept ${hours}h. Energy restored. Day ${State.data.world.day}.`,
      'info', 4000
    );

    // Night raid chance while sleeping
    if (hours >= 4 && Math.random() < 0.3) {
      setTimeout(() => Raids.triggerRaid('night'), 2000);
    }

    this._updateBarColours();
    HUD.update();
  },

  // ── Draw water from well ──────────────────
  drawWater() {
    const amount = State.data.base.waterPerDraw || 5;
    State.addResource('water', amount);
    Audio.sfxWater();
    Utils.toast(`🪣 Drew ${amount} water units`, 'good');
    HUD.update();
  },

  // ── Public checkCritical ──────────────────
  checkCritical() { this._criticalCheck(); },

  // ── Render fridge screen ──────────────────
  renderFridge() {
    const container = document.getElementById('fridge-content');
    if (!container) return;
    const inv = State.data.inventory;
    const p   = State.data.player;

    container.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:1rem;color:var(--col-text-dim);
                  text-align:center;padding:8px 0">
        Hunger: ${Math.round(p.hunger)}% | Thirst: ${Math.round(p.thirst)}%
      </div>
      <div class="fridge-item">
        <span class="fridge-item-name">🥫 Food Cans</span>
        <span class="fridge-item-count">${inv.food} units</span>
        <button class="btn-pixel btn-primary"
                onclick="Player.eat();Player.renderFridge()"
                style="width:auto;padding:8px 14px"
                ${inv.food <= 0 ? 'disabled' : ''}>EAT</button>
      </div>
      <div class="fridge-item">
        <span class="fridge-item-name">💧 Water</span>
        <span class="fridge-item-count">${inv.water} units</span>
        <button class="btn-pixel btn-primary"
                onclick="Player.drink();Player.renderFridge()"
                style="width:auto;padding:8px 14px"
                ${inv.water <= 0 ? 'disabled' : ''}>DRINK</button>
      </div>
      <div class="fridge-item">
        <span class="fridge-item-name">💊 Medicine</span>
        <span class="fridge-item-count">${inv.medicine} units</span>
        <button class="btn-pixel btn-secondary"
                onclick="Player.useMedicine();Player.renderFridge()"
                style="width:auto;padding:8px 14px"
                ${inv.medicine <= 0 ? 'disabled' : ''}>USE</button>
      </div>
    `;
  },

  // ── Use medicine ──────────────────────────
  useMedicine() {
    if (!State.hasResource('medicine', 1)) {
      Utils.toast('💊 No medicine!', 'bad');
      return;
    }
    State.consumeResource('medicine', 1);
    State.data.player.hunger = Utils.clamp(State.data.player.hunger + 20, 0, 100);
    State.data.player.thirst = Utils.clamp(State.data.player.thirst + 20, 0, 100);
    State.data.player.energy = Utils.clamp(State.data.player.energy + 30, 0, 100);
    Utils.toast('💊 Medicine used. All stats +boost.', 'good');
    this._updateBarColours();
    HUD.update();
  }

};
