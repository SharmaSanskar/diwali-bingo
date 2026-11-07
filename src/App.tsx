import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background } from './components/Background';
import { Game } from './components/Game';
import { Landing } from './components/Landing';
import { MissingConfig } from './components/MissingConfig';
import { NameGate } from './components/NameGate';
import { SetupScreen } from './components/SetupScreen';
import { parseLocation } from './lib/share';
import { getPlayerId, loadProfile, saveProfile, type Profile } from './lib/storage';
import { hasSupabaseConfig } from './lib/supabase';

function readLocation() {
  return { path: window.location.pathname, hash: window.location.hash };
}

export default function App() {
  const [loc, setLoc] = useState(readLocation);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [playerId] = useState(getPlayerId);
  const [soloChosen, setSoloChosen] = useState(false);
  const [nameConfirmed, setNameConfirmed] = useState(() => profile.name.trim().length > 0);

  useEffect(() => {
    const onChange = () => setLoc(readLocation());
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, '', to);
    setLoc(readLocation());
    window.scrollTo(0, 0);
  }, []);

  const updateProfile = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile({ ...p, name: p.name.trim() });
  }, []);

  const parsed = useMemo(() => parseLocation(loc.path, loc.hash), [loc]);
  const goHome = useCallback(() => navigate('/'), [navigate]);

  let screen: React.ReactNode;
  if (!parsed.roomCode) {
    screen = (
      <Landing
        profile={profile}
        onProfileChange={(p) => {
          updateProfile(p);
          setNameConfirmed(p.name.trim().length > 0);
        }}
        navigate={navigate}
      />
    );
  } else if (!parsed.config) {
    screen = <MissingConfig roomCode={parsed.roomCode} navigate={navigate} />;
  } else if (!hasSupabaseConfig && !soloChosen) {
    screen = <SetupScreen onSolo={() => setSoloChosen(true)} onBack={goHome} />;
  } else if (!nameConfirmed) {
    screen = (
      <NameGate
        title={parsed.config.title}
        profile={profile}
        onBack={goHome}
        onDone={(p) => {
          updateProfile(p);
          setNameConfirmed(true);
        }}
      />
    );
  } else {
    screen = (
      <Game
        key={`${parsed.roomCode}:${playerId}`}
        roomCode={parsed.roomCode}
        config={parsed.config}
        identity={{
          playerId,
          name: profile.name.trim() || 'Guest',
          avatarEmoji: profile.avatarEmoji,
          color: profile.color,
        }}
        solo={!hasSupabaseConfig}
        onLeave={goHome}
      />
    );
  }

  return (
    <>
      <Background />
      {screen}
    </>
  );
}
