import Image from "next/image"
import { CARD_FACES, RWS_AVAILABLE, cardBySlug } from "@arcana/core"

/** One card face.
 *
 * Prefers the 1909 Rider-Waite-Smith scan when it has been fetched into
 * public/cards/rws/, and falls back to the site's own SVG deck otherwise. The
 * choice is made from a build-time manifest rather than by stat-ing the disk,
 * so a server component never touches the filesystem per card and every
 * request renders the same thing.
 *
 * The SVG path inlines the markup so it inherits the theme's CSS custom
 * properties -- an <img> would not, since var(--card-line) does not cross an
 * image boundary. That markup comes from our own generator, never user input,
 * which is what makes the inline safe.
 */
export function CardFace({
  slug,
  reversed = false,
  className = "",
  priority = false,
}: {
  slug: string
  reversed?: boolean
  className?: string
  priority?: boolean
}) {
  const cls = `art${reversed ? " reversed" : ""}${className ? ` ${className}` : ""}`

  if (RWS_AVAILABLE.has(slug)) {
    const name = cardBySlug(slug)?.name ?? slug
    return (
      <div className={`${cls} photo`}>
        <Image
          src={`/cards/rws/${slug}.webp`}
          alt={`${name} — Rider-Waite-Smith, 1909`}
          width={300}
          height={520}
          sizes="(max-width: 860px) 40vw, 300px"
          priority={priority}
        />
      </div>
    )
  }

  const svg = CARD_FACES[slug]
  if (!svg) return null
  return <div className={cls} dangerouslySetInnerHTML={{ __html: svg }} />
}
