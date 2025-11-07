import React from 'react';
import { StudySessionResult } from '../types';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface StudyHistoryProps {
  history?: StudySessionResult[];
}

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

const DifferenceIndicator: React.FC<{ value: number, unit: 'score' | 'time' }> = ({ value, unit }) => {
    if (value === 0) {
        return <span className="text-gray-500 dark:text-gray-400">±0</span>;
    }

    const isImprovement = unit === 'score' ? value > 0 : value < 0;
    const colorClass = isImprovement ? 'text-green-500' : 'text-red-500';
    const Icon = isImprovement ? ArrowUpIcon : ArrowDownIcon;
    const sign = value > 0 ? '+' : '';

    return (
        <span className={`flex items-center text-xs font-medium ${colorClass}`}>
            <Icon className="w-3 h-3 mr-0.5" />
            {unit === 'time' ? `${sign}${formatDuration(value)}` : `${sign}${value}`}
        </span>
    );
};

const StudyHistory: React.FC<StudyHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="mt-10 p-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Study Sessions Yet</h3>
        <p>Complete a session in "Study Mode" to track your progress here.</p>
      </div>
    );
  }

  const sortedHistory = [...history].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const totalSessions = sortedHistory.length;
  const avgScorePercent = (sortedHistory.reduce((acc, h) => acc + (h.score / h.totalWords), 0) / totalSessions) * 100;
  const avgTime = sortedHistory.reduce((acc, h) => acc + h.durationSeconds, 0) / totalSessions;

  return (
    <div className="mt-10">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Study Session History
      </h2>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold">{totalSessions}</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
          <p className="text-2xl font-bold">{avgScorePercent.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Time</p>
          <p className="text-2xl font-bold">{formatDuration(avgTime)}</p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {sortedHistory.map((session, index) => {
          const prevSession = index > 0 ? sortedHistory[index - 1] : null;
          let scoreDiff = null;
          let timeDiff = null;

          if (prevSession) {
            scoreDiff = session.score - prevSession.score;
            timeDiff = session.durationSeconds - prevSession.durationSeconds;
          }

          return (
            <div key={session.completedAt} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-2">
                <p className="font-semibold">{new Date(session.completedAt).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{session.gameMode} ({session.studyUnit})</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                <p className="font-semibold">{session.score} / {session.totalWords}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                <p className="font-semibold">{formatDuration(session.durationSeconds)}</p>
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-around items-center">
                <div>
                  {scoreDiff !== null ? <DifferenceIndicator value={scoreDiff} unit="score" /> : <span className="text-xs">-</span>}
                </div>
                 <div>
                  {timeDiff !== null ? <DifferenceIndicator value={timeDiff} unit="time" /> : <span className="text-xs">-</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyHistory;
