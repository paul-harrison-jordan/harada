import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'

export default async function Home() {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
