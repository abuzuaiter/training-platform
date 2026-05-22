import { redirect } from 'next/navigation'

export default function OrgInvitationsPage({ params }: { params: { id: string } }) {
  redirect(`/org/${params.id}/dashboard`)
}
