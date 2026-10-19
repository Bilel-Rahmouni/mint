import type { RevenueIssue } from '../lib/revenue'
import { Tag } from './ui/Tag'
import './RevenueIssues.css'

type Props = {
  issues: RevenueIssue[]
}

export function RevenueIssues({ issues }: Props) {
  return (
    <ul className="revenue-issues">
      {issues.map((issue, i) => (
        <li
          key={issue.key}
          className={`revenue-issues__row revenue-issues__row--${issue.tone}`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="revenue-issues__source mono">{issue.source}</span>
          <span className="revenue-issues__label" title={issue.label}>
            {issue.label}
          </span>
          <Tag tone={issue.tone}>{issue.state}</Tag>
        </li>
      ))}
    </ul>
  )
}
