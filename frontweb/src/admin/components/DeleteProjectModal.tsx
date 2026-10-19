import { useState } from 'react'
import { api } from '../lib/api'
import type { Project } from '../lib/types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import './DeleteProjectModal.css'

type Props = {
  project: Project
  onClose: () => void
  onDeleted: () => void
}

export function DeleteProjectModal({ project, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await api.deleteProject(project._id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete project')
      setDeleting(false)
    }
  }

  return (
    <Modal
      title={`Delete ${project.name}`}
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" icon="trash" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </>
      }
    >
      <p className="delete-project__text">
        This removes the project, its uptime history, and its entry on mintstudio.io. It can’t be undone.
      </p>
      {error && <p className="delete-project__error">{error}</p>}
    </Modal>
  )
}
