describe('Shell Application', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the shell application', () => {
    cy.contains('Shell Application')
    cy.get('nav').should('be.visible')
  })

  it('should have navigation links', () => {
    cy.get('nav').within(() => {
      cy.contains('Dashboard').should('be.visible')
      cy.contains('User Management').should('be.visible')
    })
  })

  it('should navigate to dashboard MFE', () => {
    cy.get('nav a[routerLink="/dashboard"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should navigate to user management MFE', () => {
    cy.get('nav a[routerLink="/users"]').click()
    cy.url().should('include', '/users')
  })
})
