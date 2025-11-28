
import React, { useState, useEffect } from 'react';
import { generatePoliticalReport } from './services/geminiService';
import { Report, SearchState } from './types';
import { ReportView } from './components/ReportView';
import { Icons } from './components/Icons';
import { ChatBot } from './components/ChatBot';

const SUGGESTIONS = [
  "Uttar Pradesh Vidhan Sabha 2027 projections",
  "One Nation One Election feasibility analysis",
  "Delimitation impact on South Indian states 2026",
  "Maharashtra politics current power dynamics",
  "Caste census impact on Lok Sabha 2029"
];

function App() {
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    stage: 'idle',
    query: ''
  });
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<Report[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('politisight_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newReport: Report) => {
    const updatedHistory = [newReport, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('politisight_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(r => r.id !== id);
    setHistory(updated);
    localStorage.setItem('politisight_history', JSON.stringify(updated));
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchState({ isSearching: true, stage: 'researching', query });
    setReport(null);

    try {
      // Pass recent history titles for better context
      const historyContext = history.slice(0, 3).map(h => h.title);
      
      const result = await generatePoliticalReport(query, historyContext, (stage) => {
        setSearchState(prev => ({ ...prev, stage }));
      });
      
      setReport(result);
      saveToHistory(result);
      setSearchState(prev => ({ ...prev, stage: 'complete' }));
    } catch (error) {
      console.error(error);
      setSearchState(prev => ({ 
        ...prev, 
        stage: 'idle', 
        isSearching: false, 
        error: "Failed to generate report. Please try again." 
      }));
    }
  };

  const resetApp = () => {
    setReport(null);
    setSearchState({ isSearching: false, stage: 'idle', query: '' });
  };

  // ----------------------------------------------------
  // Render: Loading Screen
  // ----------------------------------------------------
  if (searchState.isSearching && !report) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="z-10 text-center max-w-lg w-full">
          <div className="mb-12 relative">
             <div className="w-24 h-24 mx-auto rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <Icons.Activity className="text-violet-400 w-8 h-8" />
             </div>
          </div>
          
          <h2 className="text-3xl font-display font-bold text-white mb-4 animate-pulse">
            {searchState.stage === 'researching' && 'Gathering Data Sources...'}
            {searchState.stage === 'analyzing' && 'Analyzing Political Trends...'}
            {searchState.stage === 'formatting' && 'Generating Report...'}
          </h2>
          
          <p className="text-slate-400 text-lg mb-8">
            Investigating "{searchState.query}"
          </p>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-1000 ease-in-out"
              style={{ 
                width: searchState.stage === 'researching' ? '30%' : 
                       searchState.stage === 'analyzing' ? '65%' : '90%' 
              }}
            ></div>
          </div>
          
          <div className="mt-8 flex justify-between text-xs text-slate-500 font-mono uppercase tracking-widest">
            <span className={searchState.stage === 'researching' ? 'text-cyan-400' : 'text-slate-600'}>Research</span>
            <span className={searchState.stage === 'analyzing' ? 'text-cyan-400' : 'text-slate-600'}>Analysis</span>
            <span className={searchState.stage === 'formatting' ? 'text-cyan-400' : 'text-slate-600'}>Report</span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Report View
  // ----------------------------------------------------
  if (report) {
    return (
      <>
        <ReportView report={report} onReset={resetApp} />
        <ChatBot currentReport={report} history={history} />
      </>
    );
  }

  // ----------------------------------------------------
  // Render: Hero / Search Screen
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-dark-bg text-white selection:bg-violet-500/30 pb-20">
      
      {/* Header */}
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
             <Icons.Activity size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PolitiSight</span>
        </div>
        <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
          Powered by Gemini
        </a>
      </header>

      {/* Main Hero */}
      <main className="container mx-auto px-4 pt-32 flex flex-col items-center justify-center relative min-h-[80vh]">
        
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-4xl text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
            Indian Political Intelligence
          </span>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Decode the <br/> democracy.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light">
            Advanced AI-powered analysis for elections, voting patterns, and political dynamics using real-time data sources.
          </p>

          {/* Search Box */}
          <div className="relative group max-w-2xl mx-auto mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-dark-card border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
              <Icons.Search className="ml-4 text-slate-400" size={24} />
              <input
                type="text"
                placeholder="Ask about 2027 elections, constituencies, or trends..."
                className="w-full bg-transparent border-none focus:ring-0 text-lg px-4 py-3 text-white placeholder-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(e.currentTarget.value);
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleSearch(input.value);
                }}
                className="bg-white text-dark-bg p-3 rounded-xl hover:bg-slate-200 transition-transform active:scale-95"
              >
                <Icons.ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-16">
            <p className="text-slate-500 text-sm mb-4">Trending Analysis & Projections</p>
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(s)}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-sm text-slate-300 transition-all cursor-pointer backdrop-blur-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="w-full text-left animate-slide-up">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Icons.History className="text-violet-400" size={20} />
                <h2 className="text-xl font-display font-semibold text-white">Recent Analyses</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setReport(item)}
                    className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 hover:border-violet-500/30 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">
                        {item.date}
                      </span>
                      <button 
                        onClick={(e) => deleteFromHistory(e, item.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                        title="Delete from history"
                      >
                        <Icons.Trash size={16} />
                      </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                      {item.executiveSummary}
                    </p>

                    <div className="flex items-center text-violet-400 text-xs font-medium group-hover:translate-x-1 transition-transform">
                      View Report <Icons.ArrowRight size={12} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchState.error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2">
                <Icons.Alert size={16} />
                {searchState.error}
              </div>
            </div>
          )}
        </div>
      </main>
      <ChatBot currentReport={null} history={history} />
    </div>
  );
}

export default App;
