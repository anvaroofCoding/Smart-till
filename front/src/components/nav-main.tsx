import { useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, GripVertical, type LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  items?: {
    title: string
    url: string
  }[]
}

interface NavMainProps {
  items: NavMainItem[]
  groupLabel?: string | false
  sortable?: boolean
  onReorder?: (activeId: string, overId: string) => void
}

function NavSectionItem({ item }: { item: NavMainItem }) {
  const location = useLocation()
  const isSectionActive = item.items?.some(
    (subItem) => location.pathname === subItem.url,
  )

  return (
    <Collapsible
      asChild
      defaultOpen={isSectionActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isSectionActive}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === subItem.url}
                >
                  <NavLink to={subItem.url}>
                    <span>{subItem.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SortableNavSectionItem({ item }: { item: NavMainItem }) {
  const location = useLocation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.url })

  const isSectionActive = item.items?.some(
    (subItem) => location.pathname === subItem.url,
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Collapsible
      asChild
      defaultOpen={isSectionActive}
      className="group/collapsible"
    >
      <SidebarMenuItem
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && 'relative z-50')}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isSectionActive}
            className={cn(
              'cursor-grab active:cursor-grabbing',
              isDragging && 'bg-sidebar-accent shadow-md',
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="text-muted-foreground size-3.5 shrink-0" />
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === subItem.url}
                >
                  <NavLink to={subItem.url}>
                    <span>{subItem.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
  groupLabel = 'Menyu',
  sortable = false,
  onReorder,
}: NavMainProps) {
  const itemIds = useMemo(() => items.map((item) => item.url), [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder?.(String(active.id), String(over.id))
  }

  const menuItems = sortable
    ? items.map((item) => (
        <SortableNavSectionItem key={item.url} item={item} />
      ))
    : items.map((item) => <NavSectionItem key={item.url} item={item} />)

  return (
    <SidebarGroup>
      {groupLabel !== false && (
        <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      )}
      {sortable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <SidebarMenu>{menuItems}</SidebarMenu>
          </SortableContext>
        </DndContext>
      ) : (
        <SidebarMenu>{menuItems}</SidebarMenu>
      )}
    </SidebarGroup>
  )
}
