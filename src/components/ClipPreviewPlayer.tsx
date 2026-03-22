import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import type { GenerationOutput } from '../types';

interface Props {
  output: GenerationOutput;
  onDownload?: () => void;
  onCreateVariation?: () => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClipPreviewPlayer({ output, onDownload, onCreateVariation, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const handleEnded = () => setPlaying(false);

  const enterFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const isPlaceholder = !output.file_url.startsWith('http');

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border/50 bg-black', className)}>
      {/* Video */}
      <div className="relative aspect-video bg-black group">
        {isPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-black">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                <Play className="w-5 h-5 text-primary ml-0.5" />
              </div>
              <p className="text-xs text-muted-foreground">Preview rendering...</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={output.file_url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            playsInline
          />
        )}

        {/* Play overlay */}
        {!isPlaceholder && !playing && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        {!isPlaceholder && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Seek bar */}
            <div
              className="h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-xs text-white/60 tabular-nums">
                {formatTime(currentTime)} / {formatTime(output.duration_seconds)}
              </span>
              <div className="flex-1" />
              <button onClick={enterFullscreen} className="text-white hover:text-primary transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata & Actions */}
      <div className="p-4 bg-card/30">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-0.5">Output</p>
            <p className="text-sm font-mono text-foreground">{output.resolution} · {output.format.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(output.duration_seconds)} · {formatFileSize(output.file_size_bytes)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onCreateVariation && (
              <Button size="sm" variant="ghost" onClick={onCreateVariation} className="text-xs">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Variation
              </Button>
            )}
            {onDownload && (
              <Button size="sm" variant="outline" onClick={onDownload} className="text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
