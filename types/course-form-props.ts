export interface CourseFormProps {
  categories: Array<{ id: string | number; nameEn: string; nameAr: string }>
  instructors: Array<{ id: string | number; name: string; email: string }>
  redirectBase?: string
}
