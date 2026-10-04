import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Game from './pages/Game.jsx';
import Rules from './pages/Rules.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game/:code" element={<Game />} />
      <Route path="/luat-choi" element={<Rules />} />
    </Routes>
  );
}
