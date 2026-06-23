import { useEffect } from 'react'
import { SEO } from '@/config/seo'

interface PageMetaOptions {
  title: string
  description?: string
  noIndex?: boolean
}

function setMetaTag(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): void {
  let element = document.querySelector(
    `meta[${attribute}="${key}"]`,
  ) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.content = content
}

export function usePageMeta({
  title,
  description = SEO.description,
  noIndex = false,
}: PageMetaOptions): void {
  useEffect(() => {
    document.title = title

    setMetaTag('name', 'description', description)
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, noIndex])
}
