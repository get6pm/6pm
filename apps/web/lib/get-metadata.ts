import config from '@/constants/config'
import { Metadata } from 'next'

export default function getMetadata({
  title,
  $title,
  keywords,
  ...metadata
}: Omit<Metadata, 'keywords'> & {
  $title?: string
  keywords?: string[]
}) {
  return {
    title: $title || `${title} – ${config.appNameLowercase}`,
    description: 'Financial management for the modern age',
    keywords: ['finance', 'management', 'modern', 'age', ...(keywords || [])],
    author: 'Đỗ Cao Thượng Dương',
    ...metadata,
  }
}
