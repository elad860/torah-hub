import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export function YouTubeEmbed({ url, title = "שיעור וידאו", className }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">לא ניתן לטעון את הסרטון</p>
      </div>
    );
  }

  return (
    <div className={`aspect-video rounded-xl overflow-hidden shadow-elevated ${className}`}>
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
