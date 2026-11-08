'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Heart,
  Share2,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Flame,
  Coffee,
  Pizza,
  GlassWater,
  Sparkles,
  Check,
} from 'lucide-react';

export interface ReelItem {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  avatarBg: string;
  icon: string;
  description: string;
  dishName: string;
  dishPrice: number;
  category: string;
  isFood: boolean;
  initialLikes: number;
  videoSrc: string;
  fallbackVideoSrc?: string;
  posterSrc: string;
  tags: string[];
}

const REELS_DATA: ReelItem[] = [
  {
    id: 'reel-coffee-ceremony',
    title: 'Traditional Jebena Coffee Roasting',
    author: 'Almaz',
    authorRole: 'Coffee Ceremony Master',
    avatarBg: 'bg-amber-600',
    icon: '☕',
    description:
      'Raw highland Yirgacheffe green beans pan-roasted to deep chocolate brown over live coals, infused with frankincense smoke and poured into classic sini cups.',
    dishName: 'Jebena Buna Ceremony',
    dishPrice: 50,
    category: 'Beverages',
    isFood: false,
    initialLikes: 1248,
    videoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/95/Traditional_Ethiopian_Coffee_Roasting_Ceremony.webm/Traditional_Ethiopian_Coffee_Roasting_Ceremony.webm.480p.vp9.webm',
    fallbackVideoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/95/Traditional_Ethiopian_Coffee_Roasting_Ceremony.webm/Traditional_Ethiopian_Coffee_Roasting_Ceremony.webm.360p.mpeg4.mov',
    posterSrc:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
    tags: ['#OrganicCoffee', '#JebenaBuna', '#HabeshaCulture', '#FreshRoast'],
  },
  {
    id: 'reel-sizzling-tibs',
    title: 'Flame-Kissed Charcoal Tibs & Skewers',
    author: 'Chef Dawit',
    authorRole: 'Head Grillmaster',
    avatarBg: 'bg-red-600',
    icon: '🥩',
    description:
      'Sizzling prime beef caramelized over iron grates with fresh garden rosemary, jalapeños, and spiced niter kibbeh butter served piping hot.',
    dishName: 'Special Shekla Tibs',
    dishPrice: 450,
    category: 'Main Grill',
    isFood: true,
    initialLikes: 2890,
    videoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/63/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm.480p.vp9.webm',
    fallbackVideoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/63/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm.360p.mpeg4.mov',
    posterSrc:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    tags: ['#SheklaTibs', '#SizzlingHot', '#NiterKibbeh', '#IronGrill'],
  },
  {
    id: 'reel-artisan-pizza',
    title: 'Artisan Stone-Oven Margherita',
    author: 'Chef Michael',
    authorRole: 'Stone-Oven Pizzaiolo',
    avatarBg: 'bg-orange-600',
    icon: '🍕',
    description:
      '72-hour fermented sourdough crust stretched thin by hand, topped with San Marzano tomatoes, whole milk mozzarella, and fresh garden basil.',
    dishName: 'Margherita Pizza',
    dishPrice: 400,
    category: 'Pizza & Oven',
    isFood: true,
    initialLikes: 1845,
    videoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Pizza_sequence.webm/Pizza_sequence.webm.480p.vp9.webm',
    fallbackVideoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Pizza_sequence.webm/Pizza_sequence.webm.360p.mpeg4.mov',
    posterSrc:
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&q=80',
    tags: ['#WoodFired', '#CrispyCrust', '#FreshMozzarella', '#StoneOven'],
  },
  {
    id: 'reel-craft-cocktail',
    title: 'Bar Specialty & Shaken Spritz',
    author: 'Helen',
    authorRole: 'Senior Mixologist',
    avatarBg: 'bg-purple-600',
    icon: '🍸',
    description:
      'Fresh tropical passionfruit puree, hand-muddled mint, pomegranate reduction and sparkling citrus club soda double-shaken over hand-cut ice.',
    dishName: 'Tropical Passion Spritzer',
    dishPrice: 180,
    category: 'Bar & Mocktails',
    isFood: false,
    initialLikes: 1420,
    videoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9b/The_Best_Way_To_Shake_A_Cocktail_-_Drinks_Made_Easy.webm/The_Best_Way_To_Shake_A_Cocktail_-_Drinks_Made_Easy.webm.480p.vp9.webm',
    fallbackVideoSrc:
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9b/The_Best_Way_To_Shake_A_Cocktail_-_Drinks_Made_Easy.webm/The_Best_Way_To_Shake_A_Cocktail_-_Drinks_Made_Easy.webm.360p.mpeg4.mov',
    posterSrc:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
    tags: ['#CraftCocktails', '#AddisNights', '#FreshSpritz', '#ShakenNotStirred'],
  },
];

interface ReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderDish: (dishName: string) => void;
}

export default function ReelsModal({ isOpen, onClose, onOrderDish }: ReelsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    REELS_DATA.reduce((acc, r) => ({ ...acc, [r.id]: r.initialLikes }), {})
  );
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentReel = REELS_DATA[currentIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 45) {
      // Swiped UP -> Next reel
      goToNextReel();
    } else if (diff < -45) {
      // Swiped DOWN -> Previous reel
      goToPrevReel();
    }
    touchStartY.current = null;
  };

  // Wheel scroll debounce for desktop trackpad/mouse
  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 500) return;
    if (e.deltaY > 30) {
      lastWheelTime.current = now;
      goToNextReel();
    } else if (e.deltaY < -30) {
      lastWheelTime.current = now;
      goToPrevReel();
    }
  };

  // Auto-play when reel changes
  useEffect(() => {
    if (!isOpen) return;
    setIsPlaying(true);
    setVideoProgress(0);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy might pause unmuted audio
        setIsPlaying(false);
      });
    }
  }, [currentIndex, isOpen]);

  // Track time update for story progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(prog);
    }
  };

  const handleVideoEnded = () => {
    // Automatically transition to next reel
    if (currentIndex < REELS_DATA.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop back to first reel
      setCurrentIndex(0);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const id = currentReel.id;
    const wasLiked = !!likedReels[id];

    setLikedReels((prev) => ({ ...prev, [id]: !wasLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || currentReel.initialLikes) + (wasLiked ? -1 : 1),
    }));

    if (!wasLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!likedReels[currentReel.id]) {
      handleLike();
    } else {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${currentReel.title} • SmartMenu Kitchen Reels`,
        text: `Watch how our kitchen crafts ${currentReel.dishName}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const goToPrevReel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(REELS_DATA.length - 1);
    }
  };

  const goToNextReel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex < REELS_DATA.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Keyboard navigation (ArrowUp, ArrowDown, Space, Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') goToPrevReel();
      if (e.key === 'ArrowDown') goToNextReel();
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, isPlaying]);

  if (!isOpen) return null;

  const isCurrentLiked = !!likedReels[currentReel.id];
  const currentLikeCount = likeCounts[currentReel.id] || currentReel.initialLikes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 sm:backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200">
      {/* Container simulating vertical mobile reel */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative w-full h-full sm:h-[92vh] sm:max-h-[820px] sm:max-w-[430px] sm:rounded-3xl bg-black overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800 touch-pan-y"
      >
        {/* --- TOP HEADER OVERLAY --- */}
        <div className="absolute top-4 left-0 right-0 z-30 px-4 flex items-center justify-between text-white drop-shadow-md">
          {/* Creator Profile */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full ${currentReel.avatarBg} flex items-center justify-center text-sm font-bold border-2 border-white/80 shadow`}
            >
              <span>{currentReel.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight">{currentReel.author}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/80 text-[10px] font-semibold text-white">
                  Chef
                </span>
              </div>
              <p className="text-[10px] text-white/70">{currentReel.authorRole}</p>
            </div>
          </div>

          {/* Action buttons (Mute & Close) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition active:scale-95 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition active:scale-95 cursor-pointer"
              title="Close Reels"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- 3. VIDEO PLAYER (CLICK TO PAUSE, DOUBLE-TAP TO HEART) --- */}
        <div
          onClick={togglePlayPause}
          onDoubleClick={handleDoubleTap}
          className="relative flex-1 w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden"
        >
          <video
            ref={videoRef}
            key={currentReel.videoSrc}
            src={currentReel.videoSrc}
            poster={currentReel.posterSrc}
            playsInline
            muted={isMuted}
            autoPlay
            loop={false}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          >
            {currentReel.fallbackVideoSrc && (
              <source src={currentReel.fallbackVideoSrc} type="video/mp4" />
            )}
          </video>

          {/* Big Play/Pause icon badge on pause */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Double-tap floating heart burst animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-ping duration-700" />
            </div>
          )}

          {/* Copied toast */}
          {copiedToast && (
            <div className="absolute top-20 z-40 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>Link copied to clipboard!</span>
            </div>
          )}

          {/* Gradient Scrims for text readability */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />
        </div>

        {/* --- 4. RIGHT SIDE INTERACTION RAIL (HEART, SHARE, PREV/NEXT) --- */}
        <div className="absolute right-3 bottom-32 z-30 flex flex-col items-center gap-4 text-white">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className="group flex flex-col items-center gap-1 transition active:scale-90 cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                isCurrentLiked
                  ? 'bg-rose-500/30 text-rose-500 border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : 'bg-black/40 text-white border border-white/15 hover:bg-black/60'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isCurrentLiked ? 'fill-rose-500 stroke-rose-500 scale-110' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-bold tracking-tight drop-shadow">
              {currentLikeCount.toLocaleString()}
            </span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 transition active:scale-90 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 backdrop-blur-md flex items-center justify-center text-white shadow transition">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold tracking-tight drop-shadow">Share</span>
          </button>

          {/* Next Reel Indicator */}
          <div className="pt-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={goToPrevReel}
              className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition active:scale-90 cursor-pointer"
              title="Previous Reel"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToNextReel}
              className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition active:scale-90 cursor-pointer"
              title="Next Reel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- 5. BOTTOM OVERLAY: CAPTION & DIRECT DISH ORDER CTA --- */}
        <div className="absolute left-0 right-16 bottom-0 z-30 p-4 space-y-3 pointer-events-auto">
          {/* Title & Tagline */}
          <div className="space-y-1 drop-shadow-md text-white">
            <h2 className="text-sm font-bold tracking-tight leading-snug flex items-center gap-1.5">
              <span>{currentReel.title}</span>
            </h2>
            <p className="text-xs text-white/85 line-clamp-2 leading-relaxed">
              {currentReel.description}
            </p>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {currentReel.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-purple-200/90 bg-purple-950/40 px-1.5 py-0.5 rounded-md border border-purple-400/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Featured Dish Card with 1-Click Order / View in Menu */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/15 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm shrink-0">
                <span>{currentReel.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentReel.dishName}</p>
                <p className="text-[11px] font-black text-amber-400">
                  {currentReel.dishPrice} <span className="text-[9px] font-semibold text-white/60">ETB</span>
                </p>
              </div>
            </div>

            {currentReel.isFood ? (
              <button
                type="button"
                onClick={() => onOrderDish(currentReel.dishName)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order Now &rarr;</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white/70 text-[11px] font-bold border border-white/10 shrink-0">
                Craft Drink
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

