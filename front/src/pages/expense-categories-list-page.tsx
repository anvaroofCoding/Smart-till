import { useEffect, useState } from 'react'

import {
  ExpenseCategoryFormDialog,
  type ExpenseCategoryFormValues,
} from '@/components/expense-categories/expense-category-form-dialog'
import { ExpenseCategoryDeleteButton } from '@/components/expense-categories/expense-category-delete-button'
import { AppIcon } from '@/components/icons/app-icon'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useCreateExpenseCategoryMutation,
  useDeactivateExpenseCategoryMutation,
  useGetExpenseCategoryGroupsQuery,
} from '@/store/api/expense-categories.api'

export function ExpenseCategoriesListPage() {
  const [parentDialogOpen, setParentDialogOpen] = useState(false)
  const [childDialogOpen, setChildDialogOpen] = useState(false)
  const [childParentId, setChildParentId] = useState<string | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const categoriesQuery = useGetExpenseCategoryGroupsQuery()
  const [createCategory, createState] = useCreateExpenseCategoryMutation()
  const [deactivateCategory] = useDeactivateExpenseCategoryMutation()

  const { showSkeleton, showRefreshing } = useQueryLoading(categoriesQuery)
  const groups = categoriesQuery.data ?? []

  usePageMeta({
    title: pageTitle('Xarajatlarni ro\'yxati', 'Kassir'),
  })

  useEffect(() => {
    if (!categoriesQuery.error) return
    notify.error(
      getApiErrorMessage(categoriesQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [categoriesQuery.error])

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  async function handleCreate(
    values: ExpenseCategoryFormValues,
    mode: 'parent' | 'child',
  ) {
    try {
      await createCategory({
        name: values.name,
        parentId: values.parentId,
      }).unwrap()
      notify.success(
        mode === 'parent'
          ? 'Asosiy xarajat turi qo\'shildi'
          : 'Ichki xarajat turi qo\'shildi',
      )
      if (mode === 'parent') {
        setParentDialogOpen(false)
      } else {
        setChildDialogOpen(false)
      }
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'Saqlab bo\'lmadi'))
    }
  }

  async function handleDeactivate(id: string, label: string) {
    setDeletingId(id)
    try {
      await deactivateCategory(id).unwrap()
      notify.success(`"${label}" o'chirildi`)
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'O\'chirib bo\'lmadi'))
    } finally {
      setDeletingId(null)
    }
  }

  function openChildDialog(parentId?: string) {
    setChildParentId(parentId)
    setChildDialogOpen(true)
  }

  let rowIndex = 0

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Xarajatlarni ro&apos;yxati
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openChildDialog()}>
            <AppIcon name="plus" />
            Ichki tur qo&apos;shish
          </Button>
          <Button onClick={() => setParentDialogOpen(true)}>
            <AppIcon name="plus" />
            Asosiy tur qo&apos;shish
          </Button>
        </div>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 overflow-auto">
          {showSkeleton ? (
            <DataTableSkeleton columns={4} rows={8} />
          ) : (
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Asosiy xarajat turi</TableHead>
                  <TableHead>Xarajat turi</TableHead>
                  <TableHead className="w-48 text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Xarajat turlari topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.flatMap((group) => {
                    rowIndex += 1
                    const parentRowIndex = rowIndex
                    const isCollapsed = collapsedGroups[group.id] ?? false
                    const hasChildren = group.children.length > 0
                    const rows = [
                      <TableRow key={group.id} className="hover:bg-transparent">
                        <TableCell className="text-muted-foreground tabular-nums">
                          {parentRowIndex}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{group.name}</span>
                            {hasChildren ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground h-7 px-2 text-xs"
                                onClick={() => toggleGroup(group.id)}
                              >
                                <AppIcon
                                  name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                                  className="size-3.5"
                                />
                                {isCollapsed ? "Ko'rsatish" : 'Yashirish'}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openChildDialog(group.id)}
                            >
                              <AppIcon name="plus" />
                              Ichki tur
                            </Button>
                            <ExpenseCategoryDeleteButton
                              label={group.name}
                              hasChildren={hasChildren}
                              isDeleting={deletingId === group.id}
                              onConfirm={() =>
                                handleDeactivate(group.id, group.name)
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>,
                    ]

                    if (!isCollapsed) {
                      for (const child of group.children) {
                        rowIndex += 1
                        rows.push(
                          <TableRow key={child.id}>
                            <TableCell className="text-muted-foreground tabular-nums">
                              {rowIndex}
                            </TableCell>
                            <TableCell className="text-muted-foreground pl-8">
                              {group.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{child.name}</span>
                                {child.usageCount > 0 ? (
                                  <span className="text-muted-foreground text-xs tabular-nums">
                                    ({child.usageCount} marta)
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <ExpenseCategoryDeleteButton
                                label={child.name}
                                usageCount={child.usageCount}
                                isDeleting={deletingId === child.id}
                                onConfirm={() =>
                                  handleDeactivate(child.id, child.name)
                                }
                              />
                            </TableCell>
                          </TableRow>,
                        )
                      }

                      if (!hasChildren) {
                        rows.push(
                          <TableRow key={`${group.id}-empty`}>
                            <TableCell />
                            <TableCell
                              colSpan={3}
                              className="text-muted-foreground pl-8 text-sm"
                            >
                              Ichki xarajat turlari yo&apos;q. «Ichki tur» tugmasini
                              bosing.
                            </TableCell>
                          </TableRow>,
                        )
                      }
                    } else if (hasChildren) {
                      rows.push(
                        <TableRow key={`${group.id}-collapsed`}>
                          <TableCell />
                          <TableCell
                            colSpan={3}
                            className={cn(
                              'text-muted-foreground pl-8 text-sm',
                            )}
                          >
                            {group.children.length} ta ichki tur yashirilgan.
                          </TableCell>
                        </TableRow>,
                      )
                    }

                    return rows
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <QueryRefreshIndicator visible={showRefreshing} />
      </div>

      <ExpenseCategoryFormDialog
        open={parentDialogOpen}
        onOpenChange={setParentDialogOpen}
        mode="parent"
        parentGroups={groups}
        isSaving={createState.isLoading}
        onSubmit={(values) => handleCreate(values, 'parent')}
      />

      <ExpenseCategoryFormDialog
        open={childDialogOpen}
        onOpenChange={setChildDialogOpen}
        mode="child"
        parentGroups={groups}
        defaultParentId={childParentId}
        isSaving={createState.isLoading}
        onSubmit={(values) => handleCreate(values, 'child')}
      />
    </div>
  )
}
