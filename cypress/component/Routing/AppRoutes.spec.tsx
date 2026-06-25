import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import AppRoutes from 'src/routing/AppRoutes'
import { Storage } from 'src/libs/storage'

interface LocationSpyProps {
  onLocationChange: (location: string) => void
}

const LocationSpy = ({ onLocationChange }: LocationSpyProps) => {
  const location = useLocation()
  React.useEffect(() => {
    onLocationChange(location.pathname + location.search)
  }, [location, onLocationChange])
  return null
}

/**
 * All routes in AppRoutes that are protected by a RoleBAC guard.
 * Each entry is a concrete path (with example IDs for parameterized segments).
 * The test verifies that every one of these routes sits *inside* the
 * <Authenticated> wrapper: an unauthenticated visitor must be redirected to
 * /?redirectTo=<route> rather than landing on a NotFound page or the route
 * itself.
 */
const roleBACRoutes: string[] = [
  // researcher
  '/researcher_console',
  '/datasets',
  '/dar_collection/1',
  '/dar_application_review/1',
  '/progress_report_application/1',
  '/dar_application/1',
  // dataSubmitter | chairperson | admin
  '/dataset_submissions',
  '/data_submission_form',
  '/study_update/1',
  '/dataset_update/1',
  // member | signingOfficial | chairperson
  '/dar_vote_review/1',
  // member
  '/member_console',
  // signingOfficial (also wrapped in SOAcknowledged)
  '/signing_official_console/library_cards',
  '/signing_official_console/dar_requests',
  '/signing_official_console/dar_approvals',
  '/signing_official_console/data_submitters',
  '/signing_official_console/researchers_daa_associations',
  // chairperson
  '/chair_console',
  '/dac_datasets',
  // chairperson | admin
  '/manage_dac',
  '/manage_dac_datasets',
  '/manage_radar/1',
  // admin
  '/admin_review_collection/1',
  '/admin_manage_users',
  '/admin_edit_user/1',
  '/admin_manage_institutions/create_new',
  '/admin_manage_institutions/institutions/1',
  '/admin_manage_institutions',
  '/admin_manage_lc/',
  '/admin_manage_dar_collections/',
  '/manage_add_dac_daa',
]

describe('AppRoutes — RoleBAC routes are protected by Authenticated', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Storage, 'userIsLogged').returns(false)
  })

  roleBACRoutes.forEach((route) => {
    it(`redirects an unauthenticated user visiting "${route}" to the home page`, () => {
      const pageVisitStub = cy.stub()

      cy.mount(
        <MemoryRouter initialEntries={[route]}>
          <LocationSpy onLocationChange={pageVisitStub} />
          <AppRoutes isLogged={false} env="dev" />
        </MemoryRouter>,
      )

      // The Authenticated guard must redirect to /?redirectTo=<route>
      cy.wrap(pageVisitStub).should(
        'have.been.calledWith',
        `/?redirectTo=${route}`,
      )

      // The destination must be the home page, not a NotFound page
      cy.get('[data-cy="not-found"]').should('not.exist')
    })
  })
})
