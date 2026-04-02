import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Queue from './components/Queue';
import Composer from './components/Composer';
import Calendar from './components/Calendar';
import Templates from './components/Templates';
import Accounts from './components/Accounts';

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>SkyQueue</h1>
        <nav>
          <NavLink to="/" end>
            Queue
          </NavLink>
          <NavLink to="/compose">Compose</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/accounts">Accounts</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Queue />} />
          <Route path="/compose" element={<Composer />} />
          <Route path="/compose/:id" element={<Composer />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/accounts" element={<Accounts />} />
        </Routes>
      </main>
    </div>
  );
}
