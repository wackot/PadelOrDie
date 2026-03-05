// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/BuildPrompt.js
// Generic "BUILD" placeholder shown on the
// map when a building slot is not yet built.
// ═══════════════════════════════════════════

const BuildingBuildPrompt = {

  svg(cx, cy, type) {
    const configs = {
      greenhouse:    { w:52, h:44, label:'🌿 BUILD', sub:'GREENHOUSE' },
      field:         { w:60, h:40, label:'🌾 BUILD',  sub:'CROP FIELD' },
      powerhouse:    { w:58, h:60, label:'⚡ BUILD',  sub:'POWER HOUSE' },
      elecbench:     { w:54, h:50, label:'🔬 BUILD',  sub:'ELEC BENCH' },
      radio_tower:   { w:44, h:80, label:'📡 BUILD',  sub:'RADIO TOWER' },
      rain_collector:{ w:50, h:50, label:'🌧️ BUILD',  sub:'RAIN COLL.' },
      solar_station: { w:70, h:44, label:'☀️ BUILD',  sub:'SOLAR STN' },
      watchtower:    { w:36, h:90, label:'🗼 BUILD',  sub:'WATCHTOWER' },
      compost_bin:   { w:44, h:50, label:'♻️ BUILD',  sub:'COMPOST BIN' },
      smokehouse:    { w:56, h:60, label:'🏭 BUILD',  sub:'SMOKEHOUSE' },
      alarm_system:  { w:36, h:60, label:'🔔 BUILD',  sub:'ALARM SYS' },
      medkit_station:{ w:54, h:54, label:'🏥 BUILD',  sub:'MED STATION' },
      bunker:        { w:70, h:40, label:'🏗️ BUILD',  sub:'BUNKER' },
    };
    const cfg = configs[type] || { w:50, h:50, label:'🔨 BUILD', sub: type.replace(/_/g,' ').toUpperCase() };
    const { w, h, label, sub } = cfg;
    return '<g opacity="0.45">' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h +
        '" fill="transparent" stroke="#4a4a2a" stroke-width="2" stroke-dasharray="6,4" rx="3"/>' +
      '<text x="' + cx + '" y="' + cy + '" font-family="Press Start 2P" font-size="22" fill="#4a4a2a" text-anchor="middle">' + label + '</text>' +
      '<text x="' + cx + '" y="' + (cy+10) + '" font-family="Press Start 2P" font-size="5" fill="#3a3a1a" text-anchor="middle">' + sub + '</text>' +
    '</g>';
  },

};
