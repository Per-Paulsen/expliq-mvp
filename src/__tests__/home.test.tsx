import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import WorkspaceSnapshotPage from '@/app/page'

describe('WorkspaceSnapshotPage', () => {
  it('renders the page heading', () => {
    render(<WorkspaceSnapshotPage />)
    expect(screen.getByText('Workspace Snapshot')).toBeInTheDocument()
  })
})
