import React, { useEffect, useState } from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { searchYouTubeVideo } from '../../utils/api';

export default function VideoBlock({ query, url }) {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (url) {
      setVideoData({ embedUrl: url });
      return;
    }

    if (query) {
      setLoading(true);
      searchYouTubeVideo(query)
        .then((data) => setVideoData(data))
        .catch(() => setVideoData(null))
        .finally(() => setLoading(false));
    }
  }, [query, url]);

  return (
    <div className="my-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 md:p-7 shadow-sm">

      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
            ▶
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest">
                VIDEO COMPANION
              </span>
            </div>
            <h4 className="font-display font-bold text-sm md:text-base text-[var(--ink)] tracking-tight">
              {query || 'Lesson Video Companion'}
            </h4>
          </div>
        </div>

        {videoData?.videoId && (
          <a
            href={`https://www.youtube.com/watch?v=${videoData.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card-hover)] hover:bg-[var(--ink)] text-[var(--ink)] hover:text-[var(--bg-canvas)] border border-[var(--border)] font-mono text-xs font-semibold transition-all"
          >
            <span>YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="relative w-full aspect-video rounded-xl border border-[var(--border)] bg-black overflow-hidden shadow-inner">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs gap-3">
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono uppercase tracking-wider text-[11px]">Locating relevant companion tutorial...</span>
          </div>
        ) : videoData?.embedUrl ? (
          <iframe
            src={videoData.embedUrl}
            title={query || 'Video Tutorial'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs gap-3 p-6 text-center">
            <Video className="w-8 h-8 text-emerald-400 mb-1" />
            <span className="font-mono uppercase tracking-wider text-zinc-300 text-xs">
              Search YouTube for "{query || 'Lesson Tutorial'}"
            </span>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                query || 'tutorial'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Search on YouTube
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

