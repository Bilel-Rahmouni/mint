import type { CSSProperties } from 'react'
import { postTone, socials } from '../lib/growth'
import type { ContentPost, Project } from '../lib/types'
import { Tag } from './ui/Tag'
import './CalendarPost.css'

type Props = {
  post: ContentPost
  project?: Project
  index?: number
  onClick: () => void
}

export function CalendarPost({ post, project, index = 0, onClick }: Props) {
  const social = socials[post.social]

  return (
    <button
      type="button"
      className={`calendar-post ${post.status === 'Published' ? 'calendar-post--past' : ''}`}
      style={{ '--post-color': social.color, '--i': index } as CSSProperties}
      onClick={onClick}
    >
      <span className="calendar-post__meta">
        <span className="calendar-post__social">{social.label}</span>
        <span className="calendar-post__time">{post.time}</span>
      </span>
      <span className="calendar-post__title">{post.title}</span>
      <span className="calendar-post__foot">
        <span className="calendar-post__product">{project?.name}</span>
        {post.status !== 'Scheduled' && <Tag tone={postTone[post.status]}>{post.status}</Tag>}
      </span>
    </button>
  )
}
