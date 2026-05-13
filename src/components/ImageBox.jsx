import { useEffect, useState } from 'react';

export default function ImageBox({ src, alt, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setLoaded(false);
    setFailed(!src);
  }, [src]);

  return (
    <div className={`image-box ${className} ${loaded ? 'is-loaded' : ''}`}>
      {!loaded && !failed && <div className="skeleton image-box__skeleton" />}
      {failed ? (
        <div className="image-box__fallback" aria-hidden="true" />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
