/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>
      navigateToMFE(mfeName: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy=username]').type(username)
  cy.get('[data-cy=password]').type(password)
  cy.get('[data-cy=login-button]').click()
})

Cypress.Commands.add('navigateToMFE', (mfeName: string) => {
  cy.get(`[data-cy=nav-${mfeName}]`).click()
})
