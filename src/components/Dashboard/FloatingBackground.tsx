'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const codeSnippets = [
  'const dp = new Array(n).fill(0);',
  'if (node === null) return;',
  'for (let i = 0; i < n; i++)',
  'stack.push(current);',
  'return mb.max;',
  '<div>',
  '{}',
  '[]',
  '/>',
  ';',
];

const symbols = ['{ }', '< >', '[ ]', '&&', '||', '=>', '+=', '!='];

export const FloatingBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      
      {/* Floating Symbols */}
      {symbols.map((symbol, i) => (
        <motion.div
          key={`sym-${i}`}
          className="absolute text-zinc-800/20 font-mono font-bold text-4xl select-none"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            opacity: 0 
          }}
          animate={{ 
            y: [0, -50, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut"
          }}
        >
          {symbol}
        </motion.div>
      ))}

      {/* Floating Code Snippets */}
      {codeSnippets.map((snippet, i) => (
        <motion.div
          key={`code-${i}`}
          className="absolute text-emerald-900/10 font-mono text-sm select-none whitespace-nowrap"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000) 
          }}
          animate={{ 
            x: [0, 20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            delay: i * 1, // stagger
            ease: "linear"
          }}
        >
          {snippet}
        </motion.div>
      ))}
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
    </div>
  );
};
