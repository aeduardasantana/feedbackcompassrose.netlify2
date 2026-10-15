import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/consultoras')({
  component: ConsultorasLayout,
})

function ConsultorasLayout() {
  return <Outlet />
}
