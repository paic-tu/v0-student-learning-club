import { MetadataRoute } from 'next'
import { getAllCourses } from '@/lib/db/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neonedu.org'
  const courses = await getAllCourses()

  const staticRoutes = [
    '',
    '/courses',
    '/about',
    '/contact',
    '/pricing',
    '/faq',
    '/auth/login',
    '/auth/register',
  ]

  const languages = ['ar', 'en']

  const routes: MetadataRoute.Sitemap = []

  // Add static routes for each language
  languages.forEach(lang => {
    staticRoutes.forEach(route => {
      routes.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })

  // Add course routes for each language
  courses.forEach((course: any) => {
    languages.forEach(lang => {
      routes.push({
        url: `${baseUrl}/${lang}/courses/${course.id}`,
        lastModified: new Date(course.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    })
  })

  return routes
}
