import { photoSources } from '../data/media.js';

/** Responsive, lazy-loaded photograph with explicit dimensions to avoid layout shift. */
export default function Photo({ photo, sizes = '100vw', eager = false, className, alt, style, ...rest }) {
  const { src, srcSet } = photoSources(photo);
  return (
    <img
      className={className}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={photo.w}
      height={photo.h}
      alt={alt ?? photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      style={style}
      {...rest}
    />
  );
}
