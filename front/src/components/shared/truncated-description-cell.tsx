import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TruncatedDescriptionCellProps {
  title: string
  description: string
  dialogSubtitle: string
  lines?: 1 | 2
  className?: string
}

function useIsTextTruncated<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  text: string,
  lines: 1 | 2,
) {
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    function checkTruncation() {
      if (lines === 2) {
        setIsTruncated(element.scrollHeight > element.clientHeight + 1)
      } else {
        setIsTruncated(element.scrollWidth > element.clientWidth + 1)
      }
    }

    checkTruncation()

    const observer = new ResizeObserver(checkTruncation)
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, text, lines])

  return isTruncated
}

export function TruncatedDescriptionCell({
  title,
  description,
  dialogSubtitle,
  lines = 1,
  className,
}: TruncatedDescriptionCellProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const isTruncated = useIsTextTruncated(textRef, description, lines)

  if (!description) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <>
      <div className={className ?? 'max-w-[220px]'}>
        <p
          ref={textRef}
          className={
            lines === 2
              ? 'text-muted-foreground line-clamp-2 text-sm'
              : 'text-muted-foreground truncate text-sm'
          }
        >
          {description}
        </p>
        {isTruncated && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-primary h-auto p-0 text-xs"
            onClick={() => setViewOpen(true)}
          >
            Ko&apos;rish
          </Button>
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{dialogSubtitle}</DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {description}
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
