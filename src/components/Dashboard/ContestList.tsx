'use client';

import { motion } from 'framer-motion';
import { Contest } from '@/lib/types';
import { Calendar, ExternalLink, Clock } from 'lucide-react';

interface ContestListProps {
  contests: Contest[];
}

export const ContestList = ({ contests }: ContestListProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-100 font-semibold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Upcoming Contests
        </h3>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">{contests.length} Events</span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {contests.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 text-sm">
            No upcoming contests found.
          </div>
        ) : (
          contests.map((contest, idx) => (
            <a
              key={idx}
              href={contest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                      contest.platform === 'LeetCode' ? 'bg-amber-500/10 text-amber-500' : 
                      contest.platform === 'CodeChef' ? 'bg-orange-500/10 text-orange-500' : 
                      contest.platform === 'MentorPick' ? 'bg-indigo-500/10 text-indigo-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {contest.platform}
                    </span>
                    <h4 className="text-sm font-medium text-zinc-200 mt-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {contest.title}
                    </h4>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 flex-shrink-0" />
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(contest.startTime).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(contest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>({contest.duration})</span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </motion.div>
  );
};
