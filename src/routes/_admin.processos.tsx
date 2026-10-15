import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/processos')({
  component: ProcessosLayout,
})

function ProcessosLayout() {
  return <Outlet />
}
