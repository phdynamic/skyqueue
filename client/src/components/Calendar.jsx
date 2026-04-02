import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }

  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  return cells;
}

export default function Calendar() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    getPosts({ from, to }).then(setPosts).catch(console.error);
  }, [year, month]);

  const cells = getMonthDays(year, month);
  const today = now.getDate();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const postsByDay = {};
  posts.forEach((p) => {
    if (!p.scheduledAt) return;
    const d = new Date(p.scheduledAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(p);
    }
  });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  const monthName = new Date(year, month).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const dayPosts = selectedDay ? postsByDay[selectedDay] || [] : [];

  return (
    <div>
      <div className="page-header">
        <h2>Calendar</h2>
      </div>

      <div className="calendar-nav">
        <button className="btn-secondary" onClick={prevMonth}>
          ← Prev
        </button>
        <h3>{monthName}</h3>
        <button className="btn-secondary" onClick={nextMonth}>
          Next →
        </button>
      </div>

      <div className="calendar-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="day-header">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`day-cell ${!cell.current ? 'other-month' : ''} ${
              cell.current && cell.day === today && isCurrentMonth ? 'today' : ''
            }`}
            onClick={() => cell.current && setSelectedDay(cell.day)}
          >
            <div className="day-number">{cell.day}</div>
            {cell.current && postsByDay[cell.day] && (
              <span className="badge badge-thread">
                {postsByDay[cell.day].length} post
                {postsByDay[cell.day].length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12 }}>
            Posts for {monthName.split(' ')[0]} {selectedDay}
          </h3>
          {dayPosts.length === 0 ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                No posts scheduled.
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                  navigate(`/compose?date=${date}`);
                }}
              >
                + Compose for this day
              </button>
            </div>
          ) : (
            dayPosts.map((p) => (
              <div
                key={p.id}
                className="card post-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/compose/${p.id}`)}
              >
                <div className="post-info">
                  <div className="post-meta">
                    <span>@{p.account?.handle}</span>
                    <span>
                      {new Date(p.scheduledAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="post-preview">
                    {p.threads[0]?.text?.slice(0, 100) || '(empty)'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
