// ═══════════════════════════════════════════
// PEDAL OR DIE — save.js
// Save / Load system
// Phase 1: Local browser storage + export/import
// Phase 2 (future): Google Drive sync
// ═══════════════════════════════════════════

const SaveSystem = {

  SAVE_KEY: 'pedalOrDie_save_v1',

  // ── Save locally ─────────────────────────
  saveLocal() {
    try {
      const data = JSON.stringify(State.serialise());
      localStorage.setItem(this.SAVE_KEY, data);
      Utils.toast('💾 Game saved!', 'good');
      console.log('[Save] Saved locally');
      return true;
    } catch (e) {
      Utils.toast('❌ Save failed!', 'bad');
      console.error('[Save] Local save error:', e);
      return false;
    }
  },

  // ── Load local save ───────────────────────
  SAVE_VERSION: '0.5',

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      State.load(data);
      console.log('[Save] Loaded local save from', data.meta?.savedAt);
      return true;
    } catch (e) {
      console.error('[Save] Load error:', e);
      return false;
    }
  },

  // ── Check if save exists ──────────────────
  hasSave() {
    return !!localStorage.getItem(this.SAVE_KEY);
  },

  // ── Export save as .json file ─────────────
  exportSave() {
    try {
      const data = JSON.stringify(State.serialise(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const day  = State.data.world.day;
      a.href     = url;
      a.download = `pedal_or_die_day${day}_save.json`;
      a.click();
      URL.revokeObjectURL(url);
      Utils.toast('⬇ Save exported!', 'good');
      console.log('[Save] Exported save file');
    } catch (e) {
      Utils.toast('❌ Export failed!', 'bad');
      console.error('[Save] Export error:', e);
    }
  },

  // ── Import save from .json file ───────────
  importSave(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject('No file');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Basic validation
          if (!data.player || !data.world || !data.inventory) {
            throw new Error('Invalid save file structure');
          }
          State.load(data);
          this.saveLocal(); // also persist locally after import
          Utils.toast('⬆ Save imported! Day ' + data.world.day, 'good');
          console.log('[Save] Imported save file');
          resolve(data);
        } catch (err) {
          Utils.toast('❌ Invalid save file!', 'bad');
          console.error('[Save] Import parse error:', err);
          reject(err);
        }
      };
      reader.onerror = () => reject('File read error');
      reader.readAsText(file);
    });
  },

  // ── Auto-save (call every few minutes) ────
  startAutoSave(intervalMinutes = 5) {
    setInterval(() => {
      this.saveLocal();
    }, intervalMinutes * 60 * 1000);
    console.log(`[Save] Auto-save every ${intervalMinutes} min`);
  },

  // ── Wire up UI buttons ────────────────────
  initUI() {
    // Float save button
    const btnOpen = document.getElementById('btn-open-save');
    const panel   = document.getElementById('save-panel');

    btnOpen?.addEventListener('click', () => Utils.toggle('save-panel'));

    document.getElementById('btn-save-local')
      ?.addEventListener('click', () => this.saveLocal());

    document.getElementById('btn-export-save')
      ?.addEventListener('click', () => this.exportSave());

    document.getElementById('btn-close-save')
      ?.addEventListener('click', () => Utils.hide('save-panel'));

    // Import (in-game)
    document.getElementById('btn-import-save-ingame')
      ?.addEventListener('click', () => {
        document.getElementById('file-import').click();
      });

    // Import (menu)
    document.getElementById('btn-import-save')
      ?.addEventListener('click', () => {
        document.getElementById('file-import').click();
      });

    // File input handler
    document.getElementById('file-import')
      ?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await this.importSave(file);
          // Refresh game if already running
          if (State.data.world.currentScreen !== 'menu') {
            Game.refreshAll();
          }
        } catch {}
        e.target.value = ''; // reset so same file can be re-imported
      });
  }

};
