import { relativeTime } from '../lib/format'
import type { PlayReview } from '../lib/types'
import './ReviewList.css'

type Props = {
  reviews: PlayReview[]
}

function Stars({ rating = 0 }: { rating?: number }) {
  return (
    <span className={`reviews__stars reviews__stars--${rating >= 4 ? 'good' : rating >= 3 ? 'mid' : 'bad'}`} aria-label={`${rating} of 5`}>
      {'★'.repeat(rating)}
      <span className="reviews__stars-empty">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  )
}

export function ReviewList({ reviews }: Props) {
  if (!reviews.length) {
    return <p className="reviews__empty mono">0 reviews</p>
  }

  return (
    <ul className="reviews">
      {reviews.map((review) => (
        <li key={review.id} className="reviews__item">
          <div className="reviews__head">
            <Stars rating={review.rating} />
            <span className="reviews__meta mono">
              {review.version && `v${review.version} · `}
              {relativeTime(review.at)}
            </span>
          </div>
          {review.text && <p className="reviews__text">{review.text}</p>}
          {review.author && <span className="reviews__author">{review.author}</span>}
        </li>
      ))}
    </ul>
  )
}
