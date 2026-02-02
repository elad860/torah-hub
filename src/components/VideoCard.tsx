import { Link } from "react-router-dom";
import { Play, Calendar } from "lucide-react";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  id: string;
  title: string;
  youtubeUrl: string;
  category: string;
  description?: string;
  createdAt: string;
  className?: string;
}

export function VideoCard({
  id,
  title,
  youtubeUrl,
  category,
  description,
  createdAt,
  className,
}: VideoCardProps) {
  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnail = videoId ? getYouTubeThumbnail(videoId, "high") : "/placeholder.svg";

  const formattedDate = new Date(createdAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      to={`/lesson/${id}`}
      className={cn(
        "group block bg-card rounded-xl overflow-hidden shadow-card hover-lift",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center shadow-gold">
            <Play className="w-8 h-8 text-primary fill-current mr-[-2px]" />
          </div>
        </div>
        {/* Category Badge */}
        <span className="absolute top-3 right-3 bg-gold/90 text-primary text-xs font-medium px-3 py-1 rounded-full">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-gold transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}
