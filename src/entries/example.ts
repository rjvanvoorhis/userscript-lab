/**
 * Example Entry Point
 * This file demonstrates how to bootstrap a userscript using the composition root.
 * Each userscript should have its own entry point that initializes dependencies
 * and starts the application.
 */

import { createLogger } from '@core/logger'
import type { StorageContract } from '@application/Shared'
import { LocalStorageAdapter } from '@infrastructure/Shared'

const logger = createLogger({ context: 'ExampleApp' })

/**
 * Initialize the application with its dependencies
 */
function initializeApp(storage: StorageContract) {
  logger.info('Initializing example userscript')

  // Your application logic here
  // All dependencies are injected, making the code testable and maintainable
}

/**
 * Main entry point - runs when the userscript starts
 */
function main() {
  try {
    // Create implementations (this is where composition happens)
    const storage = new LocalStorageAdapter()

    // Initialize the app
    initializeApp(storage)

    logger.info('Example userscript started successfully')
  } catch (error) {
    logger.error('Failed to start userscript', error as Error)
  }
}

// Start the userscript
main()
