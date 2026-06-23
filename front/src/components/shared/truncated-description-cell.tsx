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

function useIsTextTruncated<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  text: string,
) {
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    function checkTruncation() {
      setIsTruncated(element.scrollWidth > element.clientWidth + 1)
    }

    checkTruncation()

    const observer = new ResizeObserver(checkTruncation)
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, text])

  return isTruncated
}

interface TruncatedDescriptionCellProps {
  title: string
  description: string
  dialogSubtitle: string
}

export function TruncatedDescriptionCell({
  title,
  description,
  dialogSubtitle,
}: TruncatedDescriptionCellProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const isTruncated = useIsTextTruncated(textRef, description)

  if (!description) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <>
      <div className="max-w-[220px]">
        <p
          ref={textRef}
          className="text-muted-foreground truncate text-sm"
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
