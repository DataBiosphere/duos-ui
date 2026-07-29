export const handleSignIn = (redirectPath: string) => {
  // Set the redirectTo parameter without forcing a page reload
  const currentUrl = new URL(globalThis.location.href)
  currentUrl.searchParams.set('redirectTo', redirectPath)
  globalThis.history.replaceState({}, '', currentUrl)
  // Find the existing sign-in button in the header and programmatically click it
  // This will trigger the existing authentication flow with all proper session handling
  const signInButtons = document.querySelectorAll('button')
  const signInButton = Array.from(signInButtons).find(button =>
    button.textContent?.trim() === 'Sign In',
  )
  if (signInButton) {
    signInButton.click()
  }
  else {
    // Fallback - scroll to top where the sign-in button is located
    globalThis.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
