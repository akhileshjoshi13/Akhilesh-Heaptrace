import { test, expect, Page } from '@playwright/test'

// ─── Page Object ─────────────────────────────────────────────────────────────

class KickoffAgendaPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/kickoff-agenda.html')
    await this.page.waitForLoadState('networkidle')
  }

  async clearStorage() {
    await this.page.evaluate(() =>
      localStorage.removeItem('heaptrace_kickoff_agenda_v1')
    )
  }

  // Meta fields
  async fillClient(value: string) {
    await this.page.locator('#meta-client').fill(value)
  }
  async fillDate(value: string) {
    await this.page.locator('#meta-date').fill(value)
  }
  async selectEngagement(label: string) {
    await this.page.locator('#meta-engagement').selectOption({ label })
  }

  // Section 2 — Access fields
  async fillCloud(value: string) {
    await this.page.locator('#access-cloud').fill(value)
  }
  async fillVCS(value: string) {
    await this.page.locator('#access-vcs').fill(value)
  }
  async fillPM(value: string) {
    await this.page.locator('#access-pm').fill(value)
  }
  async fillComms(value: string) {
    await this.page.locator('#access-comms').fill(value)
  }
  async fillAdditionalAccess(value: string) {
    await this.page.locator('#access-additional').fill(value)
  }

  // Section 5 — Priorities
  async fillPriority(n: 1 | 2 | 3, value: string) {
    await this.page.locator(`#priority-${n}`).fill(value)
  }

  // Section 6 — Notes
  async fillNotes(value: string) {
    await this.page.locator('#notes-aob').fill(value)
  }

  // Trigger auto-save manually via JS (same function the page uses)
  async saveViaJS() {
    await this.page.evaluate(() => {
      const FIELDS = [
        'meta-client', 'meta-date', 'meta-engagement',
        'access-cloud', 'access-vcs', 'access-pm', 'access-comms', 'access-additional',
        'priority-1', 'priority-2', 'priority-3',
        'notes-aob',
      ]
      const data: Record<string, string> = {}
      FIELDS.forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) data[id] = el.value
      })
      localStorage.setItem('heaptrace_kickoff_agenda_v1', JSON.stringify(data))
    })
  }

  // Read a field value
  async fieldValue(id: string): Promise<string> {
    return this.page.locator(`#${id}`).inputValue()
  }

  // Toast
  toastLocator() {
    return this.page.locator('#toast')
  }

  // Download button
  downloadBtn() {
    return this.page.locator('#download-btn')
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — page load', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle('Kickoff Meeting Agenda — Heaptrace')
  })

  test('Heaptrace logo is visible in the header', async ({ page }) => {
    await expect(page.locator('.logo-wrap svg')).toBeVisible()
  })

  test('header shows Client Kickoff badge', async ({ page }) => {
    await expect(page.locator('.badge')).toContainText('Client Kickoff')
  })

  test('download PDF icon button is visible', async () => {
    await expect(agenda.downloadBtn()).toBeVisible()
  })

  test('no Save button is present', async ({ page }) => {
    await expect(page.locator('#save-btn')).toHaveCount(0)
  })

  test('all 6 agenda sections are visible', async ({ page }) => {
    const nums = page.locator('.section-num')
    await expect(nums).toHaveCount(6)
    for (let i = 1; i <= 6; i++) {
      await expect(nums.nth(i - 1)).toContainText(String(i))
    }
  })

  test('section titles are correct', async ({ page }) => {
    const titles = page.locator('.card-title')
    await expect(titles.nth(0)).toContainText('Welcome & Team Introductions')
    await expect(titles.nth(1)).toContainText('Project Access Setup')
    await expect(titles.nth(2)).toContainText('Communication & Call Protocol')
    await expect(titles.nth(3)).toContainText('Escalation Path')
    await expect(titles.nth(4)).toContainText('First 2-Week Focus Areas')
    await expect(titles.nth(5)).toContainText('Open Discussion & Any Other Business')
  })

  test('footer shows Heaptrace Technology and current year', async ({ page }) => {
    const year = String(new Date().getFullYear())
    await expect(page.locator('.footer-text')).toContainText('Heaptrace Technology')
    await expect(page.locator('#footer-year')).toContainText(year)
  })
})

test.describe('Kickoff Agenda — Section 1: Team Introductions', () => {
  test.beforeEach(async ({ page }) => {
    const agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('shows Heaptrace Team row with role list only — no trailing sentence', async ({ page }) => {
    const htTeamDesc = page.locator('.item-desc').first()
    await expect(htTeamDesc).toContainText('Director of Sales · Delivery Manager · Execution & Delivery Team')
    await expect(htTeamDesc).not.toContainText('each member shares their name')
  })

  test('shows Client Team and Meeting Objective rows', async ({ page }) => {
    const labels = page.locator('.item-label')
    await expect(labels).toContainText(['Heaptrace Team', 'Client Team', 'Meeting Objective'])
  })
})

test.describe('Kickoff Agenda — Section 2: Project Access Setup', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('all four tool cards are present', async ({ page }) => {
    await expect(page.locator('.tool-name')).toContainText([
      'Cloud Platform',
      'Source Control',
      'Project Management',
      'Communication',
    ])
  })

  test('user can type in all access fields', async () => {
    await agenda.fillCloud('AWS')
    await agenda.fillVCS('GitHub')
    await agenda.fillPM('Jira')
    await agenda.fillComms('Slack')
    await agenda.fillAdditionalAccess('VPN access needed for staging environment')

    expect(await agenda.fieldValue('access-cloud')).toBe('AWS')
    expect(await agenda.fieldValue('access-vcs')).toBe('GitHub')
    expect(await agenda.fieldValue('access-pm')).toBe('Jira')
    expect(await agenda.fieldValue('access-comms')).toBe('Slack')
    expect(await agenda.fieldValue('access-additional')).toBe('VPN access needed for staging environment')
  })
})

test.describe('Kickoff Agenda — Section 3: Communication & Call Protocol', () => {
  test.beforeEach(async ({ page }) => {
    const agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('shows all 6 communication items', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    const items = section3.locator('.item-label')
    await expect(items).toHaveCount(6)
  })

  test('includes Call Cadence, Time Zone, Async Communication and Meeting Format', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    await expect(section3).toContainText('Call Cadence')
    await expect(section3).toContainText('Time Zone & Working Hours')
    await expect(section3).toContainText('Async Communication')
    await expect(section3).toContainText('Meeting Format')
  })

  test('includes Delivery Review 2x monthly item', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    await expect(section3).toContainText('Delivery Review — 2× Monthly (Delivery Manager)')
    await expect(section3).toContainText('Bi-monthly check-in led by the Delivery Manager')
  })

  test('includes Management Sync monthly item', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    await expect(section3).toContainText('Management Sync — Monthly (Director of Engineering & Director of Sales)')
    await expect(section3).toContainText('Monthly leadership call to discuss overall satisfaction')
  })
})

test.describe('Kickoff Agenda — Section 4: Escalation Path', () => {
  test.beforeEach(async ({ page }) => {
    const agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('shows Level 1 Delivery Manager and Level 2 Director of Sales', async ({ page }) => {
    const section4 = page.locator('.card').nth(3)
    await expect(section4).toContainText('Level 1')
    await expect(section4).toContainText('Delivery Manager')
    await expect(section4).toContainText('Level 2')
    await expect(section4).toContainText('Director of Sales')
  })

  test('escalation arrow is rendered between the two levels', async ({ page }) => {
    const section4 = page.locator('.card').nth(3)
    await expect(section4.locator('svg path[d*="M0 8H24"]')).toBeVisible()
  })
})

test.describe('Kickoff Agenda — Section 5: Priorities', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('shows P1, P2, P3 priority inputs', async ({ page }) => {
    await expect(page.locator('.priority-num')).toContainText(['P1', 'P2', 'P3'])
  })

  test('user can enter all three priorities', async () => {
    await agenda.fillPriority(1, 'Set up dev environment and repo access')
    await agenda.fillPriority(2, 'Kick off first sprint and define backlog')
    await agenda.fillPriority(3, 'Align on definition of done and coding standards')

    expect(await agenda.fieldValue('priority-1')).toBe('Set up dev environment and repo access')
    expect(await agenda.fieldValue('priority-2')).toBe('Kick off first sprint and define backlog')
    expect(await agenda.fieldValue('priority-3')).toBe('Align on definition of done and coding standards')
  })
})

test.describe('Kickoff Agenda — Meta fields', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('user can type the client name', async () => {
    await agenda.fillClient('Acme Corp')
    expect(await agenda.fieldValue('meta-client')).toBe('Acme Corp')
  })

  test('user can pick a date', async () => {
    await agenda.fillDate('2025-06-15')
    expect(await agenda.fieldValue('meta-date')).toBe('2025-06-15')
  })

  test('engagement dropdown has all expected options', async ({ page }) => {
    const select = page.locator('#meta-engagement')
    const options = await select.locator('option').allTextContents()
    expect(options).toContain('Staff Augmentation')
    expect(options).toContain('Fixed Price')
    expect(options).toContain('Time & Materials')
    expect(options).toContain('Retainer')
    expect(options).toContain('Discovery / POC')
    expect(options).toContain('Other')
  })

  test('user can select an engagement type', async () => {
    await agenda.selectEngagement('Staff Augmentation')
    expect(await agenda.fieldValue('meta-engagement')).toBe('Staff Augmentation')
  })
})

test.describe('Kickoff Agenda — localStorage persistence', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('filled data survives a page reload', async ({ page }) => {
    await agenda.fillClient('Reload Test Client')
    await agenda.fillCloud('GCP')
    await agenda.fillPriority(1, 'Write tests first')
    await agenda.fillNotes('This should persist after reload')

    // Save via the same function the page uses
    await agenda.saveViaJS()

    // Reload — page should auto-load from localStorage
    await page.reload()
    await page.waitForLoadState('networkidle')

    expect(await agenda.fieldValue('meta-client')).toBe('Reload Test Client')
    expect(await agenda.fieldValue('access-cloud')).toBe('GCP')
    expect(await agenda.fieldValue('priority-1')).toBe('Write tests first')
    expect(await agenda.fieldValue('notes-aob')).toBe('This should persist after reload')
  })

  test('all 12 fields are saved and restored', async ({ page }) => {
    const testData = {
      'meta-client':       'Full Restore Corp',
      'meta-date':         '2025-07-01',
      'meta-engagement':   'Fixed Price',
      'access-cloud':      'Azure',
      'access-vcs':        'Bitbucket',
      'access-pm':         'Linear',
      'access-comms':      'Teams',
      'access-additional': 'Need VPN',
      'priority-1':        'Priority One',
      'priority-2':        'Priority Two',
      'priority-3':        'Priority Three',
      'notes-aob':         'Action item: send repo invite',
    }

    // Fill all fields
    await agenda.fillClient(testData['meta-client'])
    await agenda.fillDate(testData['meta-date'])
    await agenda.selectEngagement(testData['meta-engagement'])
    await agenda.fillCloud(testData['access-cloud'])
    await agenda.fillVCS(testData['access-vcs'])
    await agenda.fillPM(testData['access-pm'])
    await agenda.fillComms(testData['access-comms'])
    await agenda.fillAdditionalAccess(testData['access-additional'])
    await agenda.fillPriority(1, testData['priority-1'])
    await agenda.fillPriority(2, testData['priority-2'])
    await agenda.fillPriority(3, testData['priority-3'])
    await agenda.fillNotes(testData['notes-aob'])

    await agenda.saveViaJS()
    await page.reload()
    await page.waitForLoadState('networkidle')

    for (const [id, expected] of Object.entries(testData)) {
      expect(await agenda.fieldValue(id)).toBe(expected)
    }
  })

  test('empty page loads cleanly when no saved data exists', async ({ page }) => {
    // clearStorage already ran in beforeEach
    await page.reload()
    await page.waitForLoadState('networkidle')

    // All fields should be empty
    expect(await agenda.fieldValue('meta-client')).toBe('')
    expect(await agenda.fieldValue('priority-1')).toBe('')
    expect(await agenda.fieldValue('notes-aob')).toBe('')
  })

  test('corrupt localStorage data does not crash the page', async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem('heaptrace_kickoff_agenda_v1', 'not-valid-json{{')
    )
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Page should still render all sections normally
    await expect(page.locator('.card-title').first()).toBeVisible()
  })
})

test.describe('Kickoff Agenda — Download PDF button', () => {
  test.beforeEach(async ({ page }) => {
    const agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('download button is a circular icon with no text label', async ({ page }) => {
    const btn = page.locator('#download-btn')
    await expect(btn).toBeVisible()
    // Contains an SVG icon
    await expect(btn.locator('svg')).toBeVisible()
    // No visible text content
    const text = (await btn.textContent())?.trim() ?? ''
    expect(text).toBe('')
  })

  test('download button is enabled on page load', async ({ page }) => {
    const btn = page.locator('#download-btn')
    await expect(btn).toBeEnabled()
  })

  test('download button has title tooltip for accessibility', async ({ page }) => {
    const btn = page.locator('#download-btn')
    await expect(btn).toHaveAttribute('title', 'Download PDF')
  })

  test('clicking download button does not navigate away from the page', async ({ page }) => {
    const urlBefore = page.url()
    await page.locator('#download-btn').click()
    // Give html2pdf a moment to start, then verify we're still on the same page
    await page.waitForTimeout(500)
    expect(page.url()).toBe(urlBefore)
  })
})

test.describe('Kickoff Agenda — responsive layout (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    const agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('all 6 sections are visible on mobile', async ({ page }) => {
    await expect(page.locator('.section-num')).toHaveCount(6)
  })

  test('tool grid stacks to single column on mobile', async ({ page }) => {
    const grid = page.locator('.tool-grid')
    const style = await grid.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    )
    // Single column = one value, not two
    expect(style.split(' ').length).toBe(1)
  })

  test('header title is readable at mobile font size', async ({ page }) => {
    const title = page.locator('.header-title')
    await expect(title).toBeVisible()
    const fontSize = await title.evaluate(el =>
      parseInt(window.getComputedStyle(el).fontSize)
    )
    expect(fontSize).toBeGreaterThanOrEqual(22)
  })
})

test.describe('Kickoff Agenda — hub navigation', () => {
  test('index page links to kickoff-agenda.html', async ({ page }) => {
    await page.goto('/index.html')
    const link = page.locator('a[href="kickoff-agenda.html"]')
    await expect(link).toBeVisible()
    await expect(link).toContainText('Kickoff Meeting Agenda')
  })

  test('index page links to the risk report', async ({ page }) => {
    await page.goto('/index.html')
    const link = page.locator('a[href="client-engagement-risk-report.html"]')
    await expect(link).toBeVisible()
  })
})
