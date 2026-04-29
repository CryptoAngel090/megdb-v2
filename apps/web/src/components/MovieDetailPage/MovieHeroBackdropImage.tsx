import Image, { type ImageProps } from 'next/image'

type MovieHeroBackdropImageProps = ImageProps & {
  /** Kept for API compatibility with existing call sites. */
  focalAssetKey: string
  /** Kept for API compatibility with existing call sites. */
  disableAutoFocal?: boolean
}

export function MovieHeroBackdropImage({
  focalAssetKey: _focalAssetKey,
  disableAutoFocal: _disableAutoFocal = false,
  className,
  style,
  ...rest
}: MovieHeroBackdropImageProps) {
  return <Image {...rest} className={className} style={style} />
}
