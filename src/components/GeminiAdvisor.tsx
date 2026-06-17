import { useState } from "react";
import { UserProfile, Stock } from "../types";
import { Cpu, Terminal, Sparkles, RefreshCw } from "lucide-react";

interface GeminiAdvisorProps {
  userProfile: UserProfile;
  stocks: { [symbol: string]: Stock };
}

export default function GeminiAdvisor({ userProfile, stocks }: GeminiAdvisorProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const requestAnalysis = async () => {
    setIsLoading(true);
    setErrorHeader(null);
    try {
      const response = await fetch("/api/gemini-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userProfile, stocks }),
      });
      if (!response.ok) {
        throw new Error(`Advisor engine returned status code ${response.status}`);
      }
      const data = await response.json();
      setAnalysis(data.analysis || "No analysis content returned.");
    } catch (err: any) {
      console.error(err);
      setErrorHeader("Strategic Oracle link lost. Toggle your GEMINI_API_KEY inside the Secret Panel to boot up direct AI analytics!");
    } finally {
      setIsLoading(false);
    }
  };

  // Safe light markdown parsing helper
  const renderFormattedMarkdown = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // 1. Headers (### or ##)
      if (line.startsWith("###") || line.startsWith("##") || line.startsWith("#")) {
        const titleStr = line.replace(/^[#\s]+/, "");
        return (
          <h4
            key={idx}
            className="text-xs font-mono font-bold text-red-400 tracking-widest uppercase border-l-2 border-[#e82127] pl-3 mt-4 mb-2 first:mt-1 pt-1"
          >
            {titleStr}
          </h4>
        );
      }

      // 2. Unordered lists (- or *)
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex gap-2.5 items-start py-0.5 pl-2 text-zinc-300 font-sans text-xs my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e82127] shrink-0 mt-1.5 animate-pulse" />
            <span dangerouslySetInnerHTML={{ __html: parseBoldText(itemText) }} />
          </div>
        );
      }

      // 3. Numbered lists
      const isNumList = /^\d+\.\s/.test(line.trim());
      if (isNumList) {
        const itemText = line.trim().replace(/^\d+\.\s/, "");
        const numPart = line.trim().match(/^\d+/)?.[0] || "";
        return (
          <div key={idx} className="flex gap-2.5 items-start py-1 pl-2 text-zinc-300 font-sans text-xs my-1 bg-black/35 rounded p-1.5 border-l border-white/5">
            <span className="font-mono text-xxs font-semibold text-red-400 bg-[#e82127]/10 rounded px-1.5">{numPart}</span>
            <span dangerouslySetInnerHTML={{ __html: parseBoldText(itemText) }} />
          </div>
        );
      }

      // 4. Blank lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Default paragraph
      return (
        <p
          key={idx}
          className="text-xs font-sans text-zinc-400 leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: parseBoldText(line) }}
        />
      );
    });
  };

  const parseBoldText = (text: string) => {
    // Matches **text** and surrounds with style tag safely
    return text
      .split("**")
      .map((part, index) => {
        return index % 2 === 1 
          ? `<strong class="text-red-350 font-bold font-mono">${part}</strong>` 
          : part;
      })
      .join("");
  };

  return (
    <div className="bg-[#141414] border border-white/5 p-5 rounded-xl shadow-2xl flex flex-col h-full" id="gemini-advisor-panel">
      <div className="flex items-center justify-between border-b border-white/5 p-1 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#e82127]/10 rounded-lg text-[#e82127]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-semibold text-zinc-200">Gemini Strategic Broker</h2>
            <p className="text-xxs font-mono text-gray-500">REAL-TIME PORTFOLIO OPTIMIZATION FEED</p>
          </div>
        </div>
        <button
          onClick={requestAnalysis}
          disabled={isLoading}
          className="p-1.5 px-3 bg-[#e82127] hover:bg-[#d11b21] disabled:bg-zinc-800 disabled:text-zinc-650 text-zinc-100 rounded text-xxs font-mono font-bold flex items-center gap-1 uppercase tracking-wider transition hover:shadow-lg cursor-pointer"
          id="query-advisor-btn"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-zinc-100" /> Consult AI Advisor
            </>
          )}
        </button>
      </div>

      <div className="flex-1 mt-4 flex flex-col justify-between">
        {analysis ? (
          <div className="bg-black/55 border border-white/5 p-4 rounded-lg select-scrollbar max-h-80 overflow-y-auto space-y-1">
            <div className="flex items-center gap-1.5 text-xxs font-mono text-gray-500 mb-2.5 pb-1 border-b border-white/5">
              <Terminal className="w-3.5 h-3.5 text-[#e82127]" /> ADVISOR REPORT INTEGRITY ACTIVE
            </div>
            {renderFormattedMarkdown(analysis)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-white/5 rounded-xl bg-black/30">
            <Sparkles className="w-10 h-10 text-[#e82127]/30 mb-2 animate-bounce" />
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">AI Portfolio Intelligence</h4>
            <p className="text-[11px] text-gray-500 font-sans max-w-ws mt-1 leading-relaxed">
              Click &quot;Consult AI Advisor&quot; to compile your positions, cash metrics, and live stock telemetry into professional-grade Wall Street intelligence.
            </p>
          </div>
        )}

        {errorHeader && (
          <div className="mt-4 p-3 bg-[#e82127]/10 border border-[#e82127]/20 rounded-lg text-red-400 text-xxs font-mono flex items-start gap-2 leading-relaxed">
            <span className="bg-[#e82127] text-white text-[10px] px-1.5 py-0.5 font-bold rounded mt-0.5 uppercase">OffLine</span>
            <span>{errorHeader}</span>
          </div>
        )}
      </div>
    </div>
  );
}
