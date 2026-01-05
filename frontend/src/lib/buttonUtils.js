// Utility functions for button interactions and error handling

import { toast } from 'sonner'

/**
 * Handles an asynchronous action, showing success or error toasts.
 * @param {() => Promise<void>} action - The async function to execute.
 * @param {string} [successMessage] - Optional message to show on success.
 * @param {string} [errorMessage] - Optional message to show on error.
 */
export const handleAsyncButtonAction = async (
  action,
  successMessage,
  errorMessage
) => {
  try {
    await action()
    if (successMessage) {
      toast.success(successMessage)
    }
  } catch (error) {
    console.error('Button action failed:', error)
    toast.error(errorMessage || 'An error occurred. Please try again.')
  }
}

/**
 * Handles a synchronous action, showing success or error toasts.
 * @param {() => void} action - The sync function to execute.
 * @param {string} [successMessage] - Optional message to show on success.
 * @param {string} [errorMessage] - Optional message to show on error.
 */
export const handleSyncButtonAction = (
  action,
  successMessage,
  errorMessage
) => {
  try {
    action()
    if (successMessage) {
      toast.success(successMessage)
    }
  } catch (error) {
    console.error('Button action failed:', error)
    toast.error(errorMessage || 'An error occurred. Please try again.')
  }
}

/**
 * Wraps an async function to automatically handle loading state.
 * @param {(...args: any[]) => Promise<any>} asyncFn - The async function to wrap.
 * @param {(loading: boolean) => void} setLoading - The state setter for the loading state.
 * @returns {(...args: any[]) => Promise<any>} The wrapped function.
 */
export const withButtonLoading = (
  asyncFn,
  setLoading
) => {
  return async (...args) => {
    setLoading(true)
    try {
      return await asyncFn(...args)
    } finally {
      setLoading(false)
    }
  }
}

/**
 * Triggers a file download in the browser.
 * @param {string} content - The content of the file.
 * @param {string} filename - The desired name of the file.
 * @param {string} [mimeType='application/json'] - The MIME type of the file.
 */
export const downloadFile = (content, filename, mimeType = 'application/json') => {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${filename} downloaded successfully`)
  } catch (error) {
    console.error('Download failed:', error)
    toast.error('Download failed. Please try again.')
  }
}

/**
 * Copies text to the user's clipboard.
 * @param {string} text - The text to copy.
 * @param {string} [successMessage] - Optional message to show on success.
 */
export const copyToClipboard = async (text, successMessage) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage || 'Copied to clipboard')
  } catch (error) {
    console.error('Copy failed:', error)
    // Fallback for older browsers or insecure contexts
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success(successMessage || 'Copied to clipboard')
    } catch (fallbackError) {
      toast.error('Failed to copy to clipboard')
    }
    document.body.removeChild(textArea)
  }
}