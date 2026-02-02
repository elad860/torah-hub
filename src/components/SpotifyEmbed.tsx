interface SpotifyEmbedProps {
  spotifyUrl: string;
  title: string;
}

export function SpotifyEmbed({ spotifyUrl, title }: SpotifyEmbedProps) {
  // Extract the Spotify ID from the URL
  // Spotify URLs can be: https://open.spotify.com/episode/ID or https://open.spotify.com/show/ID
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const type = pathParts[1]; // 'episode', 'show', 'playlist'
      const id = pathParts[2];
      
      if (type && id) {
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      }
    } catch (e) {
      console.error("Invalid Spotify URL:", url);
    }
    return null;
  };

  const embedUrl = getEmbedUrl(spotifyUrl);

  if (!embedUrl) {
    return (
      <div className="bg-white/10 rounded-xl p-6 text-center border border-gold/20">
        <p className="text-white/70">נגן ספוטיפיי - בקרוב</p>
        <p className="text-white/50 text-sm mt-2">{title}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={title}
        className="rounded-xl"
      />
    </div>
  );
}
