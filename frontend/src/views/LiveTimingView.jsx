import { useEffect, useState } from 'react';
import LiveTimingSidebar from '../components/LiveTimingSidebar.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import DriverAvatar from '../components/DriverAvatar.jsx';
import CircuitArt from '../components/CircuitArt.jsx';
import TyrePanel from '../components/TyrePanel.jsx';
import { TEAM_COLORS } from '../data/teamColors.js';
import { getTyreStints, SAMPLE_STINTS } from '../api/tires.js';

// Dati di esempio: nel progetto reale queste righe arrivano da OpenF1
// (vedi src/api/openf1.js -> getIntervals). Tenerli qui come costanti
// rende il componente utilizzabile subito, senza dover aspettare che
// una sessione live sia effettivamente in corso.
const TIMING = [
  { pos: 1, code: 'NOR', team: 'McLaren', gap: 'LEADER', fixed: true },
  { pos: 2, code: 'VER', team: 'Red Bull', gap: '+3.821' },
  { pos: 3, code: 'LEC', team: 'Ferrari', gap: '+8.104' },
  { pos: 4, code: 'PIA', team: 'McLaren', gap: '+11.902' },
  { pos: 5, code: 'HAM', team: 'Ferrari', gap: '+14.330' },
  { pos: 6, code: 'RUS', team: 'Mercedes', gap: '+19.775' },
  { pos: 7, code: 'ALO', team: 'Aston Martin', gap: '+24.118' },
  { pos: 8, code: 'GAS', team: 'Alpine', gap: '+29.402' },
  { pos: 9, code: 'ALB', team: 'Williams', gap: '+33.660' },
  { pos: 10, code: 'HUL', team: 'Sauber', gap: '+38.290' },
];

const STANDINGS = [
  { pos: 1, name: 'L. Norris', team: 'McLaren', pts: 331 },
  { pos: 2, name: 'M. Verstappen', team: 'Red Bull', pts: 309 },
  { pos: 3, name: 'C. Leclerc', team: 'Ferrari', pts: 267 },
  { pos: 4, name: 'O. Piastri', team: 'McLaren', pts: 254 },
  { pos: 5, name: 'L. Hamilton', team: 'Ferrari', pts: 201 },
];

export default function LiveTimingView() {
  // Esempio di collegamento reale all'API delle gomme: si prova a
  // chiamare OpenF1, e se fallisce (rete assente, endpoint cambiato,
  // CORS...) si resta sui dati di esempio invece di rompere la pagina.
  // Questo pattern (try live data, fallback a sample) è quello da
  // riusare per ogni nuovo pannello collegato a un'API esterna.
  const [stints, setStints] = useState(SAMPLE_STINTS);

  useEffect(() => {
    let annullato = false;
    getTyreStints({ driverNumber: 4 })
      .then((dati) => {
        if (!annullato && dati.length > 0) setStints(dati);
      })
      .catch((errore) => {
        console.warn('Dati gomme live non disponibili, uso i dati di esempio:', errore.message);
      });
    return () => {
      annullato = true;
    };
  }, []);

  return (
    <div className="page">
      <LiveTimingSidebar status="live" rows={TIMING} />

      <main className="main">
        <div className="topbar">
          <div className="topbar__title">
            <CircuitArt size={34} />
            <h1 style={{ fontSize: '1.4rem' }}>Gran Premio d'Italia — Monza</h1>
          </div>
          <div className="topbar__meta">
            Giro <strong className="tab-num">41</strong>/53 · Gara <StatusBadge status="live" />
          </div>
        </div>

        <section className="hero">
          <GlassPanel className="spotlight">
            <CircuitArt watermark />
            <div className="spotlight__top">
              <div>
                <div className="spotlight__name">L. Norris</div>
                <div className="spotlight__team">McLaren</div>
              </div>
              <DriverAvatar team="McLaren" size={56} />
            </div>
            <div className="spotlight__stat-row">
              <div className="stat">
                <span className="stat__label">Posizione</span>
                <span className="stat__value tab-num">P1</span>
              </div>
              <div className="stat">
                <span className="stat__label">Distacco P2</span>
                <span className="stat__value stat__value--accent tab-num">+3.821</span>
              </div>
              <div className="stat">
                <span className="stat__label">Giro veloce</span>
                <span className="stat__value tab-num" style={{ fontSize: '1.05rem' }}>
                  1:22.845
                </span>
              </div>
            </div>
          </GlassPanel>

          <TyrePanel driverCode="NOR" stints={stints} />
        </section>

        <h2 className="section-title">Classifica campionato piloti</h2>
        <GlassPanel>
          <div className="standings">
            {STANDINGS.map((s) => (
              <div className="standing-row" key={s.pos}>
                <span className="standing-row__pos tab-num">{s.pos}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <TeamBadge team={s.team} />
                  <span>
                    <div className="standing-row__name">{s.name}</div>
                    <div className="standing-row__team">{s.team}</div>
                  </span>
                </span>
                <span className="standing-row__pts tab-num">{s.pts}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        <h2 className="section-title">Dallo studio</h2>
        <div className="grid-cards">
          <GlassPanel className="card">
            <h4>Undercut decisivo alla curva Ascari</h4>
            <p>Il muretto McLaren anticipa la sosta di due giri: guadagno stimato in aria pulita di quattro decimi a passaggio.</p>
          </GlassPanel>
          <GlassPanel className="card">
            <h4>Gomme hard: quanto durano davvero</h4>
            <p>Il degrado nella seconda metà di gara resta il fattore chiave per chi parte dalla zona punti.</p>
          </GlassPanel>
          <GlassPanel className="card">
            <h4>Meteo: rischio pioggia in avvicinamento</h4>
            <p>Le celle instabili previste nell'ultima ora di gara terranno i muretti con l'intermedia pronta al muro box.</p>
          </GlassPanel>
        </div>

        <div className="legend">
          {Object.entries(TEAM_COLORS).map(([team, color]) => (
            <span className="legend__item" key={team}>
              <span className="legend__swatch" style={{ background: color }} />
              {team}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
