import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import type { Project, StudioTodo, TodoArea } from '../lib/types'
import { Button } from './ui/Button'
import { Field, SelectField } from './ui/Field'
import './TodoBoard.css'

const AREA_LABEL: Record<TodoArea, string> = {
  seo: 'SEO',
  aso: 'ASO',
  ads: 'Ads',
  content: 'Content',
  launch: 'Launch',
  general: 'General',
}

type Props = {
  projects: Project[]
  area?: TodoArea
  areas?: TodoArea[]
  check?: boolean
}

export function TodoBoard({ projects, area = 'general', areas, check = false }: Props) {
  const [todos, setTodos] = useState<StudioTodo[]>([])
  const [projectId, setProjectId] = useState(projects[0]?._id ?? '')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0]._id)
  }, [projectId, projects])

  useEffect(() => {
    let active = true
    api.listTodos()
      .then(({ todos: rows }) => {
        if (active) setTodos(rows)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load todos')
      })
    return () => {
      active = false
    }
  }, [])

  const visible = todos.filter((todo) => !areas || areas.includes(todo.area))
  const open = visible.filter((todo) => !todo.doneAt)
  const done = visible.filter((todo) => todo.doneAt)
  const nameOf = (id: string) => projects.find((project) => project._id === id)?.name ?? 'Project'
  const showArea = !areas || areas.length > 1

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = title.trim()
    if (!text || !projectId) return
    setSaving(true)
    setError(null)
    try {
      const { todo } = await api.createTodo({ projectId, title: text, area })
      setTodos((list) => [todo, ...list])
      setTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add todo')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (todo: StudioTodo) => {
    const previous = todos
    setTodos((list) => list.map((item) => (
      item._id === todo._id ? { ...item, doneAt: item.doneAt ? null : new Date().toISOString() } : item
    )))
    try {
      const { todo: saved } = await api.toggleTodo(todo._id)
      setTodos((list) => list.map((item) => (item._id === saved._id ? saved : item)))
    } catch (err) {
      setTodos(previous)
      setError(err instanceof Error ? err.message : 'Could not update todo')
    }
  }

  const runCheck = async () => {
    setChecking(true)
    setError(null)
    setNotice(null)
    try {
      const result = await api.checkTodos()
      setTodos(result.todos)
      setNotice(result.created ? `${result.created} added` : 'No changes found')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="todos">
      <form className={`todos__add ${check ? 'todos__add--check' : ''}`} onSubmit={submit}>
        <SelectField label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </SelectField>
        <Field label="Todo" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          Add
        </Button>
        {check && (
          <Button type="button" variant="subtle" size="sm" icon="refresh" loading={checking} onClick={runCheck}>
            Check
          </Button>
        )}
      </form>

      {notice && <p className="todos__notice">{notice}</p>}
      {error && <p className="todos__error">{error}</p>}

      <ul className="todos__list">
        {open.map((todo) => (
          <TodoRow
            key={todo._id}
            todo={todo}
            name={nameOf(todo.projectId)}
            showArea={showArea && todo.area !== 'general'}
            onToggle={() => toggle(todo)}
          />
        ))}
      </ul>

      {done.length > 0 && (
        <div className="todos__done">
          <span className="todos__done-label">Done</span>
          <ul className="todos__list">
            {done.map((todo) => (
              <TodoRow
                key={todo._id}
                todo={todo}
                name={nameOf(todo.projectId)}
                showArea={showArea && todo.area !== 'general'}
                onToggle={() => toggle(todo)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function TodoRow({
  todo,
  name,
  showArea,
  onToggle,
}: {
  todo: StudioTodo
  name: string
  showArea: boolean
  onToggle: () => void
}) {
  return (
    <li className={`todos__row ${todo.doneAt ? 'is-done' : ''}`}>
      <label>
        <input type="checkbox" checked={Boolean(todo.doneAt)} onChange={onToggle} />
        <span className="todos__chip">{name}</span>
        {showArea && <span className="todos__area">{AREA_LABEL[todo.area]}</span>}
        <span className="todos__title">{todo.title}</span>
      </label>
    </li>
  )
}
