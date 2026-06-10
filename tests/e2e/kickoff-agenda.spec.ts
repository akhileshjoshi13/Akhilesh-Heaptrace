import { test, expect, Page } from '@playwright/test'

// ─── Page Object ─────────────────────────────────────────────────────────────

class KickoffAgendaPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/kickoff-agenda.html')
    await this.page.waitForLoadState('networkidle')
  }

  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.removeItem('heaptrace_kickoff_agenda_v1')
      localStorage.removeItem('ht_sidebar')
    })
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
  async fillCloud(value: string)     { await this.page.locator('#access-cloud').fill(value) }
  async fillVCS(value: string)       { await this.page.locator('#access-vcs').fill(value) }
  async fillPM(value: string)        { await this.page.locator('#access-pm').fill(value) }
  async fillComms(value: string)     { await this.page.locator('#access-comms').fill(value) }
  async fillAdditionalAccess(value: string) { await this.page.locator('#access-additional').fill(value) }

  // Section 5 — Priorities
  async fillPriority(n: 1 | 2 | 3, value: string) {
    await this.page.locator(`#priority-${n}`).fill(value)
  }

  // Section 6 — Notes
  async fillNotes(value: string) { await this.page.locator('#notes-aob').fill(value) }

  // Sidebar
  sidebar()       { return this.page.locator('#sidebar') }
  searchInput()   { return this.page.locator('#sidebar-search') }
  searchClear()   { return this.page.locator('#search-clear') }
  newMeetingBtn() { return this.page.locator('.new-mtg-btn') }
  clientList()    { return this.page.locator('#client-list') }
  sidebarToggleBtn() { return this.page.locator('#sidebar-toggle-btn') }
  topbarToggle()  { return this.page.locator('.topbar-toggle') }

  // Email modal
  saveDbBtn()     { return this.page.locator('#save-db-btn') }
  emailModal()    { return this.page.locator('#email-modal') }
  modalEmailInput() { return this.page.locator('#modal-email') }
  modalSaveOnlyBtn() { return this.page.locator('#modal-save-only-btn') }
  modalSendBtn()  { return this.page.locator('#modal-send-btn') }

  // Active client pill
  activePill()    { return this.page.locator('#active-client-pill') }

  // Chips
  async clickFreqChip(label: string) {
    await this.page.locator('#freq-chips .freq-chip', { hasText: label }).click()
  }
  async clickDayChip(day: string) {
    await this.page.locator('#day-chips .freq-chip', { hasText: day }).click()
  }
  freqChip(label: string) {
    return this.page.locator('#freq-chips .freq-chip', { hasText: label })
  }
  dayChip(day: string) {
    return this.page.locator('#day-chips .freq-chip', { hasText: day })
  }
  freqDaysSection() { return this.page.locator('#freq-days-section') }

  // Save via JS (localStorage)
  async saveViaJS() {
    await this.page.evaluate(() => {
      const FIELDS = [
        'meta-client','meta-date','meta-engagement',
        'access-cloud','access-vcs','access-pm','access-comms','access-additional',
        'priority-1','priority-2','priority-3','notes-aob',
      ]
      const data: Record<string, string> = {}
      FIELDS.forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) data[id] = el.value
      })
      localStorage.setItem('heaptrace_kickoff_agenda_v1', JSON.stringify(data))
    })
  }

  async fieldValue(id: string): Promise<string> {
    return this.page.locator(`#${id}`).inputValue()
  }

  // Toast
  toastLocator() { return this.page.locator('#toast') }
  downloadBtn()  { return this.page.locator('#download-btn') }
}

// ─── 1. Page Load ─────────────────────────────────────────────────────────────

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

  test('download PDF button is visible', async () => {
    await expect(agenda.downloadBtn()).toBeVisible()
  })

  test('no legacy #save-btn is present', async ({ page }) => {
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

// ─── 2. Section 1 ────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Section 1: Team Introductions', () => {
  test.beforeEach(async ({ page }) => {
    const a = new KickoffAgendaPage(page)
    await a.goto()
  })

  test('shows Heaptrace Team row including Director of Engineering', async ({ page }) => {
    const htTeamDesc = page.locator('.item-desc').first()
    await expect(htTeamDesc).toContainText('Director of Sales')
    await expect(htTeamDesc).toContainText('Director of Engineering')
    await expect(htTeamDesc).toContainText('Delivery Manager')
    await expect(htTeamDesc).toContainText('Execution & Delivery Team')
  })

  test('shows Client Team and Meeting Objective rows', async ({ page }) => {
    await expect(page.locator('.item-label')).toContainText(['Heaptrace Team', 'Client Team', 'Meeting Objective'])
  })
})

// ─── 3. Section 2 ────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Section 2: Project Access Setup', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('all four tool cards are present', async ({ page }) => {
    await expect(page.locator('.tool-name')).toContainText([
      'Cloud Platform', 'Source Control', 'Project Management', 'Communication',
    ])
  })

  test('user can type in all access fields', async () => {
    await agenda.fillCloud('AWS')
    await agenda.fillVCS('GitHub')
    await agenda.fillPM('Jira')
    await agenda.fillComms('Slack')
    await agenda.fillAdditionalAccess('VPN access needed for staging')

    expect(await agenda.fieldValue('access-cloud')).toBe('AWS')
    expect(await agenda.fieldValue('access-vcs')).toBe('GitHub')
    expect(await agenda.fieldValue('access-pm')).toBe('Jira')
    expect(await agenda.fieldValue('access-comms')).toBe('Slack')
    expect(await agenda.fieldValue('access-additional')).toBe('VPN access needed for staging')
  })
})

// ─── 4. Section 3 ────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Section 3: Communication & Call Protocol', () => {
  test.beforeEach(async ({ page }) => {
    const a = new KickoffAgendaPage(page)
    await a.goto()
  })

  test('shows 5 static item-labels in section 3', async ({ page }) => {
    // item-labels: Call Cadence, Daily Work Updates, Meeting Format,
    //              Delivery Review, Management Sync
    const section3 = page.locator('.card').nth(2)
    const items = section3.locator('.item-label')
    await expect(items).toHaveCount(5)
  })

  test('includes Call Cadence and Daily Work Updates', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    await expect(section3).toContainText('Call Cadence')
    await expect(section3).toContainText('Daily Work Updates')
  })

  test('includes Meeting Format and call time fields', async ({ page }) => {
    const section3 = page.locator('.card').nth(2)
    await expect(section3).toContainText('Meeting Format')
    await expect(section3).toContainText('Call Time')
    await expect(section3).toContainText('Time Zone')
  })

  test('includes Delivery Review 2× monthly item', async ({ page }) => {
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

// ─── 5. Frequency Chips ──────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Frequency chips', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('all 6 frequency chips are rendered', async ({ page }) => {
    await expect(page.locator('#freq-chips .freq-chip')).toHaveCount(6)
  })

  test('clicking a freq chip marks it active', async () => {
    await agenda.clickFreqChip('2× / week')
    await expect(agenda.freqChip('2× / week')).toHaveClass(/active/)
  })

  test('only one freq chip is active at a time', async () => {
    await agenda.clickFreqChip('1× / week')
    await agenda.clickFreqChip('3× / week')
    await expect(agenda.freqChip('1× / week')).not.toHaveClass(/active/)
    await expect(agenda.freqChip('3× / week')).toHaveClass(/active/)
  })

  test('selecting a freq chip reveals the days section', async () => {
    await expect(agenda.freqDaysSection()).not.toHaveClass(/visible/)
    await agenda.clickFreqChip('2× / week')
    await expect(agenda.freqDaysSection()).toHaveClass(/visible/)
  })

  test('all 7 day chips are rendered', async ({ page }) => {
    await expect(page.locator('#day-chips .freq-chip')).toHaveCount(7)
  })

  test('selecting Daily chip auto-selects Mon–Fri', async ({ page }) => {
    await agenda.clickFreqChip('Daily')
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
      await expect(agenda.dayChip(day)).toHaveClass(/active/)
    }
    await expect(agenda.dayChip('Sat')).not.toHaveClass(/active/)
    await expect(agenda.dayChip('Sun')).not.toHaveClass(/active/)
  })

  test('selecting 2×/week allows at most 2 days active', async () => {
    await agenda.clickFreqChip('2× / week')
    await agenda.clickDayChip('Mon')
    await agenda.clickDayChip('Wed')
    await agenda.clickDayChip('Fri')  // should bump Mon off
    await expect(agenda.dayChip('Mon')).not.toHaveClass(/active/)
    await expect(agenda.dayChip('Wed')).toHaveClass(/active/)
    await expect(agenda.dayChip('Fri')).toHaveClass(/active/)
  })

  test('call-frequency hidden input updates when chip selected', async ({ page }) => {
    await agenda.clickFreqChip('3× / week')
    const val = await page.locator('#call-frequency').evaluate((el: HTMLInputElement) => el.value)
    expect(val).toBe('3× per week')
  })

  test('call-days hidden input updates when day chips selected', async ({ page }) => {
    await agenda.clickFreqChip('2× / week')
    await agenda.clickDayChip('Mon')
    await agenda.clickDayChip('Thu')
    const val = await page.locator('#call-days').evaluate((el: HTMLInputElement) => el.value)
    expect(val).toContain('Mon')
    expect(val).toContain('Thu')
  })
})

// ─── 6. Section 4 ────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Section 4: Escalation Path', () => {
  test.beforeEach(async ({ page }) => {
    const a = new KickoffAgendaPage(page)
    await a.goto()
  })

  test('shows Level 1 Delivery Manager and Level 2 Director of Sales', async ({ page }) => {
    const section4 = page.locator('.card').nth(3)
    await expect(section4).toContainText('Level 1')
    await expect(section4).toContainText('Delivery Manager')
    await expect(section4).toContainText('Level 2')
    await expect(section4).toContainText('Director of Sales')
  })

  test('escalation arrow SVG is rendered between the two levels', async ({ page }) => {
    const section4 = page.locator('.card').nth(3)
    await expect(section4.locator('svg path[d*="M0 8H24"]')).toBeVisible()
  })
})

// ─── 7. Section 5 ────────────────────────────────────────────────────────────

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

// ─── 8. Meta fields ───────────────────────────────────────────────────────────

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
    const options = await page.locator('#meta-engagement option').allTextContents()
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

// ─── 9. Sidebar ──────────────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Sidebar', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('sidebar is visible by default', async () => {
    await expect(agenda.sidebar()).toBeVisible()
    await expect(agenda.sidebar()).not.toHaveClass(/collapsed/)
  })

  test('sidebar contains search input', async () => {
    await expect(agenda.searchInput()).toBeVisible()
  })

  test('sidebar contains New Meeting button', async () => {
    await expect(agenda.newMeetingBtn()).toBeVisible()
    await expect(agenda.newMeetingBtn()).toContainText('New Meeting')
  })

  test('sidebar toggle button in header collapses the sidebar', async () => {
    await agenda.sidebarToggleBtn().click()
    await expect(agenda.sidebar()).toHaveClass(/collapsed/)
  })

  test('topbar ☰ Clients button also toggles sidebar', async () => {
    await agenda.sidebarToggleBtn().click()            // collapse first
    await expect(agenda.sidebar()).toHaveClass(/collapsed/)
    await agenda.topbarToggle().click()                // reopen via topbar
    await expect(agenda.sidebar()).not.toHaveClass(/collapsed/)
  })

  test('collapsed state persists to localStorage', async ({ page }) => {
    await agenda.sidebarToggleBtn().click()
    const stored = await page.evaluate(() => localStorage.getItem('ht_sidebar'))
    expect(stored).toBe('0')
  })

  test('open state is stored as "1" in localStorage', async ({ page }) => {
    // Default is open — close then reopen
    await agenda.sidebarToggleBtn().click()
    await agenda.sidebarToggleBtn().click()
    const stored = await page.evaluate(() => localStorage.getItem('ht_sidebar'))
    expect(stored).toBe('1')
  })

  test('sidebar starts collapsed when localStorage says 0', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('ht_sidebar', '0'))
    await agenda.goto()
    await expect(agenda.sidebar()).toHaveClass(/collapsed/)
  })

  test('sidebar client list section label is visible', async ({ page }) => {
    await expect(page.locator('.sidebar-section-lbl')).toContainText('Saved Meetings')
  })
})

// ─── 10. Sidebar Search ───────────────────────────────────────────────────────

test.describe('Kickoff Agenda — Sidebar Search', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
  })

  test('search input placeholder text is correct', async () => {
    await expect(agenda.searchInput()).toHaveAttribute('placeholder', 'Search clients…')
  })

  test('clear button is hidden when search is empty', async () => {
    await expect(agenda.searchClear()).toBeHidden()
  })

  test('clear button appears when user types in search', async () => {
    await agenda.searchInput().fill('Acme')
    await expect(agenda.searchClear()).toBeVisible()
  })

  test('clear button resets the search input', async () => {
    await agenda.searchInput().fill('Test Query')
    await agenda.searchClear().click()
    expect(await agenda.searchInput().inputValue()).toBe('')
    await expect(agenda.searchClear()).toBeHidden()
  })
})

// ─── 11. New Meeting button ───────────────────────────────────────────────────

test.describe('Kickoff Agenda — New Meeting button', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('New Meeting clears all form fields', async () => {
    await agenda.fillClient('Old Corp')
    await agenda.fillCloud('AWS')
    await agenda.fillPriority(1, 'Some priority')
    await agenda.fillNotes('Some notes')

    await agenda.newMeetingBtn().click()

    expect(await agenda.fieldValue('meta-client')).toBe('')
    expect(await agenda.fieldValue('access-cloud')).toBe('')
    expect(await agenda.fieldValue('priority-1')).toBe('')
    expect(await agenda.fieldValue('notes-aob')).toBe('')
  })

  test('New Meeting resets the engagement dropdown', async ({ page }) => {
    await agenda.selectEngagement('Fixed Price')
    await agenda.newMeetingBtn().click()
    const idx = await page.locator('#meta-engagement').evaluate((el: HTMLSelectElement) => el.selectedIndex)
    expect(idx).toBe(0)
  })

  test('New Meeting deactivates all frequency chips', async () => {
    await agenda.clickFreqChip('Daily')
    await agenda.newMeetingBtn().click()
    await expect(agenda.freqChip('Daily')).not.toHaveClass(/active/)
  })

  test('New Meeting focuses the client name input', async () => {
    await agenda.newMeetingBtn().click()
    // Give the setTimeout(100ms) in code a moment
    await new Promise(r => setTimeout(r, 200))
    const focused = await agenda.page.evaluate(() => document.activeElement?.id)
    expect(focused).toBe('meta-client')
  })
})

// ─── 12. Save → Email Modal ───────────────────────────────────────────────────

test.describe('Kickoff Agenda — Save button opens email modal', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('save button is visible in header', async () => {
    await expect(agenda.saveDbBtn()).toBeVisible()
  })

  test('save button has correct tooltip', async () => {
    await expect(agenda.saveDbBtn()).toHaveAttribute('title', 'Save / Send to Client')
  })

  test('clicking save without client name shows a toast not a modal', async () => {
    // No client name filled — should show error, not open modal
    await agenda.saveDbBtn().click()
    await expect(agenda.emailModal()).not.toHaveClass(/open/)
    await expect(agenda.toastLocator()).toContainText('Enter a client name first')
  })

  test('clicking save with client name opens email modal', async () => {
    await agenda.fillClient('Acme Corp')
    await agenda.saveDbBtn().click()
    await expect(agenda.emailModal()).toHaveClass(/open/)
  })

  test('email modal has correct heading', async () => {
    await agenda.fillClient('Acme Corp')
    await agenda.saveDbBtn().click()
    await expect(agenda.emailModal()).toContainText('Save & Send Kickoff Summary')
  })

  test('email modal has Save only and Save & Send buttons', async () => {
    await agenda.fillClient('Modal Test Client')
    await agenda.saveDbBtn().click()
    await expect(agenda.modalSaveOnlyBtn()).toBeVisible()
    await expect(agenda.modalSendBtn()).toBeVisible()
  })

  test('clicking overlay outside modal card closes the modal', async ({ page }) => {
    await agenda.fillClient('Acme')
    await agenda.saveDbBtn().click()
    await expect(agenda.emailModal()).toHaveClass(/open/)
    // Click the overlay itself (outside the card)
    await page.locator('#email-modal').click({ position: { x: 10, y: 10 } })
    await expect(agenda.emailModal()).not.toHaveClass(/open/)
  })
})

// ─── 13. Email Modal Validation ───────────────────────────────────────────────

test.describe('Kickoff Agenda — Email modal validation', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
    await agenda.fillClient('Validation Test Client')
    await agenda.saveDbBtn().click()
    // Wait for modal to be open
    await expect(agenda.emailModal()).toHaveClass(/open/)
  })

  test('Send & Send button with empty email adds error class to input', async () => {
    await agenda.modalSendBtn().click()
    await expect(agenda.modalEmailInput()).toHaveClass(/error/)
    // Modal stays open
    await expect(agenda.emailModal()).toHaveClass(/open/)
  })

  test('invalid email format adds error class to input', async () => {
    await agenda.modalEmailInput().fill('not-an-email')
    await agenda.modalSendBtn().click()
    await expect(agenda.modalEmailInput()).toHaveClass(/error/)
  })

  test('valid email removes error class', async () => {
    await agenda.modalEmailInput().fill('not-valid')
    await agenda.modalSendBtn().click()
    await expect(agenda.modalEmailInput()).toHaveClass(/error/)

    // Fix the email
    await agenda.modalEmailInput().fill('valid@client.com')
    // error class should be removed on input event (or on next click)
    await expect(agenda.modalEmailInput()).not.toHaveClass(/error/)
  })

  test('pressing Enter in email input triggers send', async ({ page }) => {
    // Intercept n8n so it doesn't actually POST
    await page.route('**/webhook/heaptrace-kickoff', route => route.fulfill({ status: 200, body: '{}' }))
    await page.route('**/supabase.co/**', route => route.fulfill({ status: 200, body: JSON.stringify([]) }))

    await agenda.modalEmailInput().fill('test@acme.com')
    await agenda.modalEmailInput().press('Enter')
    // Modal should start the save flow (error class should NOT be present)
    await expect(agenda.modalEmailInput()).not.toHaveClass(/error/)
  })
})

// ─── 14. n8n Webhook payload ──────────────────────────────────────────────────

test.describe('Kickoff Agenda — n8n webhook payload', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('save & send posts correct payload fields to n8n webhook', async ({ page }) => {
    // Capture the request body
    let capturedBody: Record<string, unknown> = {}

    // Mock Supabase upsert to succeed
    await page.route('**/rest/v1/kickoff_meetings**', route =>
      route.fulfill({ status: 200, body: JSON.stringify([{ client_name: 'Webhook Corp' }]) })
    )
    // Intercept n8n webhook
    await page.route('**/webhook/heaptrace-kickoff', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({ status: 200, body: '{}' })
    })

    // Fill required fields
    await agenda.fillClient('Webhook Corp')
    await agenda.fillDate('2025-07-10')
    await agenda.selectEngagement('Staff Augmentation')
    await agenda.fillCloud('AWS')
    await agenda.fillVCS('GitHub')
    await agenda.fillPM('Jira')
    await agenda.fillComms('Slack')
    await agenda.fillPriority(1, 'Deploy staging env')
    await agenda.fillPriority(2, 'Onboard team')
    await agenda.fillNotes('Send repo invite by Friday')

    // Trigger save → modal → send
    await agenda.saveDbBtn().click()
    await expect(agenda.emailModal()).toHaveClass(/open/)
    await agenda.modalEmailInput().fill('client@webhook.com')
    await agenda.modalSendBtn().click()

    // Wait for n8n route to be hit (modal closes on success)
    await expect(agenda.emailModal()).not.toHaveClass(/open/, { timeout: 15000 })

    // Verify payload
    expect(capturedBody.client_name).toBe('Webhook Corp')
    expect(capturedBody.client_email).toBe('client@webhook.com')
    expect(capturedBody.meeting_date).toBe('2025-07-10')
    expect(capturedBody.engagement_type).toBe('Staff Augmentation')
    expect(capturedBody.access_cloud).toBe('AWS')
    expect(capturedBody.access_vcs).toBe('GitHub')
    expect(capturedBody.access_pm).toBe('Jira')
    expect(capturedBody.access_comms).toBe('Slack')
    expect(capturedBody.priority_1).toBe('Deploy staging env')
    expect(capturedBody.priority_2).toBe('Onboard team')
    expect(capturedBody.notes_aob).toBe('Send repo invite by Friday')
    expect(capturedBody.pdf_base64).toBeUndefined()
    expect(capturedBody.pdf_filename).toBeUndefined()
  })

  test('save & send posts to the correct n8n cloud URL', async ({ page }) => {
    let hitUrl = ''
    await page.route('**/webhook/heaptrace-kickoff', route => {
      hitUrl = route.request().url()
      return route.fulfill({ status: 200, body: '{}' })
    })
    await page.route('**/rest/v1/kickoff_meetings**', route =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    )

    await agenda.fillClient('URL Check Corp')
    await agenda.saveDbBtn().click()
    await agenda.modalEmailInput().fill('check@acme.com')
    await agenda.modalSendBtn().click()
    await expect(agenda.emailModal()).not.toHaveClass(/open/, { timeout: 15000 })

    expect(hitUrl).toContain('heaptraceakhilesh.app.n8n.cloud')
    expect(hitUrl).toContain('heaptrace-kickoff')
  })

  test('shows toast "Saved & email sent" after successful n8n response', async ({ page }) => {
    await page.route('**/webhook/heaptrace-kickoff', route =>
      route.fulfill({ status: 200, body: '{}' })
    )
    await page.route('**/rest/v1/kickoff_meetings**', route =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    )

    await agenda.fillClient('Toast Test Corp')
    await agenda.saveDbBtn().click()
    await agenda.modalEmailInput().fill('toast@acme.com')
    await agenda.modalSendBtn().click()

    await expect(agenda.toastLocator()).toContainText('Saved & email sent to', { timeout: 15000 })
    await expect(agenda.toastLocator()).toContainText('toast@acme.com')
  })

  test('shows warning toast when n8n returns non-200', async ({ page }) => {
    await page.route('**/webhook/heaptrace-kickoff', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )
    await page.route('**/rest/v1/kickoff_meetings**', route =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    )

    await agenda.fillClient('Error Test Corp')
    await agenda.saveDbBtn().click()
    await agenda.modalEmailInput().fill('err@acme.com')
    await agenda.modalSendBtn().click()

    await expect(agenda.toastLocator()).toContainText('Saved, but email failed', { timeout: 15000 })
  })
})

// ─── 15. Active client pill ───────────────────────────────────────────────────

test.describe('Kickoff Agenda — Active client pill', () => {
  let agenda: KickoffAgendaPage

  test.beforeEach(async ({ page }) => {
    agenda = new KickoffAgendaPage(page)
    await agenda.goto()
    await agenda.clearStorage()
  })

  test('active client pill is hidden on fresh load', async () => {
    await expect(agenda.activePill()).not.toHaveClass(/show/)
  })

  test('pill appears after successful Supabase save', async ({ page }) => {
    await page.route('**/rest/v1/kickoff_meetings**', route =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    )
    await page.route('**/webhook/heaptrace-kickoff', route =>
      route.fulfill({ status: 200, body: '{}' })
    )

    await agenda.fillClient('Pill Test Corp')
    await agenda.saveDbBtn().click()
    await agenda.modalSaveOnlyBtn().click()

    await expect(agenda.activePill()).toHaveClass(/show/, { timeout: 10000 })
    await expect(page.locator('#active-client-name')).toContainText('Pill Test Corp')
  })
})

// ─── 16. localStorage persistence ────────────────────────────────────────────

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
    await agenda.saveViaJS()
    await page.reload()
    await page.waitForLoadState('networkidle')

    expect(await agenda.fieldValue('meta-client')).toBe('Reload Test Client')
    expect(await agenda.fieldValue('access-cloud')).toBe('GCP')
    expect(await agenda.fieldValue('priority-1')).toBe('Write tests first')
    expect(await agenda.fieldValue('notes-aob')).toBe('This should persist after reload')
  })

  test('all 12 fields are saved and restored', async ({ page }) => {
    const testData: Record<string, string> = {
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
    await page.reload()
    await page.waitForLoadState('networkidle')
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
    await expect(page.locator('.card-title').first()).toBeVisible()
  })
})

// ─── 17. Download PDF button ──────────────────────────────────────────────────

test.describe('Kickoff Agenda — Download PDF button', () => {
  test.beforeEach(async ({ page }) => {
    const a = new KickoffAgendaPage(page)
    await a.goto()
  })

  test('download button is a circular icon with no visible text', async ({ page }) => {
    const btn = page.locator('#download-btn')
    await expect(btn).toBeVisible()
    await expect(btn.locator('svg')).toBeVisible()
    const text = (await btn.textContent())?.trim() ?? ''
    expect(text).toBe('')
  })

  test('download button is enabled on page load', async ({ page }) => {
    await expect(page.locator('#download-btn')).toBeEnabled()
  })

  test('download button has accessibility title', async ({ page }) => {
    await expect(page.locator('#download-btn')).toHaveAttribute('title', 'Download PDF')
  })

  test('clicking download does not navigate away', async ({ page }) => {
    const urlBefore = page.url()
    await page.locator('#download-btn').click()
    await page.waitForTimeout(500)
    expect(page.url()).toBe(urlBefore)
  })
})

// ─── 18. Responsive layout ────────────────────────────────────────────────────

test.describe('Kickoff Agenda — responsive layout (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    const a = new KickoffAgendaPage(page)
    await a.goto()
  })

  test('all 6 sections are visible on mobile', async ({ page }) => {
    await expect(page.locator('.section-num')).toHaveCount(6)
  })

  test('tool grid stacks to single column on mobile', async ({ page }) => {
    const style = await page.locator('.tool-grid').evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    )
    expect(style.split(' ').length).toBe(1)
  })

  test('header title is readable at mobile font size', async ({ page }) => {
    const fontSize = await page.locator('.header-title').evaluate(el =>
      parseInt(window.getComputedStyle(el).fontSize)
    )
    expect(fontSize).toBeGreaterThanOrEqual(22)
  })
})

// ─── 19. Hub navigation ───────────────────────────────────────────────────────

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
